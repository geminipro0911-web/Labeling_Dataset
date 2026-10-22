import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from PIL import Image

import config
import database
from app import app

TEST_DATASET_DIR = Path("tests/test_api_dataset")

@pytest.fixture(autouse=True)
def setup_api_test(monkeypatch):
    TEST_DATASET_DIR.mkdir(parents=True, exist_ok=True)
    test_db = TEST_DATASET_DIR / "api_test.db"
    if test_db.exists():
        test_db.unlink()

    monkeypatch.setattr(config, "DATASET_DIR", TEST_DATASET_DIR)
    monkeypatch.setattr(config, "DB_PATH", test_db)
    monkeypatch.setattr(database, "DATASET_DIR", TEST_DATASET_DIR)
    monkeypatch.setattr(database, "DB_PATH", test_db)

    # Write class.txt
    with open(TEST_DATASET_DIR / "class.txt", "w", encoding="utf-8") as f:
        f.write("0: Scratch\n1: Dent\n2: Crack\n3: Pinhole\n4: Stain\n5: Burr\n6: Discoloration\n")

    # Create 2 sample images with initial single-integer class_ids
    for i in range(1, 3):
        im = Image.new("RGB", (800, 600), color=(150, 150, 150))
        im.save(TEST_DATASET_DIR / f"item_{i:03d}.jpg")
        with open(TEST_DATASET_DIR / f"item_{i:03d}.txt", "w", encoding="utf-8") as f:
            f.write(f"{i}\n")

    database.init_db()
    database.sync_dataset_to_db(TEST_DATASET_DIR)

    yield

    import shutil
    shutil.rmtree(TEST_DATASET_DIR, ignore_errors=True)


def test_auth_requirement():
    client = TestClient(app)
    # Next image requires authentication
    res = client.get("/api/images/next")
    assert res.status_code == 401


def test_get_status_and_classes():
    client = TestClient(app)
    res = client.get("/api/status")
    assert res.status_code == 200
    data = res.json()
    assert "lan_ip" in data
    assert "stats" in data
    assert data["stats"]["total_images"] == 2


def test_labeling_flow_next_save_back():
    client = TestClient(app)
    headers = {"X-User-Id": "Alice"}

    # 1. Acquire next image
    res = client.get("/api/images/next", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["has_image"] is True
    filename = data["filename"]
    assert filename == "item_001.jpg"
    assert data["original_class_id"] == 1
    assert data["image_width"] == 800
    assert data["image_height"] == 600

    # 2. Try saving with 0 boxes without confirmation -> expects 400 require_confirmation
    res_empty = client.post(
        f"/api/images/{filename}/save",
        headers=headers,
        json={"boxes": [], "confirmed_empty": False}
    )
    assert res_empty.status_code == 400
    assert res_empty.json()["require_confirmation"] is True

    # 3. Save with valid bounding box
    res_save = client.post(
        f"/api/images/{filename}/save",
        headers=headers,
        json={
            "boxes": [
                {"xmin": 100, "ymin": 150, "xmax": 300, "ymax": 350, "class_id": 1}
            ],
            "confirmed_empty": False
        }
    )
    assert res_save.status_code == 200
    assert res_save.json()["success"] is True

    # Check file on disk
    txt_file = TEST_DATASET_DIR / f"{Path(filename).stem}.txt"
    with open(txt_file, "r") as f:
        lines = f.readlines()
    assert len(lines) == 1
    tokens = lines[0].strip().split()
    assert tokens[0] == "1"
    assert len(tokens) == 5

    # 4. Acquire second image
    res2 = client.get("/api/images/next", headers=headers)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["filename"] == "item_002.jpg"

    # 5. Press Back to return to item_001.jpg
    res_back = client.post(
        "/api/images/back",
        headers=headers,
        json={"current_filename": "item_002.jpg"}
    )
    assert res_back.status_code == 200
    back_data = res_back.json()
    assert back_data["filename"] == "item_001.jpg"
    assert len(back_data["boxes"]) == 1
    assert pytest.approx(back_data["boxes"][0]["xmin"], abs=1) == 100

    # 6. Leaderboard check
    res_lb = client.get("/api/leaderboard")
    assert res_lb.status_code == 200
    lb = res_lb.json()["leaderboard"]
    assert len(lb) == 1
    assert lb[0]["username"] == "Alice"
    assert lb[0]["count"] == 1
    assert lb[0]["rank"] == 1
