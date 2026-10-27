# Hệ thống Thư viện số và Quản lý thiết bị (University Digital Library & Asset Lending Platform)

Nền tảng web cho sinh viên, giảng viên tra cứu và đặt mượn sách, thiết bị, phòng học trực tuyến; thủ thư duyệt phiếu, ghi nhận trả và xử lý vi phạm; thanh toán tiền phạt qua VNPay hoặc MoMo.

Tài liệu thiết kế: [docs/architecture.md](docs/architecture.md) · [docs/database.md](docs/database.md) · [docs/ui-design.md](docs/ui-design.md)

Bạn chưa quen các từ kỹ thuật? Xem [mục 8. Giải thích thuật ngữ](#8-giải-thích-thuật-ngữ).

## 1. Công nghệ

| Thành phần | Công nghệ |
| --- | --- |
| Frontend | React, Tailwind CSS, React Router, Axios |
| Backend | Laravel (PHP 8.3), Laravel Sanctum (token đăng nhập), Laravel Scheduler và Queue |
| Cơ sở dữ liệu | PostgreSQL 16 |
| Gửi email (OTP, nhắc hạn) | Mailpit khi phát triển, Gmail SMTP khi chạy thật |
| Triển khai | Docker, Docker Compose, Nginx |
| Cổng thanh toán | VNPay, MoMo (sandbox) |
| Quản lý công việc | GitHub Issues và GitHub Projects (bảng To Do, In Progress, Code Review, Done) |

## 2. Phân công

| Thành viên | MSSV | Vai trò | Phụ trách chính |
| --- | --- | --- | --- |
| Lý Hạo Danh | 52400175 | Scrum Master, Product Owner, DevOps | Backlog, Sprint, tài liệu SRS và thiết kế; Docker, Nginx, CI, triển khai server; module báo cáo và email nhắc hạn |
| Nguyễn Anh Khoa | 52400051 | Backend | Thiết kế và migration PostgreSQL; API Laravel: đăng nhập OTP, tài nguyên, đặt mượn, duyệt, trả, phạt, thanh toán |
| Trần Minh Chiến | 52400103 | Frontend | Wireframe sang Figma; giao diện React cho cả ba nhóm người dùng; gọi API; responsive |
| Hồ Thịnh Phát | 51900821 | Tester | Test case, test API, test E2E, test đồng thời cho luồng đặt mượn; ghi bug thành Issue trên GitHub |

Phân công dựa theo vai trò ở Lab 3, riêng Docker và triển khai giao cho Danh để Khoa tập trung vào API. Nhóm đổi lại nếu thấy không hợp.

## 3. Chia việc theo Sprint

### Tuần 3: Khởi tạo

| Việc | Người làm |
| --- | --- |
| Tạo repo, quy tắc nhánh, cấu trúc thư mục, bảng GitHub Projects | Danh |
| Viết `docker-compose.yml` gồm `nginx`, `app` (PHP-FPM), `db` (PostgreSQL), `frontend` (Vite), `mailpit` | Danh |
| Khởi tạo project Laravel, kết nối PostgreSQL, cấu hình CORS cho React, cấu hình gửi mail qua Mailpit | Khoa |
| Khởi tạo project React + Tailwind, cấu hình Axios, router, layout theo vai trò | Chiến |
| Tạo `.env.example` cho backend và frontend | Khoa, Chiến |

### Sprint 1: Đăng nhập OTP, Tài nguyên, Tra cứu (US01, US02, US10)

| Việc | Người làm |
| --- | --- |
| Migration: `roles`, `users`, `login_otps`, `categories`, `resources` và seeder dữ liệu mẫu | Khoa |
| API đăng nhập OTP: gửi mã, xác thực mã, cấp token Sanctum (xem mục 5) | Khoa |
| Middleware phân quyền theo vai trò; chỉ cho phép email của trường | Khoa |
| API tra cứu có lọc theo loại, danh mục; chỉ mục tìm kiếm PostgreSQL (GIN) | Khoa |
| API CRUD tài nguyên (xóa mềm) | Khoa |
| Màn hình W1 Đăng nhập (nhập email, rồi nhập mã OTP), W2 Tra cứu, W6 Quản lý tài nguyên | Chiến |
| Test OTP sai, hết hạn, nhập sai quá số lần, gửi lại; test phân quyền; đo tra cứu dưới 2 giây | Phát |
| Chạy CI (kiểm tra code, chạy test) trên mỗi pull request | Danh |

### Sprint 2: Đặt mượn, Duyệt phiếu, Quản lý kho (US03, US04, US05, US11, US12)

| Việc | Người làm |
| --- | --- |
| Migration `loans`; API lịch trống theo khung giờ | Khoa |
| API đặt mượn: kiểm tra nợ phạt, trừ tồn kho trong transaction (`lockForUpdate` hoặc `UPDATE ... WHERE available_quantity > 0`), tạo phiếu HOLDING | Khoa |
| API xác nhận, hủy phiếu; API duyệt, từ chối; API ghi nhận trả | Khoa |
| Scheduler mỗi phút: chuyển phiếu quá 10 phút sang EXPIRED và cộng lại tồn kho | Khoa |
| Màn hình W2 (đặt mượn, lịch trống), W3 (đếm ngược 10 phút), W5 (duyệt, ghi nhận trả) | Chiến |
| Test đồng thời: nhiều người đặt cùng tài nguyên cuối cùng, tồn kho không được âm | Phát |
| Test hết hạn giữ chỗ, hủy, từ chối cộng lại đúng tồn kho | Phát |
| Triển khai bản demo lên server bằng Docker Compose | Danh |

### Sprint 3: Phạt, Thanh toán, Báo cáo (US06, US07, US08, US09, US13, US14, US15, US16)

| Việc | Người làm |
| --- | --- |
| Migration `penalties`, `payments`, `system_settings`, `notifications` | Khoa |
| API lập phiếu phạt (trả trễ tự tính theo `FINE_PER_DAY`, hư hỏng, mất); API công nợ và lịch sử | Khoa |
| Tích hợp VNPay, MoMo sandbox: tạo giao dịch, nhận IPN, kiểm tra chữ ký, chống xử lý trùng bằng `txn_ref` | Khoa |
| API quản lý tài khoản, phân quyền, tham số hệ thống | Khoa |
| API báo cáo lượt mượn trả, vi phạm theo tháng | Danh |
| Scheduler và email nhắc hạn trả trước 1 ngày | Danh |
| Màn hình W4 (lịch sử, công nợ, thanh toán), W7 (admin), màn hình báo cáo | Chiến |
| Test thanh toán thành công, thất bại, hủy; test IPN giả mạo; test tính phạt | Phát |
| Sao lưu PostgreSQL lúc 02:00 hằng ngày | Danh |

### Tuần 10: Hoàn thiện

| Việc | Người làm |
| --- | --- |
| Sửa lỗi theo danh sách Issue có nhãn `bug` | Khoa, Chiến |
| Test hồi quy toàn hệ thống, thử tải 500 người dùng đồng thời | Phát |
| Đóng gói, viết hướng dẫn chạy, chuẩn bị slide demo | Danh |

## 4. Cấu trúc thư mục (dự kiến)

```text
.
├── backend/              # Laravel API
├── frontend/             # React + Tailwind
├── docs/                 # Tài liệu thiết kế (architecture, database, ui-design)
│   └── images/
├── docker/               # Dockerfile, cấu hình Nginx
├── docker-compose.yml
└── README.md
```

## 5. Đăng nhập bằng OTP và gửi email

Hệ thống đăng nhập bằng mã OTP gửi qua email trường, không cần nhớ mật khẩu.

1. Người dùng nhập email trường. Hệ thống kiểm tra email có trong bảng `users` và đang hoạt động.
2. Backend tạo mã 6 chữ số ngẫu nhiên, lưu **bản băm** của mã (không lưu mã gốc) vào bảng `login_otps` cùng thời điểm hết hạn, rồi gửi mã qua email.
3. Người dùng nhập mã. Nếu đúng và còn hạn, backend cấp token đăng nhập (Sanctum) và xóa mã đã dùng.

Quy tắc đề xuất: mã hết hạn sau 5 phút; sai tối đa 5 lần thì phải xin mã mới; chỉ gửi lại mã sau mỗi 60 giây; mỗi mã dùng một lần. Tham số này đặt trong `system_settings` để Admin chỉnh.

**Khi phát triển: dùng Mailpit.** Mailpit là hộp thư giả chạy trong Docker. Mọi email Laravel gửi đi không ra ngoài mà được giữ lại để xem ở `http://localhost:8025`, nên mọi người lấy mã OTP mà không cần Gmail thật. Cấu hình `backend/.env`:

```env
MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="thuvien@example.com"
MAIL_FROM_NAME="Thư viện số"
```

**Khi chạy thật hoặc demo: dùng Gmail.** Tạo một tài khoản Gmail riêng cho dự án, bật xác minh 2 bước, rồi tạo **Mật khẩu ứng dụng** (App Password) ở trang quản lý tài khoản Google. Cấu hình:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=email-du-an@gmail.com
MAIL_PASSWORD=mat-khau-ung-dung-16-ky-tu
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=email-du-an@gmail.com
MAIL_FROM_NAME="Thư viện số"
```

Lưu ý:
- **Không commit file `.env` lên Git.** Chỉ commit `.env.example` với giá trị giả. Lộ mật khẩu ứng dụng thì người khác gửi mail bằng tài khoản của nhóm được.
- Gmail giới hạn số email gửi mỗi ngày (khoảng vài trăm với tài khoản thường), đủ cho demo nhưng không dùng được cho hệ thống thật. Hệ thống thật nên dùng dịch vụ gửi mail riêng.
- Gửi mail nên đưa vào hàng đợi (Queue) để người dùng không phải chờ.
- Email nhắc hạn trả (US09) dùng cùng cấu hình này.

## 6. Chạy dự án bằng Docker

Các lệnh dưới dùng được sau khi Danh hoàn thành `docker-compose.yml` ở Tuần 3.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up -d --build
docker compose exec app composer install
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate --seed
```

| Dịch vụ | Địa chỉ |
| --- | --- |
| Giao diện web (React) | http://localhost:5173 |
| API (Laravel) | http://localhost:8080/api |
| Hộp thư giả Mailpit | http://localhost:8025 |

Dừng toàn bộ: `docker compose down`. Xem log: `docker compose logs -f app`.

## 7. Quy tắc làm việc với Git

- Nhánh chính `main` chỉ nhận code qua pull request, cần ít nhất một người review.
- Mỗi việc là một Issue trên GitHub. Tên nhánh theo số Issue: `feature/<số-issue>-<mô-tả-ngắn>`, ví dụ `feature/12-dat-muon`.
- Commit nhỏ, lời nhắn rõ ràng, ví dụ `feat: add loan hold expiry job`.
- Kéo `main` về nhánh của mình trước khi tạo pull request để tránh xung đột.
- Tạo pull request thì kéo thẻ sang Code Review; Phát kiểm thử xong mới kéo sang Done.

## 8. Giải thích thuật ngữ

Phần này dành cho các bạn chưa quen lập trình web. Mỗi mục có ví dụ lấy từ chính dự án.

**Nhóm kiến trúc**

- **Frontend (giao diện):** phần người dùng nhìn thấy và bấm vào trên trình duyệt: ô tìm kiếm, nút Đặt mượn, bảng lịch sử. Giống mặt tiền và quầy của thư viện. Dự án dùng React.
- **Backend (phần xử lý phía sau):** phần chạy trên máy chủ, người dùng không thấy. Nó kiểm tra "sinh viên này có đang nợ phạt không", trừ số lượng tồn kho, tính tiền phạt. Giống thủ thư làm việc phía sau quầy. Dự án dùng Laravel (ngôn ngữ PHP).
- **API:** cách để frontend "nói chuyện" với backend. Frontend gửi một yêu cầu có quy định rõ (ví dụ "cho tôi danh sách sách tên có chữ Cơ sở dữ liệu") và backend trả kết quả về dạng dữ liệu. Giống tờ phiếu yêu cầu mà bạn đưa cho thủ thư và nhận lại sách. Mỗi chức năng của web thường ứng với một API: đăng nhập, tìm sách, đặt mượn, thanh toán.
- **Cơ sở dữ liệu (Database):** nơi lưu toàn bộ dữ liệu lâu dài: tài khoản, sách, phiếu mượn, phiếu phạt. Giống kho sổ sách của thư viện, nhưng là bảng điện tử. Dự án dùng PostgreSQL.
- **Bảng (table) và ERD:** dữ liệu trong cơ sở dữ liệu chia thành nhiều bảng, mỗi bảng như một trang tính (bảng `users`, bảng `loans`...). ERD là sơ đồ vẽ các bảng và mối quan hệ giữa chúng, có trong `docs/database.md`.
- **Kiến trúc 3 lớp:** chia hệ thống thành giao diện, xử lý nghiệp vụ, dữ liệu để mỗi người làm một phần mà ít đụng vào nhau.
- **CRUD:** bốn thao tác cơ bản lên dữ liệu: Thêm (Create), Xem (Read), Sửa (Update), Xóa (Delete). Chức năng quản lý tài nguyên của thủ thư là một CRUD.

**Nhóm công cụ dự án**

- **Docker và container:** đóng gói phần mềm cùng mọi thứ nó cần (phiên bản PHP, PostgreSQL...) vào một "hộp" gọi là container, để chạy giống hệt nhau trên máy ai cũng được. Tránh tình trạng "máy tôi chạy được mà máy bạn thì không".
- **Docker Compose và `docker-compose.yml`:** file liệt kê mọi hộp cần chạy (web, API, database, hộp thư giả). Một lệnh `docker compose up` bật cả hệ thống lên.
- **Nginx:** phần mềm đứng ở cửa, nhận mọi yêu cầu từ trình duyệt rồi chuyển cho đúng nơi xử lý.
- **Git và repo:** Git ghi lại lịch sử mọi thay đổi của code. Repo (repository) là kho chứa code của dự án, đặt trên GitHub để cả nhóm dùng chung.
- **Commit:** một lần "lưu lại" thay đổi kèm lời nhắn. **Push** là đẩy các commit lên GitHub, **pull** là kéo thay đổi của người khác về máy mình.
- **Nhánh (branch):** bản sao để làm một việc riêng mà không làm hỏng bản chính. Làm xong thì ghép lại.
- **Pull request (PR):** đề nghị ghép nhánh của mình vào `main`, để bạn khác xem lại trước khi ghép.
- **CI:** hệ thống tự chạy kiểm tra và test mỗi khi có PR, để phát hiện lỗi sớm.
- **`.env`:** file chứa cấu hình bí mật (mật khẩu database, mật khẩu Gmail). Không đưa lên Git. File `.env.example` là bản mẫu có giá trị giả.
- **Issue, GitHub Projects:** Issue là một đầu việc hoặc một lỗi cần xử lý; Projects là bảng kéo thẻ qua các cột To Do, In Progress, Code Review, Done.
- **Sprint:** một chặng làm việc 2 đến 3 tuần theo Scrum, cuối chặng có sản phẩm chạy được.

**Nhóm Laravel và dữ liệu**

- **Migration:** file mô tả cách tạo hoặc sửa bảng trong database bằng code. Cả nhóm chạy cùng một migration nên database ai cũng giống nhau.
- **Seeder:** file nạp dữ liệu mẫu (vài cuốn sách, vài tài khoản) để có cái mà thử.
- **Transaction:** gom nhiều thao tác database thành một khối "được cả hay mất cả". Ví dụ vừa trừ tồn kho vừa tạo phiếu mượn: lỗi giữa chừng thì hoàn lại hết.
- **Race condition (tranh chấp):** hai người bấm Đặt mượn cùng lúc cho cuốn sách cuối cùng. Nếu không xử lý, cả hai đều thành công và tồn kho bị âm. Cách giải quyết trong dự án: giữ chỗ 10 phút và trừ tồn kho bằng một câu lệnh có điều kiện.
- **Scheduler và Queue:** Scheduler là bộ hẹn giờ chạy việc định kỳ (mỗi phút nhả giữ chỗ hết hạn). Queue là hàng đợi để làm việc chậm (gửi email) ở nền, người dùng không phải chờ.
- **Soft delete (xóa mềm):** "xóa" chỉ là đánh dấu ẩn, dữ liệu vẫn còn để lịch sử mượn trả không bị mất.

**Nhóm bảo mật và thanh toán**

- **OTP:** mã dùng một lần (6 chữ số) gửi qua email để xác nhận đúng chủ tài khoản, giống mã khi chuyển khoản ngân hàng.
- **Token (Sanctum):** sau khi đăng nhập đúng, backend đưa cho trình duyệt một "thẻ ra vào". Các yêu cầu sau đó kèm thẻ này để backend biết ai đang gọi, không phải đăng nhập lại.
- **Băm (hash):** biến dữ liệu thành chuỗi ký tự không dịch ngược được. Lưu bản băm của OTP thì dù database bị lộ cũng không ai biết mã gốc.
- **SMTP:** chuẩn để máy chủ gửi email. **Mailpit** là hộp thư giả nhận email thử; **Gmail SMTP** là gửi thật qua tài khoản Gmail.
- **IPN và Webhook:** khi bạn trả tiền xong ở VNPay hoặc MoMo, họ gọi ngược về hệ thống của mình để báo "đã thanh toán". Đây mới là bằng chứng đáng tin để đánh dấu phiếu phạt đã trả.
- **Sandbox:** môi trường thử nghiệm của cổng thanh toán, dùng tiền giả.
- **Responsive:** giao diện tự co giãn cho vừa màn hình điện thoại lẫn máy tính.
- **Wireframe:** bản phác thảo bố cục màn hình bằng các khối, chưa có màu sắc và hình ảnh thật.