import os
import shutil
import pytest
from pathlib import Path
from PIL import Image

from yolo_utils import BoundingBox, parse_label_file, write_yolo_labels, MIN_BOX_PIXEL_SIZE
import database
import config

TEST_DATASET_DIR = Path("tests/test_dataset")

@pytest.fixture(autouse=True)
def setup_test_environment(monkeypatch):
    """Sets up a clean temporary test dataset and sqlite database for each test."""
    TEST_DATASET_DIR.mkdir(parents=True, exist_ok=True)
    test_db = TEST_DATASET_DIR / "test_labeling.db"
    if test_db.exists():
        test_db.unlink()

    monkeypatch.setattr(config, "DATASET_DIR", TEST_DATASET_DIR)
    monkeypatch.setattr(config, "DB_PATH", test_db)
    monkeypatch.setattr(database, "DATASET_DIR", TEST_DATASET_DIR)
    monkeypatch.setattr(database, "DB_PATH", test_db)

    # Initialize DB
    database.init_db()

    yield

    # Teardown
    if TEST_DATASET_DIR.exists():
        shutil.rmtree(TEST_DATASET_DIR, ignore_errors=True)


def test_yolo_coordinate_roundtrip():
    """Verify that pixel -> YOLO -> pixel roundtrips accurately."""
    img_w, img_h = 1920, 1080
    orig_box = BoundingBox(xmin=100.0, ymin=200.0, xmax=400.0, ymax=600.0, class_id=3)

    # Convert to YOLO
    xc, yc, w, h = orig_box.to_yolo(img_w, img_h)
    assert 0.0 <= xc <= 1.0
    assert 0.0 <= yc <= 1.0
    assert 0.0 <= w <= 1.0
    assert 0.0 <= h <= 1.0

    # Reverse back to pixels
    recovered = BoundingBox.from_yolo(3, xc, yc, w, h, img_w, img_h)
    assert pytest.approx(recovered.xmin, abs=0.5) == 100.0
    assert pytest.approx(recovered.ymin, abs=0.5) == 200.0
    assert pytest.approx(recovered.xmax, abs=0.5) == 400.0
    assert pytest.approx(recovered.ymax, abs=0.5) == 600.0


def test_yolo_clamp_and_tiny_click():
    """Verify coordinates clamping and < 5px accidental click rejection."""
    img_w, img_h = 1000, 1000
    # Out of bounds coordinates
    oob_box = BoundingBox(xmin=-50.0, ymin=-20.0, xmax=1050.0, ymax=1100.0, class_id=0)
    clamped = oob_box.clamp(img_w, img_h)
    assert clamped.xmin == 0.0
    assert clamped.ymin == 0.0
    assert clamped.xmax == 1000.0
    assert clamped.ymax == 1000.0

    # Tiny accidental click (< 5px)
    tiny_box = BoundingBox(xmin=100.0, ymin=100.0, xmax=103.0, ymax=104.0, class_id=1)
    assert not tiny_box.is_valid(MIN_BOX_PIXEL_SIZE)

    valid_box = BoundingBox(xmin=100.0, ymin=100.0, xmax=110.0, ymax=110.0, class_id=1)
    assert valid_box.is_valid(MIN_BOX_PIXEL_SIZE)


def test_initial_state_single_integer_parsing():
    """Verify CRITICAL INITIAL STATE: reading single integer <class_id> from .txt."""
    txt_path = TEST_DATASET_DIR / "sample_001.txt"
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write("4\n")

    class_id, boxes, is_labeled = parse_label_file(txt_path, 800, 600)
    assert class_id == 4
    assert len(boxes) == 0
    assert is_labeled is False


def test_labeled_yolo_parsing_and_writing():
    """Verify writing standard YOLOv8 format and parsing it back."""
    txt_path = TEST_DATASET_DIR / "sample_002.txt"
    img_w, img_h = 1000, 800
    boxes = [
        BoundingBox(100, 150, 300, 450, class_id=2),
        BoundingBox(500, 400, 650, 700, class_id=2)
    ]

    write_yolo_labels(txt_path, boxes, img_w, img_h)

    # Read lines from txt
    with open(txt_path, "r", encoding="utf-8") as f:
        lines = [l.strip() for l in f if l.strip()]
    assert len(lines) == 2
    for line in lines:
        parts = line.split()
        assert len(parts) == 5
        assert parts[0] == "2"

    # Parse back
    c_id, recovered_boxes, is_labeled = parse_label_file(txt_path, img_w, img_h)
    assert c_id == 2
    assert len(recovered_boxes) == 2
    assert is_labeled is True


def test_dataset_sync_and_original_class_id_preservation():
    """Verify that original_class_id is saved permanently and never lost."""
    # Create 3 dummy image/label pairs
    for i in range(1, 4):
        img_name = f"test_{i:03d}.jpg"
        txt_name = f"test_{i:03d}.txt"
        im = Image.new("RGB", (640, 480), color=(100, 100, 100))
        im.save(TEST_DATASET_DIR / img_name)
        with open(TEST_DATASET_DIR / txt_name, "w", encoding="utf-8") as f:
            f.write(f"{i}\n")

    res = database.sync_dataset_to_db(TEST_DATASET_DIR)
    assert res["new_added"] == 3

    # Check original_class_id in DB
    with database.get_db() as conn:
        rows = conn.execute("SELECT filename, original_class_id, status FROM images ORDER BY filename").fetchall()
        assert len(rows) == 3
        assert rows[0]["filename"] == "test_001.jpg"
        assert rows[0]["original_class_id"] == 1
        assert rows[0]["status"] == "unlabeled"


def test_multi_user_anti_collision_locking():
    """Verify that multiple users requesting images never receive the same image."""
    for i in range(1, 4):
        im = Image.new("RGB", (640, 480), color=(120, 120, 120))
        im.save(TEST_DATASET_DIR / f"img_{i:03d}.png")
        with open(TEST_DATASET_DIR / f"img_{i:03d}.txt", "w", encoding="utf-8") as f:
            f.write("0\n")

    database.sync_dataset_to_db(TEST_DATASET_DIR)

    # User 1 acquires image
    img_u1 = database.acquire_next_image("User_Alice")
    assert img_u1 is not None
    assert img_u1["locked_by"] == "User_Alice"

    # User 2 acquires image
    img_u2 = database.acquire_next_image("User_Bob")
    assert img_u2 is not None
    assert img_u2["locked_by"] == "User_Bob"
    # Ensure User Bob got a DIFFERENT image than User Alice!
    assert img_u1["filename"] != img_u2["filename"]

    # User 3 acquires image
    img_u3 = database.acquire_next_image("User_Charlie")
    assert img_u3 is not None
    assert img_u3["filename"] not in (img_u1["filename"], img_u2["filename"])

    # User 4 tries to acquire when all 3 are locked
    img_u4 = database.acquire_next_image("User_David")
    assert img_u4 is None  # No images available! Anti-collision success


def test_lock_renewal_and_reconnection():
    """Verify that a user who reloads receives their own locked image back."""
    im = Image.new("RGB", (640, 480))
    im.save(TEST_DATASET_DIR / "sample.jpg")
    with open(TEST_DATASET_DIR / "sample.txt", "w") as f:
        f.write("5\n")

    database.sync_dataset_to_db(TEST_DATASET_DIR)

    img1 = database.acquire_next_image("Alice")
    assert img1["filename"] == "sample.jpg"

    # Alice reloads page / requests again
    img2 = database.acquire_next_image("Alice")
    assert img2["filename"] == "sample.jpg"
    assert img2["locked_by"] == "Alice"


def test_lock_expiration():
    """Verify that after timeout (>10 minutes), expired locks can be claimed."""
    im = Image.new("RGB", (640, 480))
    im.save(TEST_DATASET_DIR / "expiring.jpg")
    with open(TEST_DATASET_DIR / "expiring.txt", "w") as f:
        f.write("2\n")

    database.sync_dataset_to_db(TEST_DATASET_DIR)

    # Alice locks image
    database.acquire_next_image("Alice")

    # Manually backdate locked_at by 15 minutes
    with database.get_db() as conn:
        with conn:
            conn.execute("""
                UPDATE images
                SET locked_at = datetime(CURRENT_TIMESTAMP, '-15 minutes')
                WHERE filename = 'expiring.jpg'
            """)

    # Bob should now be able to claim the expired image!
    img_bob = database.acquire_next_image("Bob")
    assert img_bob is not None
    assert img_bob["filename"] == "expiring.jpg"
    assert img_bob["locked_by"] == "Bob"


def test_leaderboard_and_back_history():
    """Verify leaderboard ranking and Back button history retrieval."""
    for i in range(1, 5):
        im = Image.new("RGB", (640, 480))
        im.save(TEST_DATASET_DIR / f"pic_{i}.jpg")
        with open(TEST_DATASET_DIR / f"pic_{i}.txt", "w") as f:
            f.write("1\n")
    database.sync_dataset_to_db(TEST_DATASET_DIR)

    # User Alice labels 2 images
    database.mark_image_labeled("pic_1.jpg", "Alice")
    database.mark_image_labeled("pic_2.jpg", "Alice")

    # User Bob labels 1 image
    database.mark_image_labeled("pic_3.jpg", "Bob")

    leaderboard = database.get_leaderboard()
    assert len(leaderboard) == 2
    assert leaderboard[0]["username"] == "Alice"
    assert leaderboard[0]["count"] == 2
    assert leaderboard[0]["rank"] == 1
    assert leaderboard[0]["is_top4"] is True

    assert leaderboard[1]["username"] == "Bob"
    assert leaderboard[1]["count"] == 1
    assert leaderboard[1]["rank"] == 2

    # Test Back button for Alice
    prev = database.get_previous_image_for_user("Alice", current_filename="pic_2.jpg")
    assert prev is not None
    assert prev["filename"] == "pic_1.jpg"
