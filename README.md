# 🎯 YOLOv8 Collaborative LAN Annotation Platform

[Tiếng Việt](README_VI.md) | **English**

A high-performance, lightweight, multi-user web application designed for real-time collaborative YOLOv8 bounding box annotation across a Local Area Network (LAN). 

Built with **FastAPI**, **SQLite (WAL mode)**, and **Vanilla JavaScript (HTML5 Canvas)** — requiring **no frontend build step** or heavy dependencies.

---

## 📑 Table of Contents
1. [Core Features](#-core-features)
2. [Input Dataset Structure & Critical Initial State](#-input-dataset-structure--critical-initial-state)
3. [System Architecture & Project Structure](#-system-architecture--project-structure)
4. [Installation & Requirements](#-installation--requirements)
5. [How to Run (LAN Access)](#-how-to-run-lan-access)
6. [YOLOv8 Coordinate Math & Formats](#-yolov8-coordinate-math--formats)
7. [Concurrency & Anti-Collision Logic](#-concurrency--anti-collision-logic)
8. [Enterprise SSO Integration Guide](#-enterprise-sso-integration-guide)
9. [Automated Test Suite](#-automated-test-suite)

---

## 🚀 Core Features

- **Light & Dark Theme Toggle**: Seamless switching between dark and light themes with optimized high-contrast palettes, persisted across sessions via `localStorage`.
- **Bilingual Support (Vietnamese 🇻🇳 / English 🇬🇧)**: Instant 1-click language toggling covering all interface text, modal dialogs, defect class names, and annotation instructions without page reloads.
- **Multi-User LAN Anti-Collision**: SQLite transaction locks prevent concurrent annotators from being assigned or overwriting the same image simultaneously.
- **10-Minute Lock Expiration & Heartbeat**: Inactive locks automatically expire after 10 minutes, returning abandoned images to the queue; active annotators keep locks alive via background heartbeats.
- **Permanent Defect Class Retention**: Permanently records the original defect `class_id` from initial single-integer `.txt` files into SQLite, ensuring the defect type is never lost when overwriting `.txt` files with standard YOLOv8 bounding box lines.
- **Ultra-Responsive HTML5 Canvas**:
  - Single drawing mode: click-and-drag axis-aligned bounding box.
  - Full-canvas crosshair guidelines with coordinate readout.
  - Coordinate clamping within `[0, img_width]` and `[0, img_height]`.
  - Multiple box support on the same image (inherits target defect class).
  - Box selection, hover highlight, individual box deletion, and `Ctrl+Z` Undo.
  - Sub-5px accidental click rejection.
- **2 Main Action Buttons**:
  - ⬅ **Back (Hotkey: A)**: Loads the user's previously labeled image, translates saved normalized YOLO coordinates back into pixel coordinates, and renders the boxes on canvas for review or redrawing.
  - ➡ **Next (Hotkey: D / Enter)**: Validates drawn boxes, prompts confirmation for empty/negative samples, converts coordinates to normalized YOLOv8 format (`<class_id> <xc> <yc> <w> <h>`), overwrites the `.txt` file, updates database status, and immediately presents the next unlabeled image.
- **Gamified Team Leaderboard**: Left column dynamically ranks annotators by number of labeled images:
  - 👑 **Rank 1**: Animated radiant gold shimmer with crown icon.
  - 🥇 **Rank 2**: Gold medal with warm glow.
  - 🥈 **Rank 3**: Silver medal with cool glow.
  - 🥉 **Rank 4**: Bronze medal with amber-bronze glow.
- **Minified Detail Card**: Collapsible bottom accordion with clear annotation rules and high-resolution visual comparison cards for **Correct** vs **Incorrect** bounding boxes.

---

## 📂 Input Dataset Structure & Critical Initial State

The dataset directory (by default `./dataset` or configurable via `DATASET_DIR`) follows this layout:

```
dataset/
├── class.txt              # 7 lines corresponding to 7 defect classes (index 0 to 6)
├── img_001.jpg            # Image file
├── img_001.txt            # Initial state: ONLY a single integer (e.g., 0)
├── img_002.png
├── img_002.txt            # Initial state: ONLY a single integer (e.g., 3)
└── ...
```

### Critical Initial State Handling:
1. In the initial state, each `.txt` file only contains a single integer representing its defect class (e.g., `2` for Crack).
2. On startup (or via `/api/scan`), the system scans all images, reads this single integer, and writes it to the SQLite `images` table under `original_class_id`.
3. When the user completes labeling and clicks **Next**, the `.txt` file is overwritten with standard YOLOv8 lines:
   ```
   2 0.453125 0.512345 0.123456 0.089012
   ```
4. Even after overwriting, the defect type is safely preserved in SQLite `original_class_id`.

---

## 🏗 System Architecture & Project Structure

```
d:\Project\Labeling_Dataset\
├── app.py                     # FastAPI server, endpoints, lifecycle, and routing
├── database.py                # SQLite schema, queries, locking logic, history stack
├── config.py                  # Host/port settings, LAN IP detection, paths, defect classes
├── auth.py                    # Modular get_current_user dependency & SSO hooks
├── yolo_utils.py              # BoundingBox class, coordinate math, file parsers
├── generate_sample_dataset.py # Generates synthetic defect samples for testing
├── create_examples.py         # Generates instruction visual comparison graphics
├── requirements.txt           # Python package dependencies
├── run.bat                    # Windows 1-click startup script
├── run.sh                     # Linux / macOS startup script
├── labeling_state.db          # SQLite state database (auto-generated)
├── dataset/                   # Dataset directory with images, labels, and class.txt
│   ├── class.txt
│   └── ...
├── static/
│   ├── css/style.css          # Dark theme, leaderboard glowing effects, animations
│   ├── js/app.js              # Canvas interaction, crosshairs, YOLO math, API calls
│   └── images/
│       ├── correct_example.png
│       └── incorrect_example.png
├── templates/
│   └── index.html             # Single-page interface
└── tests/
    ├── test_annotation.py     # Unit tests for YOLO math, clamping, DB locks, expiration
    └── test_api.py            # Integration tests for FastAPI endpoints
```

---

## 📦 Installation & Requirements

### 1. Requirements
- Python 3.9+ (Python 3.10+ recommended)
- A modern web browser (Chrome, Edge, Firefox, Safari)

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

---

## 🌐 How to Run (LAN Access)

### Option A: Windows (1-Click)
Double-click `run.bat` or run:
```cmd
run.bat
```

### Option B: Command Line (Cross-Platform)
```bash
python app.py
```

### What You Will See in the Terminal:
```
=================================================================
>> YOLOv8 Collaborative Annotation Platform is READY!
>> Dataset Directory: D:\Project\Labeling_Dataset\dataset
>> Dataset Sync: {'total_scanned': 14, 'new_added': 0, 'already_present': 14}
>> Local Access:      http://localhost:8000
>> LAN Access:        http://192.168.1.65:8000
=================================================================
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### Sharing with Colleagues on the LAN:
Tell any computer, tablet, or phone on the same Wi-Fi / Local Network to open the **LAN Access URL** (e.g. `http://192.168.1.65:8000`).

---

## 📐 YOLOv8 Coordinate Math & Formats

### 1. Clamping within Image Pixel Boundaries
```python
xmin = max(0.0, min(float(img_width), raw_xmin))
ymin = max(0.0, min(float(img_height), raw_ymin))
xmax = max(0.0, min(float(img_width), raw_xmax))
ymax = max(0.0, min(float(img_height), raw_ymax))
```

### 2. Forward Normalization (Pixel $\to$ YOLOv8)
```python
x_center = ((xmin + xmax) / 2.0) / img_width
y_center = ((ymin + ymax) / 2.0) / img_height
width = (xmax - xmin) / img_width
height = (ymax - ymin) / img_height
```

Formatted to 6 decimal places:
```
<original_class_id> <x_center:.6f> <y_center:.6f> <width:.6f> <height:.6f>
```

### 3. Reverse Transformation (YOLOv8 $\to$ Pixel for Back button)
```python
box_w = width * img_width
box_h = height * img_height
xmin = (x_center * img_width) - (box_w / 2.0)
ymin = (y_center * img_height) - (box_h / 2.0)
xmax = xmin + box_w
ymax = ymin + box_h
```

---

## 🔒 Concurrency & Anti-Collision Logic

To guarantee that annotators working simultaneously across the LAN never collide:

1. **Atomic SQLite Transactions**:
   - The database is configured with `PRAGMA journal_mode = WAL` and `PRAGMA synchronous = NORMAL`.
   - When `/api/images/next` is called, a lock query atomically finds an `unlabeled` image (or an expired lock) and sets:
     ```sql
     UPDATE images
     SET status = 'locked', locked_by = ?, locked_at = CURRENT_TIMESTAMP
     WHERE filename = (
         SELECT filename FROM images
         WHERE status = 'unlabeled' OR (status = 'locked' AND datetime(locked_at, '+10 minutes') < CURRENT_TIMESTAMP)
         ORDER BY filename ASC
         LIMIT 1
     )
     ```
2. **Reconnection & Refresh Safety**:
   - If a user refreshes the page or experiences network stutter, the backend recognizes that the user already holds an active lock on that image and safely re-returns it without assigning a new image or causing collisions.
3. **Lock Expiration & Heartbeat**:
   - Every 30 seconds, an active client tab sends a heartbeat (`POST /api/heartbeat`) which updates `locked_at = CURRENT_TIMESTAMP`.
   - If a user closes their browser or walks away for $>10$ minutes, their lock expires and another annotator can seamlessly pick up the image.

---

## 🔑 Enterprise SSO Integration Guide

Authentication is modularized in `auth.py`:

```python
async def get_current_user(request: Request) -> str:
    # 1. Custom Header (from reverse proxy like Traefik / Nginx / Cloudflare Access)
    header_val = request.headers.get("X-User-Id")

    # 2. Cookie (set via mock login screen or enterprise auth session)
    cookie_val = request.cookies.get("labeler_user")

    # 3. Query Parameter (convenient for API scripting)
    query_val = request.query_params.get("user_id")
```

### How to plug in Enterprise SSO (OIDC / OAuth2 / SAML):
1. In `auth.py`, import your JWT library (`python-jose` or `jwt`).
2. Read the `Authorization: Bearer <token>` header.
3. Validate signature against your company's JWKS endpoint (e.g., `https://login.microsoftonline.com/.../discovery/v2.0/keys` or Okta/Keycloak).
4. Extract user identity: `user_id = token_claims.get("preferred_username")` or employee email.
5. If using an authenticating reverse proxy (OAuth2-Proxy, Authelia, Cloudflare Tunnel), configure it to pass `X-Forwarded-User` or `Remote-User`, which `auth.py` will automatically read.

---

## 🧪 Automated Test Suite

A complete test suite is provided in `tests/`, verifying:
- YOLO coordinate normalization and reverse conversion with sub-pixel precision.
- Filter rejection for clicks $< 5$px.
- Reading single-integer initial label files vs 5-tuple YOLOv8 files.
- Concurrency anti-collision across multiple simultaneous users.
- Automatic recovery of locks after 10-minute expiration.
- Leaderboard ranking and Back button history stack.
- FastAPI endpoints with authentication.

### Running Tests:
```bash
python -m pytest tests/ -v
```

All 12 automated unit and integration tests will execute and pass in $\sim 1.5$s.
