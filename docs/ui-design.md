
## Thiết kế UI (C4 - LAB 7)

## Chương 4. Thiết kế giao diện (Phác thảo ở mức bố cục)

Wireframe vẽ ở mức bố cục khối, chưa có màu thương hiệu; bản Figma của Chiến sẽ bám các bố cục này. Giao diện web responsive: trên điện thoại, thanh điều hướng bên trái thu thành menu.

### 4.1. Danh sách màn hình và vai trò người dùng

| Mã | Màn hình | Người dùng | Use case |
| --- | --- | --- | --- |
| W1 | Đăng nhập | Tất cả | UC01 |
| W2 | Tra cứu, xem lịch trống, đặt mượn | Sinh viên, Giảng viên | UC04, UC05, UC06 |
| W3 | Kết quả đặt mượn (giữ chỗ 10 phút) | Sinh viên, Giảng viên | UC06 |
| W4 | Lịch sử mượn trả, công nợ phạt, thanh toán | Sinh viên, Giảng viên | UC09, UC10 |
| W5 | Duyệt phiếu và ghi nhận trả | Thủ thư | UC07, UC08 |
| W6 | Quản lý tài nguyên | Thủ thư | UC02 |
| W7 | Quản lý tài khoản và tham số hệ thống | Quản trị viên | UC03 |

Báo cáo thống kê (UC11) là bảng và biểu đồ theo tháng trong menu Báo cáo của thủ thư, chưa vẽ wireframe riêng vì thuộc Sprint 3.

### 4.2. Wireframe màn hình đăng nhập

![W1. Đăng nhập](images/w1.png)

### 4.3. Wireframe màn hình tra cứu và đặt mượn

![W2. Tra cứu và đặt mượn](images/w2.png)

### 4.4. Wireframe màn hình kết quả đặt mượn

![W3. Kết quả đặt mượn](images/w3.png)

### 4.5. Wireframe màn hình lịch sử, công nợ phạt và thanh toán

![W4. Lịch sử và công nợ phạt](images/w4.png)

### 4.6. Wireframe các màn hình quản lý

![W5. Duyệt phiếu và ghi nhận trả](images/w5.png)

![W6. Quản lý tài nguyên](images/w6.png)

![W7. Quản lý tài khoản và tham số](images/w7.png)

### 4.7. Mô tả thao tác, dữ liệu nhập và phản hồi của hệ thống

| Màn hình | Dữ liệu nhập | Nút chức năng | Phản hồi khi thành công | Phản hồi khi thất bại |
| --- | --- | --- | --- | --- |
| W1 | Email trường, mật khẩu | Đăng nhập | Vào trang chủ theo vai trò (JWT) | Thông báo email hoặc mật khẩu không đúng; không phải email trường thì báo riêng (BR08) |
| W2 | Từ khóa, loại, danh mục; ngày giờ mượn và hạn trả | Tìm, Chi tiết, Xem lịch trống, Đặt mượn | Chuyển sang W3 | Hết tài nguyên: báo đã hết; còn nợ phạt: Bạn cần thanh toán nợ phạt trước khi mượn tài nguyên mới (BR01); trùng khung giờ: báo khung giờ đã có người đặt |
| W3 | Không có | Xác nhận đặt mượn, Hủy | Đặt mượn thành công, phiếu sang Chờ duyệt | Hết 10 phút: Phiếu đã hết hạn giữ chỗ, tồn kho được trả lại |
| W4 | Cổng thanh toán (VNPay hoặc MoMo) | Hủy phiếu chờ duyệt, Thanh toán trực tuyến | Chuyển sang cổng; xong thì báo thành công, nợ về 0, mở lại quyền mượn (BR06) | Thanh toán chưa hoàn tất, phiếu phạt vẫn chưa trả, có nút Thử lại |
| W5 | Lý do từ chối; mã phiếu hoặc mã sinh viên; tình trạng khi trả; ghi chú và số tiền phạt hư hỏng | Duyệt, Từ chối, Tìm, Ghi nhận trả | Phiếu đổi trạng thái, tồn kho cập nhật, tiền phạt trễ tự tính | Từ chối thiếu lý do thì báo lỗi; số liệu kho không khớp thì cảnh báo trước khi duyệt; mất mạng khi ghi nhận trả thì giữ thao tác và yêu cầu tải lại trang |
| W6 | Tên, loại, danh mục, mã, tổng số lượng | Thêm, Sửa, Xóa, Lưu, Hủy | Danh sách cập nhật ngay | Số lượng không hợp lệ hoặc mã trùng thì báo lỗi dưới ô nhập; xóa cần xác nhận và thực chất là ẩn |
| W7 | Vai trò, trạng thái tài khoản, giá trị tham số | Tạo tài khoản, Khóa, Lưu thay đổi | Thông báo Đã cập nhật | Giá trị không hợp lệ thì báo lỗi và giữ nguyên giá trị cũ |
