from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

out_dir = Path("static/images")
out_dir.mkdir(parents=True, exist_ok=True)

def create_example_images():
    # 1. Correct Example Image (600x400)
    img_corr = Image.new("RGB", (600, 380), color="#1e222d")
    draw_c = ImageDraw.Draw(img_corr)

    # Simulated surface texture
    for y in range(0, 380, 20):
        draw_c.line([(0, y), (600, y)], fill="#252b38", width=1)
    for x in range(0, 600, 20):
        draw_c.line([(x, 0), (x, 380)], fill="#252b38", width=1)

    # Simulated defect: Scratch / crack
    defect_points = [
        (180, 160), (210, 175), (250, 165), (290, 190), (330, 185), (370, 210), (410, 200)
    ]
    draw_c.line(defect_points, fill="#e74c3c", width=5)
    # minor branches
    draw_c.line([(250, 165), (270, 150)], fill="#e74c3c", width=3)
    draw_c.line([(330, 185), (345, 215)], fill="#e74c3c", width=3)

    # Tight Bounding Box: Correct!
    # Bounding box around points: x from ~175 to 415, y from ~145 to 220
    box_rect = [165, 140, 425, 225]
    draw_c.rectangle(box_rect, outline="#2ecc71", width=3)

    # Corner anchors
    for corner in [(165, 140), (425, 140), (165, 225), (425, 225)]:
        draw_c.rectangle([corner[0]-4, corner[1]-4, corner[0]+4, corner[1]+4], fill="#2ecc71")

    # Label tag on box
    draw_c.rectangle([165, 115, 305, 140], fill="#2ecc71")
    draw_c.text((172, 120), "Class 2: Scratch", fill="#000000")

    # Banner header at bottom
    draw_c.rectangle([0, 330, 600, 380], fill="#27ae60")
    draw_c.text((20, 345), "CORRECT: Tight, snug bounding box around all defect edges", fill="#ffffff")

    img_corr.save(out_dir / "correct_example.png")

    # 2. Incorrect Example Image (600x400)
    img_inc = Image.new("RGB", (600, 380), color="#1e222d")
    draw_i = ImageDraw.Draw(img_inc)

    # Simulated surface texture
    for y in range(0, 380, 20):
        draw_i.line([(0, y), (600, y)], fill="#252b38", width=1)
    for x in range(0, 600, 20):
        draw_i.line([(x, 0), (x, 380)], fill="#252b38", width=1)

    # Simulated defect: Scratch / crack
    draw_i.line(defect_points, fill="#e74c3c", width=5)
    draw_i.line([(250, 165), (270, 150)], fill="#e74c3c", width=3)
    draw_i.line([(330, 185), (345, 215)], fill="#e74c3c", width=3)

    # Bad Box 1: Excessively loose box with too much background
    draw_i.rectangle([80, 60, 520, 310], outline="#e74c3c", width=3)
    draw_i.rectangle([80, 35, 280, 60], fill="#e74c3c")
    draw_i.text((88, 40), "X TOO LOOSE / POOR FIT", fill="#ffffff")

    # Bad Box 2: Clipping through defect
    draw_i.rectangle([220, 155, 310, 205], outline="#f39c12", width=2)
    draw_i.rectangle([220, 130, 350, 155], fill="#f39c12")
    draw_i.text((225, 135), "X CLIPS DEFECT", fill="#000000")

    # Banner header at bottom
    draw_i.rectangle([0, 330, 600, 380], fill="#c0392b")
    draw_i.text((20, 345), "INCORRECT: Excessive background or defect is partially truncated", fill="#ffffff")

    img_inc.save(out_dir / "incorrect_example.png")
    print("Example images successfully generated in static/images/")

if __name__ == "__main__":
    create_example_images()
