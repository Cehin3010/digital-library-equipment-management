# Hệ thống Thư viện số và Quản lý thiết bị (University Digital Library & Asset Lending Platform)

Nền tảng web cho sinh viên, giảng viên tra cứu và đặt mượn sách, thiết bị, phòng học trực tuyến; thủ thư duyệt phiếu, ghi nhận trả và xử lý vi phạm; thanh toán tiền phạt qua VNPay hoặc MoMo.

Tài liệu thiết kế: [docs/architecture.md](docs/architecture.md) · [docs/database.md](docs/database.md) · [docs/ui-design.md](docs/ui-design.md)

Giải thích thuật ngữ [mục 8. Giải thích thuật ngữ](#8-giải-thích-thuật-ngữ).

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

Cả nhóm ngang vai trò, không ai chỉ làm một mảng. Mỗi người **làm trọn một module** từ cơ sở dữ liệu, API, giao diện React đến test và tài liệu, rồi review chéo cho nhau. Cách này chia đều cả backend, frontend, API và báo cáo.

| Thành viên | MSSV | Module phụ trách | Use case, màn hình |
| --- | --- | --- | --- |
| Lý Hạo Danh | 52400175 | Tài khoản: đăng nhập OTP, phân quyền, quản lý tài khoản, tham số hệ thống; email nhắc hạn trả | UC01, UC03; US01, US09, US15, US16; màn hình W1, W7 |
| Nguyễn Anh Khoa | 52400051 | Tài nguyên: danh mục, tra cứu, lịch trống; báo cáo thống kê | UC02, UC04, UC05, UC11; US02, US03, US10, US14; màn hình W2 (tra cứu, lịch trống), W6, màn hình báo cáo |
| Trần Minh Chiến | 52400103 | Mượn trả: đặt mượn có giữ chỗ 10 phút, hủy, duyệt, từ chối, ghi nhận trả | UC06, UC07, UC08; US04, US05, US11, US12; màn hình W2 (đặt mượn), W3, W5 |
| Hồ Thịnh Phát | 51900821 | Phạt và thanh toán: lập phiếu phạt, công nợ, lịch sử, thanh toán VNPay và MoMo | UC09, UC10; US06, US07, US08, US13; màn hình W4 |

**Việc chung (mỗi người một phần):**

| Thành viên | Việc chung |
| --- | --- |
| Danh | Tạo repo, quy tắc nhánh, bảng GitHub Projects, CI; khởi tạo project Laravel; viết README và tài liệu Chương 1 (tổng quan) |
| Khoa | Docker Compose, Nginx, Mailpit và Gmail SMTP; triển khai server; sao lưu PostgreSQL 02:00; tài liệu Chương 2 (kiến trúc) |
| Chiến | Khởi tạo project React + Tailwind, layout theo vai trò, component dùng chung (nút, bảng, form), vẽ lại wireframe trên Figma; tài liệu Chương 4 (giao diện) |
| Phát | Seeder dữ liệu mẫu, bộ Postman hoặc Swagger mô tả toàn bộ API; tổng hợp ERD và Data Dictionary (Chương 3) |

**Quy tắc chung cho mọi người:**

- Mỗi người tự viết test cho module của mình (test API và các trường hợp lỗi).
- Review chéo theo cặp: Danh với Khoa, Chiến với Phát. Pull request cần người trong cặp xem và đồng ý mới được ghép.
- Luồng đặt mượn là chỗ dễ lỗi nhất (race condition): Chiến viết test đồng thời, Danh review và chạy lại độc lập.
- Module nào cần dữ liệu của module khác thì gọi API của module đó, không sửa thẳng code của nhau; cần sửa thì tạo Issue hoặc nhờ chủ module.

## 3. Chia việc theo Sprint

### Tuần 3: Khởi tạo

| Việc | Người làm |
| --- | --- |
| Tạo repo, quy tắc nhánh, bảng GitHub Projects, CI chạy test trên mỗi pull request | Danh |
| Khởi tạo project Laravel, kết nối PostgreSQL, cấu hình CORS cho React | Danh |
| Viết `docker-compose.yml` gồm `nginx`, `app` (PHP-FPM), `db` (PostgreSQL), `frontend` (Vite), `mailpit` | Khoa |
| Khởi tạo project React + Tailwind, Axios, router, layout theo vai trò, component dùng chung | Chiến |
| `.env.example` cho backend và frontend; bộ Postman hoặc Swagger rỗng để cả nhóm điền dần | Phát |

### Sprint 1: Tài khoản, Tài nguyên, Tra cứu (US01, US02, US10)

| Việc | Người làm |
| --- | --- |
| Migration `roles`, `users`, `login_otps`; API đăng nhập OTP (gửi mã, xác thực, cấp token Sanctum); middleware phân quyền; chỉ cho email của trường | Danh |
| Màn hình W1 Đăng nhập hai bước (nhập email, nhập mã OTP); test OTP sai, hết hạn, quá số lần, gửi lại | Danh |
| Migration `categories`, `resources`; API tra cứu có lọc và chỉ mục tìm kiếm PostgreSQL (GIN); API CRUD tài nguyên (xóa mềm) | Khoa |
| Màn hình W2 phần tra cứu, W6 Quản lý tài nguyên; test nhập sai số lượng; đo tra cứu dưới 2 giây | Khoa |
| Migration `loans`; thử nghiệm câu lệnh trừ tồn kho có điều kiện và viết test đồng thời đầu tiên | Chiến |
| Trang chủ theo vai trò, gắn token vào mọi yêu cầu API, xử lý hết phiên | Chiến |
| Migration `penalties`, `payments`, `system_settings`; đăng ký tài khoản sandbox VNPay, MoMo | Phát |
| Seeder dữ liệu mẫu (vai trò, tài khoản, danh mục, tài nguyên); điền API Sprint 1 vào Postman | Phát |

### Sprint 2: Đặt mượn, Duyệt phiếu, Quản lý kho, Công nợ (US03, US04, US05, US06, US07, US11, US12, US13, US15, US16)

| Việc | Người làm |
| --- | --- |
| API đặt mượn: kiểm tra nợ phạt, trừ tồn kho trong transaction, tạo phiếu HOLDING; API xác nhận, hủy, duyệt, từ chối, ghi nhận trả | Chiến |
| Scheduler mỗi phút: phiếu quá 10 phút chuyển EXPIRED và cộng lại tồn kho | Chiến |
| Màn hình W2 phần đặt mượn, W3 (đếm ngược 10 phút), W5 (duyệt, ghi nhận trả); test hết hạn giữ chỗ, hủy, từ chối cộng lại đúng tồn kho | Chiến |
| API lịch trống theo khung giờ (US03) và màn hình lịch trống trên W2 | Khoa |
| Triển khai bản demo lên server bằng Docker Compose | Khoa |
| API quản lý tài khoản, phân quyền, tham số hệ thống (`MAX_ACTIVE_LOANS`, `FINE_PER_DAY`, `HOLD_MINUTES`); màn hình W7 | Danh |
| API lập phiếu phạt trả trễ tự tính, hư hỏng, mất (gọi từ bước ghi nhận trả của Chiến); API công nợ và lịch sử; màn hình W4 phần lịch sử và công nợ | Phát |
| Test tính tiền phạt đúng theo số ngày trễ và theo `FINE_PER_DAY` | Phát |

### Sprint 3: Thanh toán, Báo cáo, Nhắc hạn, Hoàn thiện (US08, US09, US14)

| Việc | Người làm |
| --- | --- |
| Tích hợp VNPay, MoMo sandbox: tạo giao dịch, nhận IPN, kiểm tra chữ ký, chống xử lý trùng bằng `txn_ref`; màn hình W4 phần thanh toán | Phát |
| Test thanh toán thành công, thất bại, hủy; test IPN giả mạo | Phát |
| API báo cáo lượt mượn trả và vi phạm theo tháng; màn hình báo cáo | Khoa |
| Sao lưu PostgreSQL lúc 02:00 hằng ngày | Khoa |
| Email nhắc hạn trả trước 1 ngày (Scheduler, Queue, bảng `notifications`) | Danh |
| Rà lại toàn bộ phân quyền theo vai trò trên mọi API | Danh |
| Làm giao diện responsive cho mọi màn hình, thống nhất thông báo thành công, lỗi | Chiến |
| Test hồi quy luồng đặt mượn, thử tải 500 người dùng đồng thời | Chiến |

### Tuần 10: Hoàn thiện

| Việc | Người làm |
| --- | --- |
| Sửa lỗi theo danh sách Issue có nhãn `bug`, mỗi người sửa lỗi ở module của mình | Cả nhóm |
| Hoàn thiện Postman hoặc Swagger, ERD và Data Dictionary bản cuối | Phát |
| Đóng gói, kiểm tra chạy từ đầu theo mục 6 trên máy sạch | Khoa |
| Chuẩn bị slide và kịch bản demo | Danh, Chiến |

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
MAIL_PASSWORD=

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

Nhóm dùng mô hình Git Flow rút gọn:

| Nhánh | Mục đích |
| --- | --- |
| `main` | Bản ổn định, chỉ nhận code từ `develop` khi chốt bản demo hoặc nộp bài |
| `develop` | Nơi tích hợp các tính năng đang làm |
| `feature/<số-issue>-<mô-tả>` | Mỗi việc một nhánh, tạo từ `develop`, ví dụ `feature/12-dat-muon` |

- Không commit trực tiếp lên `main` và `develop`. Nên bật *Settings → Branches → Branch protection rules* cho cả hai nhánh (bắt buộc PR và ít nhất 1 approval) để GitHub chặn thay cho mọi người.
- Quy trình: `git switch develop` → `git pull origin develop` → `git switch -c feature/...` → commit → push → tạo PR vào `develop`.
- PR cần người trong cặp review (xem mục 2) approve mới được merge. Merge xong thì xóa nhánh feature.
- Trước khi tạo PR, kéo `develop` mới nhất về nhánh của mình để tránh xung đột.
- Commit nhỏ, lời nhắn rõ, ví dụ `feat: add loan hold expiry job`.
- Tạo PR thì kéo thẻ sang Code Review; được duyệt và ghép xong thì kéo sang Done.
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