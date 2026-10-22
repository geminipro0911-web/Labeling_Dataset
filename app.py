import os
import sys
import asyncio
from pathlib import Path
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager

# Configure UTF-8 on Windows console to prevent cp1252 charmap encoding errors
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from fastapi import FastAPI, Depends, HTTPException, status, Request, Response
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from PIL import Image

import config
import database
from auth import get_current_user, COOKIE_NAME
from yolo_utils import (
    BoundingBox, parse_label_file, write_yolo_labels, MIN_BOX_PIXEL_SIZE
)

# Concurrency lock to prevent race conditions during atomic DB operations
_db_lock = asyncio.Lock()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB and scan dataset
    database.init_db()
    sync_result = database.sync_dataset_to_db(config.DATASET_DIR)
    print("=" * 65)
    print(">> YOLOv8 Collaborative Annotation Platform is READY!")
    print(f">> Dataset Directory: {config.DATASET_DIR.resolve()}")
    print(f">> Dataset Sync: {sync_result}")
    print(f">> Local Access:      http://localhost:{config.PORT}")
    print(f">> LAN Access:        http://{config.LAN_IP}:{config.PORT}")
    print("=" * 65)
    yield
    # Shutdown

app = FastAPI(
    title="YOLOv8 Collaborative Annotation Platform",
    version="1.0.0",
    description="LAN-accessible multi-user bounding box annotation tool with anti-collision locking.",
    lifespan=lifespan
)

# CORS middleware for LAN accessibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic schemas
class BoxPayload(BaseModel):
    xmin: float
    ymin: float
    xmax: float
    ymax: float
    class_id: Optional[int] = None

class SaveLabelsRequest(BaseModel):
    boxes: List[BoxPayload] = Field(default_factory=list)
    confirmed_empty: bool = False

class HeartbeatRequest(BaseModel):
    filename: str

class BackRequest(BaseModel):
    current_filename: Optional[str] = None

# Static and Templates
static_dir = config.BASE_DIR / "static"
static_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

@app.get("/")
async def serve_index():
    index_path = config.BASE_DIR / "templates" / "index.html"
    if not index_path.exists():
        # Fallback to static if placed there
        index_path = static_dir / "index.html"
    return FileResponse(str(index_path))

@app.get("/api/classes")
async def get_defect_classes():
    """Returns the defect classes defined in class.txt."""
    classes = config.load_classes(config.DATASET_DIR)
    return {
        "classes": [{"id": k, "name": v} for k, v in sorted(classes.items())]
    }

@app.get("/api/status")
async def get_system_status(request: Request):
    """Returns statistics, classes, network IP, and user info."""
    user_id = request.headers.get("X-User-Id") or request.cookies.get(COOKIE_NAME) or ""
    classes = config.load_classes(config.DATASET_DIR)
    stats = database.get_stats(user_id)
    return {
        "lan_ip": config.LAN_IP,
        "port": config.PORT,
        "lan_url": f"http://{config.LAN_IP}:{config.PORT}",
        "current_user": user_id,
        "stats": stats,
        "classes": classes
    }

@app.get("/api/leaderboard")
async def get_leaderboard():
    """Returns top users ranked by number of labeled images."""
    leaderboard = database.get_leaderboard()
    return {"leaderboard": leaderboard}

@app.post("/api/scan")
async def rescan_dataset():
    """Rescans dataset directory for new images."""
    async with _db_lock:
        result = database.sync_dataset_to_db(config.DATASET_DIR)
    return {"message": "Dataset scanned successfully", "result": result}

@app.get("/api/images/next")
async def get_next_image(current_user: str = Depends(get_current_user)):
    """
    Acquires and locks the next available image for the authenticated user.
    """
    async with _db_lock:
        img_info = database.acquire_next_image(current_user)

    if not img_info:
        return {
            "has_image": False,
            "message": "All images are currently labeled or being processed by other team members! 🎉"
        }

    filename = img_info["filename"]
    original_class_id = img_info["original_class_id"]
    image_path = config.DATASET_DIR / filename
    txt_path = config.DATASET_DIR / f"{Path(filename).stem}.txt"

    # Get image dimensions
    img_w, img_h = 1000, 1000
    try:
        with Image.open(image_path) as im:
            img_w, img_h = im.size
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to open image file '{filename}': {str(e)}"
        )

    # Parse existing labels
    class_id_from_file, boxes, is_labeled = parse_label_file(txt_path, img_w, img_h)
    
    # Class name lookup
    classes = config.load_classes(config.DATASET_DIR)
    class_name = classes.get(original_class_id, f"Defect Class {original_class_id}")

    return {
        "has_image": True,
        "filename": filename,
        "original_class_id": original_class_id,
        "class_name": class_name,
        "image_width": img_w,
        "image_height": img_h,
        "image_url": f"/api/images/file/{filename}",
        "boxes": [b.to_dict() for b in boxes],
        "is_previously_labeled": is_labeled,
        "status": img_info.get("status", "locked")
    }

@app.post("/api/images/{filename}/save")
async def save_image_labels(
    filename: str,
    payload: SaveLabelsRequest,
    current_user: str = Depends(get_current_user)
):
    """
    Converts drawn boxes into standard YOLOv8 format and overwrites the .txt file.
    Updates SQLite database status to 'labeled'.
    """
    image_path = config.DATASET_DIR / filename
    txt_path = config.DATASET_DIR / f"{Path(filename).stem}.txt"

    if not image_path.exists():
        raise HTTPException(status_code=404, detail="Image file not found on disk.")

    # Get image dimensions
    try:
        with Image.open(image_path) as im:
            img_w, img_h = im.size
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read image dimensions: {str(e)}")

    # Retrieve original class_id from database
    with database.get_db() as conn:
        row = conn.execute(
            "SELECT original_class_id FROM images WHERE filename = ?", (filename,)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Image record not found in database.")
        original_class_id = row["original_class_id"]

    # Convert payloads to BoundingBox objects
    boxes: List[BoundingBox] = []
    for b in payload.boxes:
        box = BoundingBox(
            xmin=b.xmin,
            ymin=b.ymin,
            xmax=b.xmax,
            ymax=b.ymax,
            class_id=original_class_id # All boxes inherit original_class_id
        )
        if box.is_valid(MIN_BOX_PIXEL_SIZE):
            boxes.append(box)

    # Empty box confirmation check (if frontend sent empty without confirmation)
    if not boxes and not payload.confirmed_empty:
        return JSONResponse(
            status_code=400,
            content={
                "require_confirmation": True,
                "message": "No bounding boxes drawn. Do you want to save this as a negative sample (no defect)?"
            }
        )

    # Write YOLO format to .txt file
    write_yolo_labels(txt_path, boxes, img_w, img_h)

    # Update database status atomically
    async with _db_lock:
        database.mark_image_labeled(filename, current_user)
        stats = database.get_stats(current_user)

    return {
        "success": True,
        "filename": filename,
        "saved_box_count": len(boxes),
        "stats": stats
    }

@app.post("/api/images/back")
async def get_previous_image(
    payload: BackRequest,
    current_user: str = Depends(get_current_user)
):
    """
    Loads the previous image labeled by current_user.
    Converts saved YOLOv8 coordinates back to pixel coordinates so user can review/redraw.
    """
    async with _db_lock:
        prev_img = database.get_previous_image_for_user(
            current_user,
            current_filename=payload.current_filename
        )

    if not prev_img:
        raise HTTPException(
            status_code=404,
            detail="No previous labeled image found in your labeling history."
        )

    filename = prev_img["filename"]
    original_class_id = prev_img["original_class_id"]
    image_path = config.DATASET_DIR / filename
    txt_path = config.DATASET_DIR / f"{Path(filename).stem}.txt"

    # Dimensions
    try:
        with Image.open(image_path) as im:
            img_w, img_h = im.size
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read image dimensions: {str(e)}")

    # Parse saved YOLO boxes
    _, boxes, _ = parse_label_file(txt_path, img_w, img_h)

    classes = config.load_classes(config.DATASET_DIR)
    class_name = classes.get(original_class_id, f"Defect Class {original_class_id}")

    return {
        "has_image": True,
        "filename": filename,
        "original_class_id": original_class_id,
        "class_name": class_name,
        "image_width": img_w,
        "image_height": img_h,
        "image_url": f"/api/images/file/{filename}",
        "boxes": [b.to_dict() for b in boxes],
        "is_previously_labeled": True,
        "status": "locked"
    }

@app.post("/api/heartbeat")
async def renew_image_lock(
    payload: HeartbeatRequest,
    current_user: str = Depends(get_current_user)
):
    """Periodic heartbeat from frontend to keep active image lock from expiring."""
    async with _db_lock:
        renewed = database.renew_lock(payload.filename, current_user)
    return {"renewed": renewed}

@app.post("/api/images/{filename}/release")
async def release_image_lock(
    filename: str,
    current_user: str = Depends(get_current_user)
):
    """Releases lock on an image if user leaves or switches."""
    async with _db_lock:
        released = database.release_lock(filename, current_user)
    return {"released": released}

@app.get("/api/images/file/{filename}")
async def serve_image_file(filename: str):
    """Serves the raw image file securely."""
    image_path = (config.DATASET_DIR / filename).resolve()

    # Prevent directory traversal
    if not str(image_path).startswith(str(config.DATASET_DIR.resolve())):
        raise HTTPException(status_code=403, detail="Access denied.")

    if not image_path.exists() or not image_path.is_file():
        raise HTTPException(status_code=404, detail="Image file not found.")

    suffix = image_path.suffix.lower()
    media_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".bmp": "image/bmp",
        ".webp": "image/webp"
    }
    media_type = media_types.get(suffix, "application/octet-stream")

    return FileResponse(
        str(image_path),
        media_type=media_type,
        headers={"Cache-Control": "public, max-age=3600"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host=config.HOST, port=config.PORT, reload=False)
