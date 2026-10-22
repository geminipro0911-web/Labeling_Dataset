import random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

CLASSES = [
    "Scratch / Vết xước",
    "Dent / Vết lõm",
    "Crack / Vết nứt",
    "Pinhole / Lỗ kim",
    "Stain / Vết bẩn",
    "Burr / Ba via",
    "Discoloration / Đổi màu"
]

def generate_defect_image(filename: Path, class_id: int, width: int = 1280, height: int = 720):
    # Base metallic/industrial surface texture
    base_color = random.randint(180, 220)
    img = Image.new("RGB", (width, height), color=(base_color, base_color, base_color))
    draw = ImageDraw.Draw(img)

    # Add brushed metal or manufacturing texture lines
    for _ in range(300):
        y = random.randint(0, height)
        shade = random.randint(-20, 20)
        c = max(0, min(255, base_color + shade))
        draw.line([(0, y), (width, y)], fill=(c, c, c), width=1)

    # Add defect based on class_id
    cx = random.randint(int(width * 0.25), int(width * 0.75))
    cy = random.randint(int(height * 0.25), int(height * 0.75))

    if class_id == 0:  # Scratch
        pts = [(cx + i*15 + random.randint(-5, 5), cy + i*10 + random.randint(-8, 8)) for i in range(-5, 6)]
        draw.line(pts, fill=(50, 50, 55), width=random.randint(3, 5))
        # highlight
        pts_h = [(x+1, y+1) for x, y in pts]
        draw.line(pts_h, fill=(245, 245, 245), width=2)

    elif class_id == 1:  # Dent
        r = random.randint(35, 60)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(base_color - 40, base_color - 40, base_color - 35))
        draw.ellipse([cx - r//2, cy - r//2, cx + r//2, cy + r//2], fill=(base_color - 65, base_color - 65, base_color - 60))

    elif class_id == 2:  # Crack
        pts = [(cx, cy)]
        curr_x, curr_y = cx, cy
        for _ in range(8):
            curr_x += random.randint(-20, 30)
            curr_y += random.randint(10, 35)
            pts.append((curr_x, curr_y))
        draw.line(pts, fill=(20, 20, 25), width=4)
        for p in pts[2:-2:2]:
            b_pts = [p, (p[0] + random.randint(15, 30), p[1] + random.randint(-10, 20))]
            draw.line(b_pts, fill=(35, 35, 40), width=2)

    elif class_id == 3:  # Pinhole
        r = random.randint(8, 16)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(15, 15, 15), outline=(240, 240, 240), width=2)

    elif class_id == 4:  # Stain
        r = random.randint(40, 80)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(base_color - 30, base_color - 20, base_color - 50))

    elif class_id == 5:  # Burr
        pts = [(cx - 30, cy), (cx, cy - 25), (cx + 30, cy), (cx, cy + 10)]
        draw.polygon(pts, fill=(60, 60, 60), outline=(20, 20, 20))

    elif class_id == 6:  # Discoloration
        r = random.randint(50, 90)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(base_color + 30, base_color - 10, base_color - 40))

    img = img.filter(ImageFilter.GaussianBlur(0.6))
    img.save(filename, quality=92)

def generate_dataset(dataset_dir: Path, num_samples: int = 14):
    dataset_dir.mkdir(parents=True, exist_ok=True)

    # 1. Write class.txt
    class_txt_path = dataset_dir / "class.txt"
    with open(class_txt_path, "w", encoding="utf-8") as f:
        for cls_name in CLASSES:
            f.write(cls_name + "\n")
    print(f"Created {class_txt_path} with {len(CLASSES)} classes.")

    # 2. Write pairs of image and label files
    for i in range(1, num_samples + 1):
        class_id = (i - 1) % len(CLASSES)
        stem = f"sample_{i:03d}"
        img_file = dataset_dir / f"{stem}.jpg"
        txt_file = dataset_dir / f"{stem}.txt"

        # Generate image
        generate_defect_image(img_file, class_id)

        # Write INITIAL STATE: ONLY a single integer <class_id>
        with open(txt_file, "w", encoding="utf-8") as f:
            f.write(f"{class_id}\n")

    print(f"Successfully generated {num_samples} sample images & initial label files in {dataset_dir}")

if __name__ == "__main__":
    from config import DATASET_DIR
    generate_dataset(DATASET_DIR)
