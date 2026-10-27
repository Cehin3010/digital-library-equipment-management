# Thiết kế Giao diện & Trải nghiệm Người dùng (UI/UX Design)

## 1. Nguyên tắc Thiết kế & Quy ước Mã nguồn Giao diện

Giao diện của **Hệ thống Thư viện Số & Cho mượn Tài sản Đại học** được xây dựng theo đúng yêu cầu phi chức năng (NFR #5) và tài liệu **Quy ước Viết mã**:

1. **Semantic HTML5 (Thẻ ngữ nghĩa)**:
   - Sử dụng `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>` để định hình bố cục chuẩn SEO và hỗ trợ thiết bị đọc màn hình (Accessibility).
   - Mọi trường nhập liệu (`<input>`, `<select>`, `<textarea>`) đều bắt buộc đi kèm thẻ `<label for="...">` tương ứng.
2. **Quy ước CSS BEM & Tailwind CSS**:
   - Các thành phần giao diện tùy chỉnh tuân thủ quy tắc đặt tên **BEM (Block__Element--Modifier)**, ví dụ:
     - `.asset-card`, `.asset-card__header`, `.asset-card__title`, `.asset-card__badge`
     - `.asset-card__badge--available`, `.asset-card__badge--borrowed`, `.asset-card__badge--maintenance`
   - Các lớp tiện ích Tailwind được sắp xếp theo thứ tự: `Layout -> Spacing -> Typography -> Colors & Effects`.
3. **Bảng màu Trạng thái Tài sản Chuẩn hóa (NFR #5)**:
   - **Màu Xanh lá (`#16a34a` / `.status-badge--available`)**: Tài sản / Phòng học **Còn trống (Available)** – sẵn sàng đặt mượn.
   - **Màu Đỏ (`#dc2626` / `.status-badge--borrowed`)**: Tài sản **Đang mượn (Borrowed)** – hiển thị thời gian dự kiến trả.
   - **Màu Xám (`#64748b` / `.status-badge--maintenance`)**: Tài sản **Đang bảo trì (Maintenance)** – tạm khóa đặt mượn.

---

## 2. Bố cục Các Màn hình Chức năng Chính

### 2.1. Thanh Điều hướng & Bộ chuyển đổi Vai trò (Header & RBAC Switcher)
- Hiển thị thông tin người dùng đang đăng nhập, vai trò hiện tại (`Sinh viên`, `Giảng viên`, `Cán bộ Thư viện`, `Quản trị viên`), trạng thái công nợ hiện tại và trung tâm thông báo nhắc hạn (F-05).
- Cho phép chuyển đổi nhanh tài khoản hoặc đăng nhập SSO nhà trường (F-11) để kiểm thử phân quyền động (RBAC).

### 2.2. Kho Tài liệu Số & Trình đọc Trực tuyến (Digital Repository & Online Reader - F-01, F-02)
- Thanh tìm kiếm đa tiêu chí (Từ khóa/ISBN, Thể loại, Phân loại Dewey, Năm xuất bản) phản hồi tức thì (< 2 giây).
- Thẻ `<article class="doc-card">` hiển thị thông tin học liệu, mã ISBN, mã Dewey, lượt đọc và tiến độ đọc cá nhân.
- **Modal Trình đọc Trực tuyến (Online Reader)**: Cho phép lật trang, tự động đếm thời gian đọc, lưu tiến độ phần trăm và kiểm tra giới hạn trang in (`Giới hạn in tối đa 10 trang/lần`).

### 2.3. Mượn/Trả Tài sản Vật lý & Quầy Quét Mã QR (Asset Lending & QR Counter - F-03, F-04)
- Danh mục thiết bị (Máy tính bảng, Máy chiếu, Camera, Dụng cụ thí nghiệm, Sách in) hiển thị rõ nhãn màu trạng thái **Xanh / Đỏ / Xám**.
- Khi đặt mượn thành công, hệ thống sinh **Phiếu mượn Điện tử** kèm **Mã QR trực quan**.
- Khu vực **Quầy Thư viện (Dành cho Cán bộ Thư viện/Admin)**: Giao diện quét/nhập mã QR để xác nhận **Bàn giao thiết bị (`BORROWED`)** hoặc **Nhận trả thiết bị (`RETURNED`)**, kèm lựa chọn ghi nhận tình trạng vật lý và tự động tính phí phạt nếu trả trễ.

### 2.4. Động cơ Nhắc Hạn & Quản lý Công nợ Phí phạt (Auto-Reminder & Fine Engine - F-05, F-06)
- Hiển thị danh sách cảnh báo các phiếu mượn còn **3 ngày** và **1 ngày** trước hạn trả.
- Công cụ mô phỏng & kiểm tra tính phí phạt trễ hạn tự động (`Số ngày trễ × Đơn giá phạt`), hiển thị ngưỡng khóa tài khoản (`100,000 VNĐ`) và trạng thái khóa quyền mượn.

### 2.5. Đặt Phòng Học & Lịch Bảng Tuần (Study Room Booking - F-07, F-08)
- Hiển thị **Lịch đặt phòng dạng bảng tuần (Weekly Timetable)** trực quan theo từng phòng và khung giờ.
- Biểu mẫu đặt phòng kiểm tra xung đột thời gian thực, tự động miễn phí nếu người đặt là **Giảng viên** (`role_id = 3`), và hỗ trợ hủy lịch trước 2 giờ không phạt.

### 2.6. Dashboard Thống kê & Nhật ký Kiểm toán (Dashboard & Audit Trail - F-09, F-10, F-12)
- Biểu đồ tỷ lệ trạng thái tài sản, bảng xếp hạng **Top 10 tài liệu số được đọc nhiều nhất**, biểu đồ xu hướng mượn/đọc theo tháng.
- Nút xuất báo cáo định kỳ ra file **Excel (CSV)** và **PDF**.
- Bảng **Nhật ký Lưu vết (Audit Trail)** hiển thị thời gian thực mọi thao tác trên hệ thống và chặn truy cập đối với tài khoản Sinh viên/Giảng viên (chống leo thang đặc quyền).
