# Hệ thống Thư viện Số & Cho mượn Tài sản Đại học (University Digital Library & Asset Lending Platform)

Nền tảng ứng dụng Web giúp số hóa toàn diện quy trình khai thác học liệu và luân chuyển tài sản trong trường đại học: từ tra cứu và đọc tài liệu điện tử, đặt mượn thiết bị/sách in và phòng học trực tuyến, đến tự động nhắc hạn trả, xử lý công nợ phạt qua VNPay/MoMo và thống kê báo cáo thời gian thực.

Tài liệu thiết kế chi tiết: [docs/architecture.md](docs/architecture.md) · [docs/database.md](docs/database.md) · [docs/ui-design.md](docs/ui-design.md)

*(Nếu chưa quen các thuật ngữ kỹ thuật, xem [Mục 9. Giải thích thuật ngữ](#9-giải-thích-thuật-ngữ) ở cuối tài liệu).*

---

## 1. Bối cảnh nghiệp vụ & Phạm vi hệ thống

Hệ thống quản lý tập trung **3 nhóm tài nguyên cốt lõi** và phân quyền chặt chẽ cho **4 nhóm tác tử (Actors)**:

### Ba nhóm tài nguyên trung tâm
| Nhóm tài nguyên | Bộ phận quản lý | Nghiệp vụ trọng tâm |
| :--- | :--- | :--- |
| **1. Tài liệu số** *(e-Book, Bài báo, Giáo trình PDF/EPUB)* | Phòng Thư viện | Kho học liệu điện tử truy cập $24/7$, lọc đa tiêu chí, đọc trực tuyến trên trình duyệt và ghi nhận tiến độ đọc. |
| **2. Tài sản vật lý** *(Thiết bị học tập, Máy chiếu, Camera, Sách in)* | Bộ phận Quản lý Tài sản | Đặt mượn trực tuyến (có cơ chế giữ chỗ tạm thời chống tranh chấp), bàn giao qua mã phiếu/QR tại quầy, theo dõi tình trạng vật lý. |
| **3. Phòng học & Không gian học tập** *(Phòng nhóm, Phòng thảo luận, Phòng thực hành)* | Phòng Quản lý Cơ sở vật chất | Xem lịch trống dạng bảng tuần, đặt phòng theo khung giờ chống trùng lịch, hủy/điều chỉnh trước giờ sử dụng. |

### Bốn vai trò người dùng (Actors)
- **Sinh viên (Student):** Tra cứu và đọc tài liệu số; đặt mượn thiết bị, sách in và phòng học; theo dõi lịch sử mượn, nhận thông báo nhắc trả và thanh toán phí phạt trực tuyến.
- **Giảng viên (Lecturer):** Có toàn bộ quyền của Sinh viên; bổ sung quyền đề xuất thêm tài liệu mới và xem thống kê tình hình sử dụng học liệu.
- **Cán bộ Thư viện (Librarian):** Quản lý kho tài liệu số, tài sản vật lý và phòng học; duyệt/bàn giao và ghi nhận trả tại quầy; đánh giá hư hỏng tài sản; theo dõi cảnh báo trễ hạn.
- **Quản trị viên (Admin / Manager):** Quản lý tài khoản và phân quyền; cấu hình tham số hệ thống (thời gian mượn tối đa, đơn giá phạt, thời gian giữ chỗ); xem Dashboard tổng quan, xuất báo cáo và giám sát nhật ký thao tác (Audit Log).

---

## 2. Công nghệ sử dụng

| Thành phần | Công nghệ lựa chọn |
| :--- | :--- |
| **Frontend** | React, Tailwind CSS, React Router, Axios |
| **Backend** | Laravel (PHP 8.3), Laravel Sanctum (xác thực Token), Scheduler & Queue |
| **Cơ sở dữ liệu** | PostgreSQL 16 |
| **Dịch vụ Email** | Mailpit (môi trường phát triển), Gmail SMTP (khi chạy demo/thực tế) |
| **Hạ tầng & Triển khai** | Docker, Docker Compose, Nginx |
| **Cổng thanh toán** | VNPay, MoMo (môi trường Sandbox) |
| **Quản lý dự án & CI** | GitHub Issues, GitHub Projects (To Do, In Progress, Code Review, Done), GitHub Actions |

---

## 3. Phân công thành viên

Nhóm làm việc theo mô hình **Full-stack theo phân hệ dọc**: mỗi thành viên phụ trách trọn vẹn một cụm phân hệ từ thiết kế bảng cơ sở dữ liệu (Migration), viết API Backend, dựng giao diện React đến viết kiểm thử (Test) và tài liệu. Ranh giới bảng dữ liệu và màn hình được tách độc lập để tránh xung đột mã nguồn (Merge Conflict).

### 3.1. Phân công theo Phân hệ chức năng (F-01 đến F-12)

| Thành viên | MSSV | Phân hệ phụ trách | Chi tiết chức năng & Bảng dữ liệu sở hữu |
| :--- | :--- | :--- | :--- |
| **Lý Hạo Danh** | 52400175 | **Bảo mật, Tài khoản, Cấu hình & Nhật ký kiểm toán**<br>*(F-11, F-12)* | • Đăng nhập bằng OTP qua email trường, phân quyền theo 4 vai trò, quản lý hồ sơ người dùng.<br>• Cài đặt tham số hệ thống (hạn mức mượn, đơn giá phạt, thời gian giữ chỗ).<br>• Ghi nhận và tra cứu Nhật ký lưu vết (Audit Log) cho mọi thao tác quan trọng.<br>• **Sở hữu DB:** `roles`, `users`, `login_otps`, `system_settings`, `audit_logs`. |
| **Nguyễn Anh Khoa** | 52400051 | **Kho Tài liệu số, Danh mục Tài nguyên & Báo cáo**<br>*(F-01, F-02, F-09, F-10)* | • CRUD danh mục và 3 nhóm tài nguyên (kiểm tra trùng ISBN, trạng thái Xanh/Đỏ/Xám, xóa mềm); đề xuất học liệu của Giảng viên.<br>• Bộ lọc tra cứu đa tiêu chí (dưới $2$ giây) và trình đọc tài liệu PDF trực tuyến (Online Reader).<br>• Dashboard thống kê thời gian thực và xuất báo cáo định kỳ ra Excel/PDF.<br>• **Sở hữu DB:** `categories`, `resources`, `digital_documents`, `reading_logs`, `resource_proposals`. |
| **Trần Minh Chiến** | 52400103 | **Mượn – Trả Tài sản & Đặt Phòng học**<br>*(F-03, F-04, F-07, F-08)* | • Đặt mượn sách/thiết bị trực tuyến (giữ chỗ tạm thời $10$ phút chống tranh chấp tồn kho) kèm mã phiếu/QR nhận đồ.<br>• Xem lịch trống dạng tuần và đặt phòng học theo khung giờ (chống trùng lịch, hủy trước $2$ giờ không phạt).<br>• Nghiệp vụ quầy thư viện: quét/nhập mã phiếu xác nhận bàn giao, từ chối và ghi nhận trả.<br>• **Sở hữu DB:** `loans`, `room_bookings`. |
| **Hồ Thịnh Phát** | 51900821 | **Động cơ Nhắc hạn, Tính Phí phạt & Thanh toán**<br>*(F-05, F-06 & Cổng TT)* | • Tự động quét và gửi thông báo/email nhắc hạn trả (trước $3$ ngày và $1$ ngày).<br>• Tự động tính phí phạt trả trễ hoặc hư hỏng tài sản; khóa quyền mượn khi công nợ vượt ngưỡng.<br>• Tra cứu lịch sử mượn/công nợ cá nhân; tích hợp thanh toán phạt qua VNPay và MoMo.<br>• **Sở hữu DB:** `notifications`, `penalties`, `payments`. |

> **Quy ước ranh giới giao diện để không đụng code:**
> - **Khoa** sở hữu trọn vẹn trang Tra cứu & Chi tiết tài nguyên (`CatalogPage`, `ResourceDetailPage`).
> - **Chiến** xây dựng độc lập các hộp thoại/trang Đặt mượn & Đặt phòng (`LoanBookingModal`, `RoomSchedulePage`, `CirculationDeskPage`). Khoa chỉ import nút bấm gọi component của Chiến gắn vào trang chi tiết.
> - Khi ghi nhận trả tài sản có phát sinh trễ hạn hoặc hư hỏng, Backend của **Chiến** gọi Service nội bộ do **Phát** cung cấp để tạo phiếu phạt, tuyệt đối không sửa trực tiếp vào Controller/Model của nhau.

### 3.2. Phân công việc nền tảng dùng chung

| Thành viên | Hạng mục phụ trách chung |
| :--- | :--- |
| **Danh** | Tạo GitHub Repo, thiết lập Branch Protection Rules, bảng GitHub Projects, GitHub Actions CI; khởi tạo khung Laravel; biên soạn README và Chương 1 báo cáo (Tổng quan). |
| **Khoa** | Viết `docker-compose.yml`, cấu hình Nginx, Mailpit & Gmail SMTP; triển khai bản chạy thử lên Server; thiết lập cron sao lưu PostgreSQL lúc `02:00` hằng ngày; viết Chương 2 (Kiến trúc). |
| **Chiến** | Khởi tạo dự án React + Tailwind CSS, cấu hình Router & Layout theo 4 vai trò, bộ UI Component dùng chung (Button, Badge trạng thái Xanh/Đỏ/Xám, Modal, Table); vẽ Figma; viết Chương 4 (Giao diện). |
| **Phát** | Xây dựng bộ Seeder dữ liệu mẫu chuẩn cho cả 3 nhóm tài nguyên; quản lý tài liệu API (Postman/Swagger); tổng hợp sơ đồ ERD và Data Dictionary cho Chương 3 (Cơ sở dữ liệu). |

### 3.3. Quy tắc phối hợp & Kiểm soát chất lượng
- **Tự kiểm thử:** Ai viết phân hệ nào phải tự viết Feature Test cho API và các trường hợp ngoại lệ của phân hệ đó.
- **Review chéo theo cặp:** **Danh ↔ Khoa**, **Chiến ↔ Phát**. Mọi Pull Request bắt buộc phải có chữ ký duyệt (Approve) của người cùng cặp và vượt qua bài kiểm tra CI tự động trước khi ghép vào `develop`.
- **Kiểm tra chéo luồng nhạy cảm:** Riêng luồng đặt mượn thiết bị và đặt phòng theo khung giờ (dễ xảy ra tranh chấp đồng thời), **Chiến** viết kịch bản test tải, **Danh** chạy kiểm chứng độc lập.

---

## 4. Lộ trình thực hiện 10 tuần (5 giai đoạn)

### Giai đoạn 1 (Tuần 1 – 2): Khảo sát, Phân tích & Thiết kế
- Thống nhất phạm vi 12 chức năng (`F-01` đến `F-12`), quy tắc nghiệp vụ và tiêu chí nghiệm thu.
- Chốt sơ đồ ERD cơ sở dữ liệu (`docs/database.md`), kiến trúc hệ thống (`docs/architecture.md`) và bản vẽ khung giao diện Figma (`docs/ui-design.md`).

### Giai đoạn 2 (Tuần 3): Khởi tạo nền tảng kỹ thuật
| Công việc | Phụ trách |
| :--- | :--- |
| Tạo repo, quy tắc nhánh, bảng GitHub Projects, cấu hình CI tự động chạy test khi tạo PR; khởi tạo Laravel + Sanctum + CORS | Danh |
| Thiết lập `docker-compose.yml` (`nginx`, `app`, `db`, `frontend`, `mailpit`) | Khoa |
| Khởi tạo React + Tailwind, Axios interceptor gắn token, Layout theo 4 vai trò và bộ UI Component chung | Chiến |
| Chuẩn bị `.env.example` cho cả Backend/Frontend; tạo khung tài liệu API trên Postman/Swagger | Phát |

### Giai đoạn 3 (Tuần 4 – 5 / Sprint 1): Xác thực, Kho tài nguyên & Tra cứu
| Công việc | Phụ trách |
| :--- | :--- |
| Migration nhóm Tài khoản; API đăng nhập OTP qua email trường, phân quyền 4 vai trò; màn hình Đăng nhập 2 bước (`F-11`) | Danh |
| Migration nhóm Tài nguyên; API CRUD tài liệu số, thiết bị, phòng học (xóa mềm, kiểm tra ràng buộc khóa ngoại); chỉ mục tìm kiếm PostgreSQL đạt tốc độ dưới $2$ giây (`F-01`) | Khoa |
| Giao diện Tra cứu đa tiêu chí (hiển thị nhãn màu Xanh/Đỏ/Xám), trang Quản lý kho cho Thủ thư và Trình đọc PDF trực tuyến (`F-01`, `F-02`) | Khoa |
| Migration `loans` và `room_bookings`; hoàn thiện trang chủ điều hướng theo vai trò; thử nghiệm câu lệnh khóa tồn kho trong Transaction | Chiến |
| Migration `penalties`, `payments`, `notifications`; viết Seeder dữ liệu mẫu đầy đủ; đăng ký tài khoản Sandbox VNPay & MoMo | Phát |

### Giai đoạn 4 (Tuần 6 – 7 / Sprint 2): Mượn – Trả tài sản, Đặt phòng & Tính phí phạt
| Công việc | Phụ trách |
| :--- | :--- |
| API & Giao diện Đặt mượn tài sản vật lý (giữ chỗ $10$ phút, cấp mã phiếu/QR, tự nhả kho khi quá hạn) và Quầy duyệt/bàn giao/nhận trả của Thủ thư (`F-03`, `F-04`) | Chiến |
| API & Giao diện Đặt phòng học dạng lịch tuần theo khung giờ, kiểm tra xung đột thời gian thực, hủy/dời lịch trước $2$ giờ (`F-07`, `F-08`) | Chiến |
| API & Màn hình Quản trị tài khoản, Cấu hình tham số hệ thống và Nhật ký lưu vết Audit Trail (`F-11`, `F-12`) | Danh |
| Triển khai hệ thống lên Server thử nghiệm bằng Docker Compose; hỗ trợ luồng đề xuất tài liệu mới cho Giảng viên | Khoa |
| Động cơ tự tính phí phạt trả trễ ($\text{số ngày trễ} \times \text{đơn giá phạt}$) và hư hỏng, tự khóa quyền mượn khi vượt trần nợ; trang Lịch sử & Công nợ cá nhân (`F-06`) | Phát |

### Giai đoạn 5 (Tuần 8 – 10 / Sprint 3 & Nghiệm thu): Thanh toán, Nhắc hạn, Báo cáo & Đóng gói
| Công việc | Phụ trách |
| :--- | :--- |
| Tích hợp thanh toán trực tuyến VNPay & MoMo (tạo URL thanh toán, xử lý IPN/Webhook, kiểm tra chữ ký số, chống cộng trùng giao dịch) | Phát |
| Bộ lập lịch (Scheduler + Queue) tự động gửi email và thông báo nhắc trả trước $3$ ngày và $1$ ngày (`F-05`) | Phát |
| Dashboard thống kê thời gian thực (tỷ lệ mượn, top 10 tài liệu đọc nhiều, biểu đồ xu hướng tháng) và Xuất báo cáo Excel/PDF (`F-09`, `F-10`); kịch bản sao lưu DB `02:00` sáng | Khoa |
| Rà soát toàn bộ phân quyền API và Audit Log cho mọi thao tác mượn, trả, hủy, điều chỉnh | Danh |
| Tối ưu giao diện Responsive trên di động; kiểm thử hiệu năng (tra cứu dưới $2$ giây, đặt mượn dưới $3$ giây, chịu tải đồng thời) | Chiến |
| Tổng rà soát sửa lỗi (Tuần 10), hoàn thiện tài liệu API + Báo cáo cuối kỳ và kịch bản Demo bảo vệ | Cả nhóm |

---

## 5. Tiêu chí nghiệm thu & Yêu cầu phi chức năng

Toàn bộ các phân hệ khi ghép vào nhánh `develop` phải thỏa mãn 5 nhóm tiêu chí chất lượng sau:

1. **Độ chính xác nghiệp vụ (Chống tranh chấp):** Phản ánh đúng trạng thái tài sản theo thời gian thực; tuyệt đối không để hai người dùng đặt trùng một thiết bị cuối cùng hoặc trùng khung giờ của cùng một phòng học.
2. **Tốc độ phản hồi:** Truy vấn tìm kiếm và lọc danh mục hiển thị kết quả **dưới $2$ giây**; thao tác đặt mượn và hủy đặt hoàn tất **dưới $3$ giây**.
3. **Toàn vẹn dữ liệu:** Thiết lập khóa ngoại chặt chẽ và áp dụng xóa mềm (Soft Delete); chặn xóa hồ sơ tài sản hoặc tài khoản khi vẫn còn phiếu mượn đang mở hoặc công nợ chưa tất toán.
4. **Bảo mật & Minh bạch:** Mọi thao tác đăng nhập, đặt mượn, bàn giao, trả, hủy và chỉnh sửa cấu hình đều được tự động lưu vào bảng `audit_logs` (Ai thực hiện – Thao tác gì – Thời điểm nào – Dữ liệu thay đổi).
5. **Trực quan hóa UI/UX:** Giao diện thân thiện, đồng nhất quy ước màu sắc trạng thái tài nguyên trên toàn hệ thống:
   - **Màu Xanh lá:** Còn trống / Sẵn sàng cho mượn.
   - **Màu Đỏ:** Đang được mượn / Đã kín lịch.
   - **Màu Xám:** Đang bảo trì / Tạm ngưng phục vụ.

---

## 6. Cơ chế Đăng nhập OTP & Cấu hình Email

Hệ thống sử dụng phương thức xác thực không mật khẩu thông qua mã OTP gửi về email nhà trường để đảm bảo an toàn và tiện lợi:
1. Người dùng nhập email trường cấp. Hệ thống kiểm tra tài khoản tồn tại và đang hoạt động.
2. Backend sinh mã ngẫu nhiên $6$ chữ số, lưu **bản băm (hash)** của mã kèm thời gian hết hạn vào bảng `login_otps`, sau đó đẩy tác vụ gửi email vào hàng đợi (Queue).
3. Người dùng nhập mã OTP. Nếu khớp và còn hạn ($5$ phút, tối đa $5$ lần thử sai, cách ít nhất $60$ giây mỗi lần xin cấp lại), hệ thống cấp Token (Laravel Sanctum) và vô hiệu hóa mã vừa dùng.

### Cấu hình khi phát triển cục bộ (Dùng Mailpit)
Mailpit chạy sẵn trong Docker, giữ lại toàn bộ email gửi thử tại địa chỉ `http://localhost:8025` mà không cần tài khoản Gmail thật. Cấu hình trong `backend/.env`:

```env
MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="thuvien@university.edu.vn"
MAIL_FROM_NAME="Thư viện số Đại học"
```

### Cấu hình khi chạy Demo / Server thật (Dùng Gmail SMTP)
Sử dụng một tài khoản Gmail riêng của dự án đã bật Xác minh 2 bước và khởi tạo **Mật khẩu ứng dụng (App Password)**:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=email-du-an@gmail.com
MAIL_PASSWORD=mat-khau-ung-dung-16-ky-tu
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=email-du-an@gmail.com
MAIL_FROM_NAME="Thư viện số Đại học"
```

> **Lưu ý bảo mật:** Tuyệt đối **không commit file `.env` lên Git**, chỉ đẩy bản mẫu `.env.example`. Cả luồng gửi mã OTP (`F-11`) và luồng tự động nhắc hạn trả (`F-05`) đều dùng chung cấu hình này thông qua Laravel Queue.

---

## 7. Cấu trúc thư mục & Hướng dẫn chạy bằng Docker

### Cấu trúc thư mục dự án
```text
.
├── backend/                  # Mã nguồn Laravel API, Migration, Queue, Tests
├── frontend/                 # Mã nguồn giao diện React + Tailwind CSS
├── docker/                   # Dockerfile và cấu hình Nginx
├── docs/                     # Tài liệu kiến trúc, ERD database và thiết kế UI
│   └── images/
├── docker-compose.yml        # Cấu hình khởi chạy toàn bộ container
└── README.md
```

### Khởi chạy nhanh trên máy mới
Thực hiện các lệnh dưới đây (sau khi Khoa hoàn tất `docker-compose.yml` ở Tuần 3):

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up -d --build
docker compose exec app composer install
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate --seed
```

| Dịch vụ | Địa chỉ truy cập |
| :--- | :--- |
| **Giao diện Web (React)** | `http://localhost:5173` |
| **Backend API (Laravel)** | `http://localhost:8080/api` |
| **Hộp thư thử nghiệm (Mailpit)** | `http://localhost:8025` |

- **Dừng hệ thống:** `docker compose down`
- **Theo dõi nhật ký chạy ngầm:** `docker compose logs -f app`

---

## 8. Quy tắc làm việc với Git & Danh sách nhánh chuẩn

Nhóm áp dụng mô hình **Git Flow tinh gọn**, đặt tên nhánh hoàn toàn bằng tiếng Anh theo định dạng `kebab-case`, gom gọn theo cụm tính năng lớn để kho mã nguồn sạch sẽ, dễ theo dõi và không sinh quá nhiều nhánh vụn.

### 8.1. Cấu trúc các loại nhánh
| Loại nhánh | Quy ước đặt tên | Mục đích sử dụng |
| :--- | :--- | :--- |
| **Nhánh chính** | `main` | Chứa mã nguồn ổn định cuối mỗi giai đoạn để triển khai Demo và nộp bài. |
| **Nhánh tích hợp** | `develop` | Nhánh làm việc chung; mọi nhánh tính năng đều tách ra từ đây và ghép (merge) ngược về đây. |
| **Nhánh nền tảng** | `chore/<ten-cong-viec>` | Dùng ở Tuần 3 khi dựng khung dự án, cấu hình Docker, CI, Seeder, tài liệu. |
| **Nhánh tính năng** | `feature/<ten-phan-he>` | Phát triển các phân hệ chức năng chính của từng thành viên. |
| **Nhánh sửa lỗi** | `fix/<mo-ta-loi>` | Sửa lỗi phát sinh trong quá trình kiểm thử chéo hoặc tuần tổng duyệt. |

### 8.2. Quy hoạch nhánh cụ thể cho từng thành viên

Mỗi thành viên chỉ duy trì tối đa **1 nhánh khởi tạo** và **3 nhánh tính năng** xuyên suốt học kỳ (tổng toàn dự án khoảng 16 nhánh rõ ràng):

| Thành viên | Nhánh khởi tạo (Tuần 3) | Các nhánh tính năng chính (Sprint 1 → Sprint 3) |
| :--- | :--- | :--- |
| **Lý Hạo Danh** | `chore/init-laravel-ci` | • `feature/auth-otp` *(Đăng nhập OTP & Phân quyền)*<br>• `feature/account-settings` *(Quản lý tài khoản & Tham số hệ thống)*<br>• `feature/audit-log` *(Nhật ký lưu vết hệ thống)* |
| **Nguyễn Anh Khoa** | `chore/docker-setup` | • `feature/resource-catalog` *(Danh mục 3 loại tài nguyên & Bộ lọc tra cứu)*<br>• `feature/online-reader` *(Kho tài liệu số & Trình đọc trực tuyến)*<br>• `feature/dashboard-report` *(Dashboard thống kê & Xuất báo cáo Excel/PDF)* |
| **Trần Minh Chiến** | `chore/init-react-ui` | • `feature/asset-lending` *(Đặt mượn thiết bị/sách & Giữ chỗ 10 phút)*<br>• `feature/room-booking` *(Lịch trống & Đặt phòng học theo khung giờ)*<br>• `feature/circulation-desk` *(Duyệt phiếu, bàn giao QR & Ghi nhận trả)* |
| **Hồ Thịnh Phát** | `chore/seeders-api-docs` | • `feature/fine-engine` *(Tính phí phạt tự động, công nợ & Khóa quyền mượn)*<br>• `feature/due-reminder` *(Tự động gửi thông báo & Email nhắc hạn trả)*<br>• `feature/payment-gateway` *(Thanh toán trực tuyến VNPay & MoMo)* |

### 8.3. Quy trình thao tác bắt buộc
1. **Không commit thẳng lên `main` và `develop`** (đã khóa bằng *Branch protection rules* trên GitHub).
2. **Tạo nhánh mới từ `develop` mới nhất:**
   `git switch develop` $\rightarrow$ `git pull origin develop` $\rightarrow$ `git switch -c feature/<ten-nhanh>`
3. **Commit gọn, thông điệp rõ ràng theo chuẩn Conventional Commits:** ví dụ `feat(lending): add 10-minute hold expiration job` hoặc `fix(payment): verify vnpay checksum signature`.
4. **Đồng bộ trước khi tạo PR:** Kéo `origin/develop` mới nhất về nhánh của mình để tự xử lý xung đột (nếu có) ở máy cá nhân trước khi mở Pull Request lên `develop`.
5. **Cập nhật bảng tiến độ:** Mở PR thì kéo thẻ công việc sang cột *Code Review*; sau khi bạn cùng cặp duyệt và ghép thành công thì kéo sang *Done* và xóa nhánh trên bộ nhớ tạm nếu đã hoàn tất trọn vẹn phân hệ.

---

## 9. Giải thích thuật ngữ

Phần tóm tắt nhanh giúp cả nhóm nắm vững các khái niệm kỹ thuật xuất hiện trong dự án:
**Nhóm kiến trúc & Dữ liệu**
- **Frontend & Backend:** Frontend (React) là giao diện quầy phục vụ người dùng nhìn thấy trên trình duyệt; Backend (Laravel) là bộ máy nghiệp vụ phía sau kiểm tra công nợ, khóa tồn kho và tính tiền phạt.
- **API:** Giao thức để Frontend gửi yêu cầu lên Backend và nhận kết quả dữ liệu JSON trả về.
- **Migration & Seeder:** Migration là các file code định nghĩa cấu trúc bảng trong PostgreSQL giúp cả nhóm có cơ sở dữ liệu giống hệt nhau; Seeder là kịch bản nạp sẵn dữ liệu mẫu (sách, máy chiếu, phòng học, tài khoản thử nghiệm).
- **Transaction & Race Condition:** Race Condition là lỗi tranh chấp khi hai người bấm đặt mượn thiết bị cuối cùng ở cùng một mili-giây gây âm kho. Transaction gom thao tác kiểm tra và trừ kho thành một khối nguyên tử có khóa điều kiện để đảm bảo chỉ một người đặt thành công.
- **Soft Delete (Xóa mềm):** Đánh dấu ẩn bản ghi thay vì xóa vĩnh viễn khỏi cơ sở dữ liệu nhằm giữ toàn vẹn lịch sử mượn trả và công nợ cũ.
- **Audit Log (Nhật ký kiểm toán):** Bảng ghi vết tự động mọi hành động quan trọng trên hệ thống để phục vụ tra soát nội bộ và thanh lý tài sản cuối năm.

**Nhóm công cụ, Bảo mật & Thanh toán**
- **Docker & Docker Compose:** Công cụ đóng gói sẵn PHP, PostgreSQL, Nginx, React và Mailpit vào các container độc lập, chỉ cần một lệnh là chạy đồng nhất trên mọi máy tính.
- **Pull Request (PR) & CI:** PR là yêu cầu xin ghép code từ nhánh `feature/*` vào `develop` để thành viên khác kiểm tra; CI (Continuous Integration) là tiến trình tự động chạy kiểm thử mỗi khi có PR mới.
- **Scheduler & Queue:** Scheduler là bộ hẹn giờ tự động chạy định kỳ (nhả phiếu giữ chỗ quá hạn mỗi phút, quét phiếu sắp đến hạn mỗi ngày); Queue là hàng đợi xử lý ngầm việc gửi email giúp giao diện web phản hồi tức thì.
- **Token (Sanctum) & Hash (Băm):** Hash biến mã OTP gốc thành chuỗi mã hóa một chiều trước khi lưu xuống DB; Token là "thẻ thông hành" cấp cho trình duyệt sau khi xác thực OTP thành công.
- **Sandbox & IPN/Webhook:** Sandbox là môi trường thanh toán thử nghiệm dùng tiền ảo của VNPay/MoMo; IPN (Instant Payment Notification) là tín hiệu máy chủ cổng thanh toán gọi ngầm về Backend của nhóm để xác nhận giao dịch đã trừ tiền thật sự thành công.
