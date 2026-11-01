# Hướng dẫn sử dụng

## 1. Cài Docker Desktop và VS Code

1. Cài **Docker Desktop**: <https://www.docker.com/products/docker-desktop/>.
   Nếu được hỏi, chọn WSL 2; mở Docker Desktop và đợi Docker báo đang chạy.
2. Cài **Git for Windows**: <https://git-scm.com/download/win>.
3. Cài **Visual Studio Code**: <https://code.visualstudio.com/>.

## 2. Tải mã nguồn

Trong VS Code, mở **Terminal → New Terminal** rồi chạy:

```powershell
git clone https://github.com/Cehin3010/digital-library-equipment-management.git
cd digital-library-equipment-management
git fetch origin
git switch develop
git pull --ff-only origin develop
```

`develop` là nhánh làm việc chung. Nếu chỉ cần bản ổn định để demo, dùng `git switch main`
và `git pull --ff-only origin main` thay cho hai lệnh `git switch develop` / `git pull`.
Mở thư mục dự án trong VS Code bằng **File → Open Folder**.

## 3. Khởi động ứng dụng

Đảm bảo Docker Desktop đang chạy. Trong Terminal PowerShell của VS Code, tại thư mục dự án, chạy:

> **Lưu ý:** Mỗi lần chạy lệnh khởi tạo bên dưới, database sẽ được xóa và seed lại dữ liệu demo.
> Phiếu mượn, thanh toán và tài khoản tự tạo sẽ mất. Chỉ bấm **Stop/Start** container thì không reset.

```powershell
.\start_all.ps1
```

Script sẽ tạo file `.env` nếu chưa có, cài dependency, chuẩn bị PostgreSQL, reset và seed database,
rồi khởi động scheduler/queue worker. Lần đầu Docker sẽ tải các thành phần cần thiết, có thể mất vài phút.
Giữ nguyên file `backend\.env` nếu đã cấu hình trước đó; `APP_KEY` chỉ được tạo nếu đang để trống.
Nếu muốn giữ database hiện tại, không chạy lại `.\start_all.ps1`; dùng
`docker compose up -d` để khởi động container hoặc `.\init-database.ps1` để chỉ áp dụng migration còn thiếu.

## 4. Mở trang web bằng Docker Desktop

1. Mở **Docker Desktop → Containers**.
2. Tìm nhóm `digital_library` và đợi các dịch vụ hiển thị trạng thái đang chạy.
3. Bấm cổng **5174:5173** ở dòng `digital_library_frontend` để mở giao diện.

Hoặc mở trình duyệt và vào trực tiếp: <http://localhost:5174>.

## 5. Đăng nhập và dừng ứng dụng

- Đăng nhập bằng email tài khoản demo, ví dụ `admin@university.edu.vn`.
- OTP thử nghiệm được gửi vào Mailpit: <http://localhost:8025>.
- API kiểm tra hoạt động: <http://localhost:8080/api/health>.
- Để tắt ứng dụng, chạy `docker compose down` trong Terminal hoặc bấm **Stop** trong Docker Desktop.
  Không xóa Docker volumes nếu muốn giữ lại dữ liệu demo.
