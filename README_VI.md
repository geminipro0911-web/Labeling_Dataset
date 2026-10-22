# 🎯 Nền Tảng Gán Nhãn YOLOv8 Cộng Tác Qua Mạng LAN (Collaborative Annotator)

Một ứng dụng web gọn nhẹ, hiệu năng cao, hỗ trợ nhiều người dùng cùng gán nhãn (bounding box) chuẩn **YOLOv8** trên mạng nội bộ (LAN). Hệ thống tích hợp cơ chế khóa tự động chống xung đột (anti-collision) nhằm ngăn chặn hai hay nhiều người gán nhãn trùng một hình ảnh tại cùng một thời điểm.

Được xây dựng với **FastAPI (Python)**, **SQLite (WAL Mode)** và giao diện đơn trang **HTML5 Canvas (Vanilla JavaScript)** — **không cần cài đặt môi trường build phức tạp (Node/Webpack)**.

---

## 📑 Mục lục
1. [Tính Năng Nổi Bật](#-tính-năng-nổi-bật)
2. [Cấu Trúc Thư Mục & Trạng Thái Dữ Liệu Ban Đầu (Critical Initial State)](#-cấu-trúc-thư-mục--trạng-thái-dữ-liệu-ban-đầu)
3. [Kiến Trúc Dự Án](#-kiến-trúc-dự-án)
4. [Hướng Dẫn Cài Đặt & Chạy Trên Mạng LAN](#-hướng-dẫn-cài-đặt--chạy-trên-mạng-lan)
5. [Công Thức Chuyển Đổi Tọa Độ Chuẩn YOLOv8](#-công-thức-chuyển-đổi-tọa-độ-chuẩn-yolov8)
6. [Cơ Chế Khóa Độc Quyền & Chống Xung Đột Nhiều Người Dùng](#-cơ-chế-khóa-độc-quyền--chống-xung-đột-nhiều-người-dùng)
7. [Tích Hợp Xác Thực SSO Doanh Nghiệp](#-tích-hợp-xác-thực-sso-doanh-nghiệp)
8. [Phím Tắt Tiện Dụng](#-phím-tắt-tiện-dụng)
9. [Bộ Kiểm Thử Tự Động (Automated Tests)](#-bộ-kiểm-thử-tự-động)

---

## ✨ Tính Năng Nổi Bật

- **Chuyển Đổi Giao Diện Sáng / Tối (Light & Dark Mode)**: Hỗ trợ linh hoạt 2 chế độ màu với bảng màu tối ưu độ tương phản, tự động ghi nhớ sở thích người dùng qua `localStorage`.
- **Chuyển Đổi Ngôn Ngữ Song Ngữ (Tiếng Việt 🇻🇳 / English 🇬🇧)**: Chuyển đổi tức thì không cần tải lại trang cho toàn bộ giao diện, hướng dẫn, bảng xếp hạng và tên loại lỗi.
- **Chống Trùng Lặp & Xung Đột LAN**: Sử dụng giao dịch cơ sở dữ liệu SQLite tức thì, tự động khóa ảnh khi có người mở và chỉ định người gán nhãn độc quyền.
- **Tự Động Mở Khóa Sau 10 Phút Không Hoạt Động (Lock Expiration)**: Nếu một người dùng mở ảnh nhưng treo máy quá 10 phút, ảnh sẽ tự động được trả lại hàng đợi để người khác tiếp tục. Trình duyệt gửi tín hiệu nhịp tim định kỳ (Heartbeat 30 giây) để giữ khóa khi người dùng vẫn đang thao tác vẽ.
- **Không Bao Giờ Mất Phân Loại Lỗi Gốc (`original_class_id`)**: Đọc số nguyên defect class ban đầu từ file `.txt` và lưu vĩnh viễn vào SQLite. Ngay cả khi ghi đè file `.txt` bằng các dòng bounding box YOLOv8 đầy đủ, mã lỗi gốc vẫn được bảo toàn.
- **Vẽ Hộp Bounding Box Mượt Mà Bằng HTML5 Canvas**:
  - Chế độ vẽ đơn giản: Nhấn và kéo chuột (`mousedown` $\to$ `mousemove` $\to$ `mouseup`) để tạo khung chữ nhật chuẩn YOLOv8.
  - **Đường Căn Tâm Toàn Màn Hình (Crosshair Guidelines)**: Hai đường dóng ngang và dọc màu xanh cyan chạy theo chuột trên toàn khung vẽ, kèm hiển thị tọa độ thời gian thực giúp căn chỉnh viền lỗi chuẩn xác.
  - **Hỗ Trợ Nhiều Hộp Trên Một Ảnh**: Cho phép vẽ 1 hoặc nhiều hộp lỗi; tất cả hộp tự động kế thừa `original_class_id` của ảnh đó.
  - **Quản Lý Hộp Linh Hoạt**: Nhấp vào hộp bất kỳ để chọn, xóa hộp đã chọn bằng phím `Delete`/`Backspace`, hoàn tác nhanh với nút `Undo` (`Ctrl+Z`), hoặc nút `Clear All`. Tự động bỏ qua các cú nhấp chuột vô ý kích thước $< 5\text{px}$.
  - Tự động kẹp tọa độ trong phạm vi ảnh `[0, img_width]` và `[0, img_height]`.
- **Chỉ Với 2 Nút Điều Hướng Chính**:
  - ⬅ **Nút Back (Phím tắt: A)**: Tải lại ảnh gần nhất mà chính người dùng này vừa gán nhãn từ lịch sử (`user_history`), chuyển đổi ngược tọa độ YOLOv8 chuẩn về pixel và vẽ lại lên Canvas để kiểm tra hoặc vẽ lại.
  - ➡ **Nút Next (Phím tắt: D hoặc Enter)**: Tự động chuyển đổi các hộp vẽ thành định dạng chuẩn YOLOv8, ghi đè file `.txt`, cập nhật trạng thái `labeled` vào SQLite và ngay lập tức lấy ảnh chưa gán nhãn tiếp theo.
  - Hỗ trợ hộp thoại xác nhận khi bấm Next trên ảnh chưa có hộp (cho phép lưu dạng mẫu âm tính / Negative Sample nếu sản phẩm không lỗi).
- **Thanh Trạng Thái Trên Cùng (Top Status Bar)**:
  - Hiển thị tên lỗi mục tiêu kèm màu nhận diện: Mapped từ `original_class_id` và `class.txt` (ví dụ: `Class 0: Scratch / Vết xước`).
  - Thống kê thời gian thực: `Tổng Số Ảnh`, `Đã Gán Nhãn (kèm %)`, `Bạn Đã Gán Nhãn`.
  - Hiển thị URL truy cập mạng LAN và thông tin người dùng hiện tại kèm nút đổi tài khoản.
- **Bảng Xếp Hạng Đua Top (Left Column Leaderboard)**:
  - Cột bên trái hiển thị bảng xếp hạng các thành viên theo số lượng ảnh đã hoàn thành.
  - Top 1, 2, 3, 4 có hiệu ứng tên phát sáng đặc biệt cùng huy hiệu danh dự:
    - 👑 **Top 1**: Vương miện hoàng kim với hiệu ứng ánh sáng vàng lấp lánh.
    - 🥇 **Top 2**: Huy chương vàng với ánh sáng vàng cam ấm.
    - 🥈 **Top 3**: Huy chương bạc với viền sáng ánh bạc.
    - 🥉 **Top 4**: Huy chương đồng với ánh sáng đồng cổ điển.
- **Thẻ Hướng Dẫn Kèm Hình Ảnh Minh Họa Dưới Cùng (Expandable Detail Card)**:
  - Mặc định thu gọn tinh gọn bên dưới thanh điều hướng, có thể bấm mở rộng linh hoạt.
  - Hiển thị quy tắc vẽ khung viền chuẩn xác và hai ảnh ví dụ trực quan đối chiếu:
    - ✔ **ĐÚNG (Correct)**: Khung ôm sát viền biên của khuyết tật, không thừa nền.
    - ✖ **SAI (Incorrect)**: Khung quá rộng lấy thừa nền hoặc cắt đứt một phần khuyết tật.

---

## 📂 Cấu Trúc Thư Mục & Trạng Thái Dữ Liệu Ban Đầu

Thư mục dataset (mặc định tại `./dataset`, hoặc tùy chỉnh qua biến môi trường `DATASET_DIR`) có cấu trúc như sau:

```
dataset/
├── class.txt              # Danh sách 7 dòng tương ứng với 7 loại khuyết tật (chỉ số 0 đến 6)
├── img_001.jpg            # File hình ảnh (.jpg, .png, .jpeg)
├── img_001.txt            # TRẠNG THÁI BAN ĐẦU: CHỈ CHỨA DUY NHẤT 1 SỐ NGUYÊN (ví dụ: 0)
├── img_002.png
├── img_002.txt            # TRẠNG THÁI BAN ĐẦU: CHỈ CHỨA DUY NHẤT 1 SỐ NGUYÊN (ví dụ: 3)
└── ...
```

### Xử Lý Trạng Thái Ban Đầu Đặc Thù (Critical Initial State):
1. **Lúc khởi tạo**: Mỗi file `.txt` **chỉ chứa duy nhất một số nguyên** `<class_id>` đại diện cho loại lỗi của bức ảnh đó, chưa có tọa độ bounding box.
2. Khi khởi động ứng dụng (hoặc gọi API `/api/scan`), backend quét toàn bộ thư mục dataset, đọc số nguyên này và lưu cố định vào cột `original_class_id` trong SQLite.
3. Khi người dùng bấm **Next** để lưu, file `.txt` được ghi đè bằng chuẩn YOLOv8:
   ```
   <class_id> <x_center> <y_center> <width> <height>
   ```
4. Do `original_class_id` đã được lưu vĩnh viễn trong SQLite, phân loại lỗi gốc sẽ không bao giờ bị mất hoặc ghi đè sai.

---

## 🏛 Kiến Trúc Dự Án

```
d:\Project\Labeling_Dataset\
├── app.py                     # Ứng dụng FastAPI, các REST endpoints và xử lý vòng đời
├── database.py                # Kết nối SQLite WAL, cơ chế khóa chống va chạm và bảng xếp hạng
├── config.py                  # Cấu hình IP LAN, thư mục dataset, timeout khóa (10 phút)
├── auth.py                    # Module xác thực get_current_user và vị trí cắm SSO doanh nghiệp
├── yolo_utils.py              # Xử lý hình học bounding box, kẹp biên và chuyển đổi YOLOv8
├── generate_sample_dataset.py # Script sinh dữ liệu mẫu giả lập bề mặt lỗi công nghiệp
├── create_examples.py         # Script tạo hình ảnh minh họa vẽ Đúng vs Sai
├── requirements.txt           # Danh sách thư viện Python cần thiết
├── run.bat                    # Script chạy 1-click trên hệ điều hành Windows
├── run.sh                     # Script chạy trên Linux / macOS
├── README.md                  # Tài liệu tiếng Anh
├── README_VI.md               # Tài liệu tiếng Việt
├── dataset/                   # Thư mục chứa hình ảnh và file nhãn .txt
├── static/
│   ├── css/style.css          # Giao diện Dark theme, hiệu ứng ánh sáng huy chương
│   ├── js/app.js              # Xử lý Canvas, vẽ bounding box, phím tắt và API
│   └── images/
│       ├── correct_example.png
│       └── incorrect_example.png
├── templates/
│   └── index.html             # Giao diện Single Page
└── tests/
    ├── test_annotation.py     # Kiểm thử đơn vị (toán YOLO, kẹp biên, khóa đa người dùng)
    └── test_api.py            # Kiểm thử tích hợp endpoint FastAPI
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Trên Mạng LAN

### 1. Cài Đặt Thư Viện Cần Thiết
Yêu cầu Python 3.9 trở lên. Cài đặt các gói phụ thuộc qua lệnh:
```bash
pip install -r requirements.txt
```

### 2. Khởi Động Ứng Dụng
**Trên Windows (Nhanh Nhất):**
Nhấp đúp chuột vào file `run.bat` hoặc gõ trong Command Prompt / PowerShell:
```cmd
run.bat
```

**Hoặc Chạy Qua Lệnh Python:**
```bash
python app.py
```

### 3. Thông Báo Khi Khởi Động Thành Công
Màn hình console sẽ tự động phát hiện IP mạng LAN của máy bạn và in ra:
```
=================================================================
>> YOLOv8 Collaborative Annotation Platform is READY!
>> Dataset Directory: D:\Project\Labeling_Dataset\dataset
>> Local Access:      http://localhost:8000
>> LAN Access:        http://192.168.1.65:8000
=================================================================
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### 4. Truy Cập Cho Các Thành Viên Trong Đội (LAN Sharing)
Mọi đồng nghiệp kết nối chung mạng Wi-Fi hoặc mạng dây nội bộ chỉ cần mở trình duyệt và truy cập vào địa chỉ **LAN Access** (ví dụ: `http://192.168.1.65:8000`).
Mỗi người nhập Mã Nhân Viên / Tên của mình khi vào giao diện để hệ thống phân định người dùng và xếp hạng.

---

## 📐 Công Thức Chuyển Đổi Tọa Độ Chuẩn YOLOv8

### 1. Kẹp Tọa Độ Trong Khung Hình Pixel
```python
xmin = max(0.0, min(float(img_width), raw_xmin))
ymin = max(0.0, min(float(img_height), raw_ymin))
xmax = max(0.0, min(float(img_width), raw_xmax))
ymax = max(0.0, min(float(img_height), raw_ymax))
```

### 2. Chiều Thuận (Pixel $\to$ Chuẩn Hóa YOLOv8 Khi Bấm Next)
```python
x_center = ((xmin + xmax) / 2.0) / img_width
y_center = ((ymin + ymax) / 2.0) / img_height
width = (xmax - xmin) / img_width
height = (ymax - ymin) / img_height
```
Định dạng lưu ra file `.txt` với 6 chữ số thập phân:
```
<original_class_id> <x_center:.6f> <y_center:.6f> <width:.6f> <height:.6f>
```

### 3. Chiều Nghịch (YOLOv8 $\to$ Pixel Khi Bấm Back Để Xem Lại)
```python
box_w = width * img_width
box_h = height * img_height
xmin = (x_center * img_width) - (box_w / 2.0)
ymin = (y_center * img_height) - (box_h / 2.0)
xmax = xmin + box_w
ymax = ymin + box_h
```

---

## 🔒 Cơ Chế Khóa Độc Quyền & Chống Xung Đột Nhiều Người Dùng

Để đảm bảo hiệu suất mượt mà trên môi trường mạng nội bộ nhiều người làm việc song song:

1. **Khóa Tức Thì Trong Giao Dịch SQLite WAL**:
   - Khi một người dùng yêu cầu ảnh qua `GET /api/images/next`, hệ thống tìm một ảnh có trạng thái `unlabeled` (hoặc ảnh có khóa đã hết hạn quá 10 phút) và gán trạng thái `locked` với `locked_by = user_id`, `locked_at = CURRENT_TIMESTAMP`.
   - Các người dùng khác gọi API cùng lúc sẽ được cấp các hình ảnh khác nhau, hoàn toàn không bị trùng lặp.
2. **Khôi Phục Khi Tải Lại Trang (Page Refresh Safe)**:
   - Nếu người dùng bấm F5 hoặc rớt mạng nhẹ, hệ thống kiểm tra thấy người dùng đang giữ khóa của ảnh hiện tại và trả về chính bức ảnh đó để tiếp tục công việc.
3. **Cơ Chế Heartbeat & Hết Hạn Khóa 10 Phút**:
   - Trình duyệt tự động gửi nhịp tim `POST /api/heartbeat` mỗi 30 giây để duy trì khóa cho người đang thao tác.
   - Nếu một người đóng trình duyệt hoặc bỏ đi quá 10 phút mà không gửi nhịp tim, khóa sẽ hết hạn và ảnh tự động mở cho người khác trong mạng gán tiếp.

---

## 🔑 Tích Hợp Xác Thực SSO Doanh Nghiệp

Module xác thực được thiết kế dạng cắm rút (modular dependency) tại file [auth.py](file:///d:/Project/Labeling_Dataset/auth.py):

```python
async def get_current_user(request: Request) -> str:
    # 1. Đọc từ header do Reverse Proxy (Nginx, Traefik, Cloudflare Access) chuyển tiếp
    header_val = request.headers.get("X-User-Id")

    # 2. Đọc từ Cookie phiên đăng nhập
    cookie_val = request.cookies.get("labeler_user")

    # 3. Đọc từ Query Parameter
    query_val = request.query_params.get("user_id")
```

### Hướng Dẫn Cắm SSO Doanh Nghiệp (OAuth2 / OIDC / SAML / Active Directory):
1. Mở file `auth.py`.
2. Trích xuất token từ header `Authorization: Bearer <JWT_TOKEN>`.
3. Giải mã và kiểm tra chữ ký với khóa công khai (JWKS) từ máy chủ Identity Provider (Okta, Azure AD, Keycloak, PingIdentity, Google Workspace).
4. Lấy mã định danh nhân viên: `user_id = claims.get("preferred_username")` hoặc email nhân viên.
5. Nếu chạy sau Reverse Proxy có sẵn xác thực (ví dụ OAuth2-Proxy hoặc Cloudflare Tunnel), chỉ cần đọc header tin cậy như `X-Forwarded-User` hoặc `Remote-User`.

---

## ⌨ Phím Tắt Tiện Dụng

| Phím Tắt | Thao Tác |
| :--- | :--- |
| **Kéo thả chuột trái** | Vẽ một khung bounding box mới |
| **Nhấp chuột trái vào hộp** | Chọn hộp để chỉnh sửa hoặc xóa |
| **`Delete` / `Backspace`** | Xóa hộp đang được chọn |
| **`Ctrl + Z`** | Hoàn tác (Undo) hộp vừa vẽ gần nhất |
| **`D` hoặc `Enter`** | **Next**: Lưu nhãn và chuyển sang ảnh tiếp theo |
| **`A`** | **Back**: Quay lại xem ảnh vừa gán trước đó |
| **`Escape`** | Hủy chọn hộp hiện tại |

---

## 🧪 Bộ Kiểm Thử Tự Động (Automated Tests)

Hệ thống đi kèm bộ kiểm thử toàn diện bằng `pytest`, kiểm tra:
- Độ chính xác toán học chuyển đổi tọa độ YOLOv8 hai chiều.
- Khả năng kẹp biên và loại bỏ cú nhấp chuột lỗi $< 5\text{px}$.
- Khả năng đọc file nhãn ban đầu (chỉ 1 số nguyên) và ghi định dạng chuẩn YOLO.
- Tính năng khóa chống va chạm nhiều người dùng trên SQLite.
- Cơ chế giải phóng khóa sau 10 phút hết hạn.
- Bảng xếp hạng và ngăn xếp lịch sử nút Back.
- Kiểm thử tích hợp toàn bộ các endpoint FastAPI.

### Lệnh Chạy Kiểm Thử:
```bash
python -m pytest tests/ -v
```
Toàn bộ **12 bài kiểm tra** đều vượt qua (100% PASS) chỉ trong khoảng 1.5 giây.
