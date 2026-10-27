# Hệ thống Thư viện Số & Cho mượn Tài sản Đại học
**(University Digital Library & Asset Lending Platform)**

> **Trường Đại học Tôn Đức Thắng (TDTU) — Khoa Công nghệ Thông tin**  
> **Nhóm 3 (Làng Xi Mi)**:
> - **52400175** — Lý Hạo Danh
> - **52400051** — Nguyễn Anh Khoa
> - **52400103** — Trần Minh Chiến
> - **51900821** — Hồ Thịnh Phát

---

## 1. Giới thiệu Tổng quan

**Hệ thống Thư viện Số & Cho mượn Tài sản Đại học** là nền tảng ứng dụng Web số hóa toàn diện quy trình quản lý và khai thác 3 nhóm tài nguyên trung tâm tại trường đại học:
1. **Tài liệu Số (`Digital Repository`)**: e-Book, bài báo khoa học, giáo trình PDF/EPUB truy cập 24/7.
2. **Tài sản Vật lý (`Physical Assets`)**: Máy tính bảng, máy chiếu, camera, bộ kit thực hành IoT/VR và sách in.
3. **Phòng Học / Không gian Học tập (`Study Rooms`)**: Phòng học nhóm, phòng thảo luận seminar và phòng thực hành đồ án.

---

## 2. Đặc tả 6 Phân hệ Chức năng (F-01 đến F-12)

| Phân hệ | Mã CN | Tên Chức năng | Mô tả Nghiệp vụ Đã Hoàn thành |
| :--- | :---: | :--- | :--- |
| **1. Kho Tài liệu Số** | `F-01` | Quản lý Danh mục Tài liệu Số | Kiểm tra trùng mã ISBN; tự động phân loại theo khung thập phân Dewey (`004.6`, `005.1`, `006.3`, ...); bộ lọc tìm kiếm đa tiêu chí (< 2 giây). |
| | `F-02` | Đọc Tài liệu Trực tuyến (`Online Reader`) | Mở trình đọc tích hợp ngay trên trình duyệt; ghi nhận trang đang đọc, thời lượng đọc, tiến độ (%) và giới hạn số trang in tối đa. |
| **2. Mượn & Trả Tài sản** | `F-03` | Đặt mượn Thiết bị / Sách in | Kiểm tra trạng thái còn trống (`AVAILABLE`); sinh phiếu mượn điện tử kèm **Mã QR** nhận tài sản và gửi thông báo xác nhận. |
| | `F-04` | Xác nhận Nhận & Trả qua QR | Cán bộ thư viện quét mã QR tại quầy để chuyển trạng thái `Đang mượn` (`BORROWED`) hoặc `Đã trả` (`RETURNED`); ghi nhận tình trạng vật lý. |
| **3. Nhắc hạn & Phí phạt** | `F-05` | Gửi Nhắc hạn Trả Tự động | Động cơ quét định kỳ gửi thông báo nhắc trả khi còn **3 ngày** và **1 ngày** trước hạn, ưu tiên hiển thị trên đầu trang chủ tài khoản. |
| | `F-06` | Tính Phí Phạt Trễ hạn Tự động | Tự động tính `Số ngày trễ × Đơn giá phạt`; cộng dồn công nợ vào hồ sơ người dùng; **tự động khóa quyền mượn** khi tổng nợ $\ge 100.000\text{ VNĐ}$. |
| **4. Đặt Phòng Học** | `F-07` | Đặt Phòng Học theo Khung giờ | Kiểm tra xung đột lịch theo thời gian thực; hiển thị bảng lịch tuần; miễn phí 100% chi phí đặt phòng đối với Giảng viên. |
| | `F-08` | Quản lý Hủy & Điều chỉnh Lịch | Cho phép hủy lịch trước giờ bắt đầu tối thiểu **2 giờ** không bị phạt; tự động mở lại slot phòng trống ngay sau khi hủy. |
| **5. Dashboard & Báo cáo** | `F-09` | Dashboard Thống kê Thời gian thực | Hiển thị tỷ lệ tài sản đang mượn, bảng xếp hạng **Top 10 tài liệu số đọc nhiều nhất** và biểu đồ xu hướng theo tháng. |
| | `F-10` | Xuất Báo cáo Định kỳ | Xuất báo cáo sử dụng tài sản và danh sách công nợ phí phạt ra định dạng **Excel (CSV)** và **PDF**. |
| **6. Bảo mật & Kiểm toán** | `F-11` | Xác thực SSO & Phân quyền RBAC | Mã hóa mật khẩu chuẩn `bcrypt`; phân quyền chặt chẽ cho 4 vai trò (`Sinh viên`, `Giảng viên`, `Cán bộ Thư viện`, `Quản trị viên`). |
| | `F-12` | Nhật ký Lưu vết (`Audit Trail`) | Tự động ghi nhận bất biến: *Ai thực hiện, Thao tác gì, Đối tượng nào, Thời gian cụ thể* phục vụ kiểm tra nội bộ và thanh lý tài sản. |

---

## 3. Cấu trúc Thư mục Dự án

```text
digital-library-equipment-management/
├── .editorconfig                              # Cấu hình chuẩn định dạng (4 spaces PHP/SQL, 2 spaces JS/HTML/CSS)
├── Bao_cao_Thu_vien_So_Nhom3.docx             # Báo cáo hoàn chỉnh theo đúng định dạng TemplateIT.dotx (TDTU)
├── backend/                                   # Tầng Backend PHP 8+ (Chuẩn PSR-12, Strict Types, PDO)
│   ├── database/
│   │   └── schema.sql                         # DDL CSDL chuẩn snake_case số nhiều & FK ON DELETE RESTRICT
│   ├── public/
│   │   └── index.php                          # Front Controller & REST API Router
│   ├── src/
│   │   ├── Config/
│   │   │   ├── AppConstants.php               # Quản lý hằng số UPPER_SNAKE_CASE (No Magic Numbers)
│   │   │   └── Database.php                   # Kết nối PDO tắt giả lập Prepared Statements
│   │   ├── Models/
│   │   │   ├── DigitalAsset.php               # Model học liệu số (Defensive Copying)
│   │   │   ├── BorrowRecord.php               # Model hồ sơ mượn trả
│   │   │   └── User.php                       # Model người dùng & kiểm tra khóa công nợ
│   │   ├── Repositories/
│   │   │   ├── BookRepository.php             # Truy xuất tài liệu số (PDO Prepared Statements)
│   │   │   ├── AssetLendingRepository.php     # Truy xuất tài sản & giao dịch QR
│   │   │   ├── RoomBookingRepository.php      # Truy xuất phòng học & kiểm tra xung đột giờ
│   │   │   ├── UserRepository.php             # Truy xuất người dùng, công nợ & thông báo
│   │   │   └── AuditAndStatsRepository.php    # Truy xuất Audit Trail & thống kê Dashboard
│   │   ├── Services/
│   │   │   ├── FineCalculationService.php     # Logic tính phạt tách biệt thông báo (Chuẩn SRP)
│   │   │   ├── DigitalLibraryService.php      # Logic ISBN, Dewey & giới hạn trang in Reader
│   │   │   ├── AssetLendingService.php        # Logic đặt mượn, quét QR bàn giao/trả & nhắc hạn
│   │   │   ├── RoomBookingService.php         # Logic đặt/hủy phòng & miễn phí Giảng viên
│   │   │   └── AuthAndSecurityService.php     # Logic bcrypt, SSO & chống leo thang đặc quyền RBAC
│   │   └── Controllers/
│   │       ├── AuthController.php             # Điều hướng xác thực (Xử lý lỗi thân thiện)
│   │       └── LibraryApiController.php       # Điều hướng các phân hệ F-01..F-12
│   └── tests/
│       └── run_verification.py                # Kịch bản kiểm thử tĩnh (AI SAST) & quy ước viết mã tự động
├── frontend/                                  # Tầng Giao diện Web (Semantic HTML5, CSS BEM + Tailwind, ES6+)
│   ├── index.html                             # Giao diện toàn diện 6 phân hệ & bộ chạy kiểm thử trực quan
│   ├── css/
│   │   └── styles.css                         # Quy tắc BEM & nhãn màu trạng thái (Xanh / Đỏ / Xám)
│   └── js/
│       ├── constants.js                       # Hằng số UPPER_SNAKE_CASE phía Client
│       ├── api.js                             # Giao tiếp Fetch API dùng Async/Await & Destructuring
│       ├── store.js                           # Kho dữ liệu cục bộ áp dụng Defensive Copying & SRP
│       └── app.js                             # Điều phối sự kiện giao diện & 5 kịch bản kiểm thử tự động
└── docs/                                      # Tài liệu Thiết kế Hệ thống
    ├── architecture.md                        # Kiến trúc phân tầng, RBAC & luồng hoạt động
    ├── database.md                            # Sơ đồ ERD & mô tả chi tiết các bảng CSDL
    └── ui-design.md                           # Thiết kế UI/UX, Semantic HTML & bảng màu trạng thái
```

---

## 4. Hướng dẫn Khởi chạy & Kiểm thử

1. **Trải nghiệm trực tiếp Giao diện Web (`Frontend`)**:
   - Mở file `frontend/index.html` trên trình duyệt hoặc chạy máy chủ tĩnh tại thư mục `frontend/`.
   - Sử dụng bộ chọn **Vai trò đăng nhập (SSO/RBAC)** ở góc trên bên phải để chuyển đổi tức thì giữa 4 thành viên Nhóm 3 (`Quản trị viên`, `Cán bộ Thư viện`, `Giảng viên`, `Sinh viên`) và nhấn nút **🧪 Chạy Tự Động 5 Kịch Bản Kiểm Thử (SAST / Dynamic / DAST)** ở Phân hệ 6.
2. **Khởi chạy Backend API (`PHP 8+`)**:
   - Nạp file `backend/database/schema.sql` vào MySQL/MariaDB.
   - Chạy `php -S localhost:8000 -t backend/public`.
3. **Chạy Kiểm thử Tĩnh & Quy ước Coding (`Static SAST Audit`)**:
   ```bash
   python backend/tests/run_verification.py
   ```
