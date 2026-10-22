import sqlite3
import datetime
from pathlib import Path
from typing import Optional, Dict, List, Any, Tuple
from contextlib import contextmanager
from PIL import Image

from config import DB_PATH, LOCK_TIMEOUT_SECONDS, DATASET_DIR, IMAGE_EXTENSIONS
from yolo_utils import parse_label_file

@contextmanager
def get_db():
    """Provides a SQLite connection with WAL enabled and row factory."""
    conn = sqlite3.connect(str(DB_PATH), timeout=30.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA journal_mode = WAL;")
        conn.execute("PRAGMA synchronous = NORMAL;")
        yield conn
    finally:
        conn.close()

def init_db():
    """Initializes tables and indexes."""
    with get_db() as conn:
        with conn:
            conn.execute("""
            CREATE TABLE IF NOT EXISTS images (
                filename TEXT PRIMARY KEY,
                original_class_id INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'unlabeled', -- 'unlabeled', 'locked', 'labeled'
                locked_by TEXT,
                locked_at TIMESTAMP,
                labeled_by TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)

            conn.execute("""
            CREATE TABLE IF NOT EXISTS user_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                filename TEXT NOT NULL,
                action TEXT NOT NULL, -- 'labeled', 'reviewed'
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)

            # Create indices for quick lookups
            conn.execute("CREATE INDEX IF NOT EXISTS idx_images_status ON images(status);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_images_locked_by ON images(locked_by);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_images_labeled_by ON images(labeled_by);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_history_user ON user_history(user_id, id DESC);")

def sync_dataset_to_db(dataset_dir: Path = None) -> Dict[str, int]:
    """
    Scans the dataset directory and syncs all image files into SQLite.
    Reads the initial <class_id> from matching .txt files and permanently saves it.
    """
    target_dir = dataset_dir or DATASET_DIR
    if not target_dir.exists():
        return {"total_scanned": 0, "new_added": 0, "already_present": 0}

    scanned_count = 0
    new_added = 0
    already_present = 0

    with get_db() as conn:
        with conn:
            # Get existing filenames
            cursor = conn.execute("SELECT filename FROM images")
            existing = {row["filename"] for row in cursor.fetchall()}

            # Walk through files
            for file_path in target_dir.iterdir():
                if file_path.is_file() and file_path.suffix.lower() in IMAGE_EXTENSIONS:
                    scanned_count += 1
                    filename = file_path.name
                    if filename in existing:
                        already_present += 1
                        continue

                    # Corresponding .txt file
                    txt_path = target_dir / f"{file_path.stem}.txt"
                    
                    # Read image dimensions using PIL
                    img_w, img_h = 1000, 1000
                    try:
                        with Image.open(file_path) as im:
                            img_w, img_h = im.size
                    except Exception:
                        pass

                    class_id, boxes, is_labeled = parse_label_file(txt_path, img_w, img_h)
                    initial_class_id = class_id if class_id is not None else 0
                    initial_status = "labeled" if is_labeled else "unlabeled"

                    conn.execute("""
                        INSERT INTO images (filename, original_class_id, status, updated_at)
                        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                    """, (filename, initial_class_id, initial_status))
                    new_added += 1

    return {
        "total_scanned": scanned_count,
        "new_added": new_added,
        "already_present": already_present
    }

def get_stats(user_id: str) -> Dict[str, Any]:
    """Retrieves labeling statistics."""
    with get_db() as conn:
        total = conn.execute("SELECT COUNT(*) FROM images").fetchone()[0]
        labeled = conn.execute("SELECT COUNT(*) FROM images WHERE status = 'labeled'").fetchone()[0]
        user_labeled = conn.execute(
            "SELECT COUNT(*) FROM images WHERE status = 'labeled' AND labeled_by = ?", 
            (user_id,)
        ).fetchone()[0]
        locked = conn.execute("SELECT COUNT(*) FROM images WHERE status = 'locked'").fetchone()[0]
        unlabeled = conn.execute("SELECT COUNT(*) FROM images WHERE status = 'unlabeled'").fetchone()[0]

    return {
        "total_images": total,
        "total_labeled": labeled,
        "labeled_by_you": user_labeled,
        "locked": locked,
        "unlabeled": unlabeled,
        "progress_percent": round((labeled / total * 100.0) if total > 0 else 0.0, 1)
    }

def get_leaderboard() -> List[Dict[str, Any]]:
    """Returns top users ranked by the number of labeled images."""
    with get_db() as conn:
        cursor = conn.execute("""
            SELECT labeled_by, COUNT(*) as count 
            FROM images 
            WHERE status = 'labeled' AND labeled_by IS NOT NULL AND TRIM(labeled_by) != ''
            GROUP BY labeled_by 
            ORDER BY count DESC, labeled_by ASC
        """)
        rows = cursor.fetchall()

    leaderboard = []
    for rank, row in enumerate(rows, start=1):
        leaderboard.append({
            "rank": rank,
            "username": row["labeled_by"],
            "count": row["count"],
            "is_top4": rank <= 4
        })
    return leaderboard

def acquire_next_image(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Atomically locks and returns the next image for the given user.
    1. If the user already has an active locked image, returns it.
    2. Otherwise, finds an unlabeled image or an expired locked image (>10 min inactive).
    3. Atomically marks it as locked by user_id.
    """
    now = datetime.datetime.utcnow()
    timeout_threshold = (now - datetime.timedelta(seconds=LOCK_TIMEOUT_SECONDS)).strftime("%Y-%m-%d %H:%M:%S")

    with get_db() as conn:
        # Step 1: Check if user already holds an active lock
        row = conn.execute("""
            SELECT filename, original_class_id, status, locked_by, locked_at
            FROM images
            WHERE status = 'locked' AND locked_by = ?
            ORDER BY locked_at DESC
            LIMIT 1
        """, (user_id,)).fetchone()

        if row:
            # Refresh lock timestamp
            with conn:
                conn.execute("""
                    UPDATE images
                    SET locked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                    WHERE filename = ?
                """, (row["filename"],))
            return dict(row)

        # Step 2: Atomic acquire next image (unlabeled or expired lock)
        with conn:
            # Select target filename within transaction
            target = conn.execute("""
                SELECT filename, original_class_id
                FROM images
                WHERE status = 'unlabeled'
                   OR (status = 'locked' AND (locked_at IS NULL OR locked_at < ?))
                ORDER BY 
                   CASE WHEN status = 'unlabeled' THEN 0 ELSE 1 END ASC,
                   filename ASC
                LIMIT 1
            """, (timeout_threshold,)).fetchone()

            if not target:
                return None

            filename = target["filename"]
            original_class_id = target["original_class_id"]

            conn.execute("""
                UPDATE images
                SET status = 'locked',
                    locked_by = ?,
                    locked_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE filename = ?
            """, (user_id, filename))

            return {
                "filename": filename,
                "original_class_id": original_class_id,
                "status": "locked",
                "locked_by": user_id
            }

def mark_image_labeled(filename: str, user_id: str) -> bool:
    """Marks an image as labeled by user_id and records to history."""
    with get_db() as conn:
        with conn:
            cursor = conn.execute("""
                UPDATE images
                SET status = 'labeled',
                    labeled_by = ?,
                    locked_by = NULL,
                    locked_at = NULL,
                    updated_at = CURRENT_TIMESTAMP
                WHERE filename = ?
            """, (user_id, filename))

            if cursor.rowcount > 0:
                conn.execute("""
                    INSERT INTO user_history (user_id, filename, action)
                    VALUES (?, ?, 'labeled')
                """, (user_id, filename))
                return True
            return False

def get_previous_image_for_user(user_id: str, current_filename: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Finds the previous image labeled by current_user.
    Allows user to go Back, reviews/redrafts the labels.
    """
    with get_db() as conn:
        # If current_filename is provided, unlock it if it's currently locked
        if current_filename:
            with conn:
                conn.execute("""
                    UPDATE images
                    SET status = 'unlabeled', locked_by = NULL, locked_at = NULL
                    WHERE filename = ? AND status = 'locked' AND locked_by = ?
                """, (current_filename, user_id))

        # Query history for the last labeled image by user that is different from current_filename
        query = """
            SELECT filename
            FROM user_history
            WHERE user_id = ?
        """
        params = [user_id]
        if current_filename:
            query += " AND filename != ?"
            params.append(current_filename)
        query += " ORDER BY id DESC LIMIT 1"

        history_row = conn.execute(query, params).fetchone()
        if not history_row:
            # Fallback: find any image labeled by this user
            fallback_row = conn.execute("""
                SELECT filename, original_class_id, status
                FROM images
                WHERE labeled_by = ?
                ORDER BY updated_at DESC
                LIMIT 1
            """, (user_id,)).fetchone()
            if not fallback_row:
                return None
            target_filename = fallback_row["filename"]
        else:
            target_filename = history_row["filename"]

        # Fetch image info
        img_row = conn.execute("""
            SELECT filename, original_class_id, status
            FROM images
            WHERE filename = ?
        """, (target_filename,)).fetchone()

        if not img_row:
            return None

        # Lock it for editing, preserving status if already labeled
        with conn:
            conn.execute("""
                UPDATE images
                SET locked_by = ?,
                    locked_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE filename = ?
            """, (user_id, target_filename))

        return dict(img_row)

def renew_lock(filename: str, user_id: str) -> bool:
    """Heartbeat endpoint handler: updates locked_at to keep lock fresh."""
    with get_db() as conn:
        with conn:
            cursor = conn.execute("""
                UPDATE images
                SET locked_at = CURRENT_TIMESTAMP
                WHERE filename = ? AND locked_by = ? AND status = 'locked'
            """, (filename, user_id))
            return cursor.rowcount > 0

def release_lock(filename: str, user_id: str) -> bool:
    """Releases a lock if the user navigates away or logs out."""
    with get_db() as conn:
        with conn:
            cursor = conn.execute("""
                UPDATE images
                SET status = 'unlabeled', locked_by = NULL, locked_at = NULL
                WHERE filename = ? AND locked_by = ? AND status = 'locked'
            """, (filename, user_id))
            return cursor.rowcount > 0
