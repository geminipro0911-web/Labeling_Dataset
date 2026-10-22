import os
import socket
from pathlib import Path
from typing import Dict, List

# Base workspace directory
BASE_DIR = Path(__file__).resolve().parent

# Server Network Configuration
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))

# Concurrency & Lock settings
# 10 minutes of inactivity unlocks an image
LOCK_TIMEOUT_SECONDS = int(os.getenv("LOCK_TIMEOUT_SECONDS", 600))

# Database Path
DB_PATH = BASE_DIR / "labeling_state.db"

# Dataset Directory Auto-Detection
def resolve_dataset_dir() -> Path:
    env_dir = os.getenv("DATASET_DIR")
    if env_dir:
        p = Path(env_dir).resolve()
        if p.exists():
            return p

    # Check ./dataset
    dataset_subdir = BASE_DIR / "dataset"
    if dataset_subdir.exists():
        return dataset_subdir

    # Check if class.txt or image files are in root
    has_class_txt = (BASE_DIR / "class.txt").exists()
    has_images = any(BASE_DIR.glob("*.jpg")) or any(BASE_DIR.glob("*.png")) or any(BASE_DIR.glob("*.jpeg"))
    if has_class_txt or has_images:
        return BASE_DIR

    # Default to ./dataset (will be created if missing)
    dataset_subdir.mkdir(parents=True, exist_ok=True)
    return dataset_subdir

DATASET_DIR = resolve_dataset_dir()

# Supported image extensions
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

def get_lan_ip() -> str:
    """Find the best matching local network IP address."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Does not actually make a connection, but selects outbound network interface
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except Exception:
        try:
            ip = socket.gethostbyname(socket.gethostname())
        except Exception:
            ip = "127.0.0.1"
    finally:
        s.close()
    return ip

LAN_IP = get_lan_ip()

def load_classes(dataset_path: Path = None) -> Dict[int, str]:
    """
    Reads class.txt from dataset directory.
    Supports either plain lines:
      Scratch / Vết xước
      Dent / Vết lõm
    Or indexed lines:
      0: Scratch / Vết xước
      1: Dent / Vết lõm
    Returns mapping: {0: "...", 1: "...", ...}
    """
    target_path = (dataset_path or DATASET_DIR) / "class.txt"
    classes = {}
    if target_path.exists():
        with open(target_path, "r", encoding="utf-8") as f:
            lines = [line.strip() for line in f if line.strip()]
            for idx, line in enumerate(lines):
                if ":" in line:
                    parts = line.split(":", 1)
                    if parts[0].strip().isdigit():
                        c_id = int(parts[0].strip())
                        c_name = parts[1].strip()
                        classes[c_id] = c_name
                        continue
                classes[idx] = line
    else:
        # Default placeholder 7 defect classes if class.txt is not yet present
        default_names = [
            "Scratch / Vết xước",
            "Dent / Vết lõm",
            "Crack / Vết nứt",
            "Pinhole / Lỗ kim",
            "Stain / Vết bẩn",
            "Burr / Ba via",
            "Discoloration / Đổi màu"
        ]
        classes = {i: name for i, name in enumerate(default_names)}
    return classes
