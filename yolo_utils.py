from typing import List, Dict, Tuple, Optional
from pathlib import Path

MIN_BOX_PIXEL_SIZE = 5.0

class BoundingBox:
    def __init__(self, xmin: float, ymin: float, xmax: float, ymax: float, class_id: int):
        # Ensure xmin <= xmax and ymin <= ymax
        self.xmin = min(float(xmin), float(xmax))
        self.ymin = min(float(ymin), float(ymax))
        self.xmax = max(float(xmin), float(xmax))
        self.ymax = max(float(ymin), float(ymax))
        self.class_id = int(class_id)

    @property
    def pixel_width(self) -> float:
        return self.xmax - self.xmin

    @property
    def pixel_height(self) -> float:
        return self.ymax - self.ymin

    def is_valid(self, min_size: float = MIN_BOX_PIXEL_SIZE) -> bool:
        """Returns True if box dimensions are at least min_size pixels."""
        return self.pixel_width >= min_size and self.pixel_height >= min_size

    def clamp(self, img_width: int, img_height: int) -> 'BoundingBox':
        """Clamps coordinates within [0, img_width] and [0, img_height]."""
        c_xmin = max(0.0, min(float(img_width), self.xmin))
        c_ymin = max(0.0, min(float(img_height), self.ymin))
        c_xmax = max(0.0, min(float(img_width), self.xmax))
        c_ymax = max(0.0, min(float(img_height), self.ymax))
        return BoundingBox(c_xmin, c_ymin, c_xmax, c_ymax, self.class_id)

    def to_yolo(self, img_width: int, img_height: int) -> Tuple[float, float, float, float]:
        """
        Convert pixel coordinates to normalized YOLOv8 format:
        x_center = ((xmin + xmax) / 2.0) / img_width
        y_center = ((ymin + ymax) / 2.0) / img_height
        width = (xmax - xmin) / img_width
        height = (ymax - ymin) / img_height
        """
        clamped = self.clamp(img_width, img_height)
        if img_width <= 0 or img_height <= 0:
            return 0.0, 0.0, 0.0, 0.0

        x_center = ((clamped.xmin + clamped.xmax) / 2.0) / float(img_width)
        y_center = ((clamped.ymin + clamped.ymax) / 2.0) / float(img_height)
        width = (clamped.xmax - clamped.xmin) / float(img_width)
        height = (clamped.ymax - clamped.ymin) / float(img_height)

        # Clamping normalized values into [0.0, 1.0]
        x_center = max(0.0, min(1.0, x_center))
        y_center = max(0.0, min(1.0, y_center))
        width = max(0.0, min(1.0, width))
        height = max(0.0, min(1.0, height))

        return x_center, y_center, width, height

    def to_yolo_line(self, img_width: int, img_height: int) -> str:
        """Formats into standard YOLOv8 line with 6 decimal places."""
        xc, yc, w, h = self.to_yolo(img_width, img_height)
        return f"{self.class_id} {xc:.6f} {yc:.6f} {w:.6f} {h:.6f}"

    def to_dict(self) -> Dict[str, float]:
        return {
            "xmin": round(self.xmin, 2),
            "ymin": round(self.ymin, 2),
            "xmax": round(self.xmax, 2),
            "ymax": round(self.ymax, 2),
            "class_id": self.class_id,
            "width": round(self.pixel_width, 2),
            "height": round(self.pixel_height, 2)
        }

    @staticmethod
    def from_yolo(class_id: int, x_center: float, y_center: float, width: float, height: float,
                  img_width: int, img_height: int) -> 'BoundingBox':
        """
        Converts normalized YOLOv8 coordinates back to pixel coordinates:
        box_w = width * img_width
        box_h = height * img_height
        xmin = (x_center * img_width) - (box_w / 2.0)
        ymin = (y_center * img_height) - (box_h / 2.0)
        """
        box_w = float(width) * float(img_width)
        box_h = float(height) * float(img_height)
        xmin = (float(x_center) * float(img_width)) - (box_w / 2.0)
        ymin = (float(y_center) * float(img_height)) - (box_h / 2.0)
        xmax = xmin + box_w
        ymax = ymin + box_h
        return BoundingBox(xmin, ymin, xmax, ymax, class_id).clamp(img_width, img_height)


def parse_label_file(label_path: Path, img_width: int, img_height: int) -> Tuple[Optional[int], List[BoundingBox], bool]:
    """
    Parses a label .txt file.
    Returns:
      (detected_class_id, list_of_bounding_boxes, is_already_labeled)

    If file only contains a single integer (initial state, e.g. "3"):
      returns (3, [], False)
    If file contains YOLO lines (e.g. "3 0.45 0.51 0.12 0.08"):
      returns (3, [BoundingBox, ...], True)
    """
    if not label_path.exists():
        return None, [], False

    with open(label_path, "r", encoding="utf-8") as f:
        lines = [l.strip() for l in f if l.strip()]

    if not lines:
        return 0, [], False

    # Check if first line is a single integer
    first_tokens = lines[0].split()
    if len(first_tokens) == 1 and first_tokens[0].isdigit():
        # Initial single integer state
        class_id = int(first_tokens[0])
        return class_id, [], False

    boxes: List[BoundingBox] = []
    first_class_id = None

    for line in lines:
        tokens = line.split()
        if len(tokens) >= 5:
            try:
                c_id = int(tokens[0])
                if first_class_id is None:
                    first_class_id = c_id
                xc = float(tokens[1])
                yc = float(tokens[2])
                w = float(tokens[3])
                h = float(tokens[4])
                box = BoundingBox.from_yolo(c_id, xc, yc, w, h, img_width, img_height)
                if box.is_valid(min_size=1.0):
                    boxes.append(box)
            except (ValueError, IndexError):
                continue
        elif len(tokens) == 1 and tokens[0].isdigit():
            if first_class_id is None:
                first_class_id = int(tokens[0])

    is_labeled = len(boxes) > 0
    return first_class_id if first_class_id is not None else 0, boxes, is_labeled


def write_yolo_labels(label_path: Path, boxes: List[BoundingBox], img_width: int, img_height: int) -> None:
    """
    Overwrites the label .txt file with valid YOLOv8 formatted bounding boxes.
    Filters out any boxes with width or height < MIN_BOX_PIXEL_SIZE (5 pixels).
    """
    lines = []
    for box in boxes:
        if box.is_valid(MIN_BOX_PIXEL_SIZE):
            lines.append(box.to_yolo_line(img_width, img_height))

    with open(label_path, "w", encoding="utf-8") as f:
        if lines:
            f.write("\n".join(lines) + "\n")
        else:
            # Empty file for negative / defect-free sample or cleared
            f.write("")
