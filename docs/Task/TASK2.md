# TASK 2: Đặc tả Phân công Phát triển Giao diện Frontend (React + Vite + Tailwind CSS)

Tài liệu này hướng dẫn chi tiết cách tổ chức thư mục, danh sách màn hình (`W1` → `W7`), trạng thái (State), luồng gọi API qua Axios và cách ghép nối Component giữa 4 thành viên. Vì phần giao diện Kho tài nguyên của **Nguyễn Anh Khoa** đã được dựng trước làm khung tham chiếu, các thành viên còn lại sẽ phát triển nối tiếp theo thứ tự ưu tiên dưới đây để khớp dữ liệu và tránh xung đột tệp (Merge Conflict).

---

## 1. Quy chuẩn Kỹ thuật Frontend Chung (Bắt buộc)

| Thành phần | Công nghệ / Quy ước | Quy định bắt buộc khi code Frontend |
| :--- | :--- | :--- |
| **Core Stack** | **React 18 (Vite) + Tailwind CSS + React Router v6** | • Mỗi thành viên **chỉ tạo và sửa file** trong thư mục `src/pages/<module>/` và `src/components/<module>/` của mình.<br>• Không viết CSS thuần lộn xộn vào `index.css`; ưu tiên dùng class tiện ích của **Tailwind CSS**. |
| **Gọi API & Auth** | **Axios (`src/services/api.js`)** | • Dùng chung instance `api` đã cấu hình sẵn `baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'`.<br>• Tự động đính kèm Header `Authorization: Bearer <token>` từ `localStorage` và tự động điều hướng về `/login` nếu gặp lỗi `401 Unauthorized`. |
| **Hệ màu Trạng thái** | **Badge chuẩn toàn hệ thống** | • **Xanh lá (`AVAILABLE`):** `bg-emerald-100 text-emerald-800 border-emerald-300` (Còn trống / Đọc ngay).<br>• **Đỏ (`BORROWED / FULL`):** `bg-rose-100 text-rose-800 border-rose-300` (Đang mượn hết / Kín lịch).<br>• **Xám (`MAINTENANCE`):** `bg-slate-100 text-slate-700 border-slate-300` (Đang bảo trì / Ngừng lưu thông). |
| **Nguyên tắc UI/UX** | **6 Nguyên lý Sommerville & Screen Design** | • Dóng thẳng trục dọc giữa nhãn (`label`) và ô nhập (`input`).<br>• Gom nhóm các trường liên quan vào khung có viền (`border rounded-xl p-4`).<br>• Cụm nút hành động chính (`Xác nhận`, `Lưu`) đặt bên phải, nút phụ (`Hủy`, `Đóng`) màu xám đặt bên trái ở đáy Form/Modal. |

---

## 2. Bảng Phân công Màn hình & Thứ tự Triển khai Frontend

Thứ tự được sắp xếp theo luồng kế thừa: **Khoa (Đã có bản dựng trước)** $\rightarrow$ **Chiến (Gắn luồng Đặt mượn/QR vào trang của Khoa)** $\rightarrow$ **Danh (Bọc xác thực OTP, Layout phân quyền & Admin)** $\rightarrow$ **Phát (Lịch sử, Công nợ, Thanh toán & Chuông thông báo)**.

| Thứ tự | Thành viên | Màn hình phụ trách | Thư mục Page & Component sở hữu | Nhánh Git Frontend |
| :---: | :--- | :--- | :--- | :--- |
| **1** *(Đã dựng trước)* | **Nguyễn Anh Khoa** (`52400051`) | **W2** (Tra cứu, Lịch trống, Đọc PDF)<br>**W6** (Quản lý kho & Báo cáo thống kê) | `src/pages/repository/CatalogPage.jsx`<br>`src/pages/librarian/ResourceManagePage.jsx`<br>`src/pages/reports/ReportDashboardPage.jsx`<br>`src/components/repository/OnlineReaderModal.jsx` | `feature/digital-repository`<br>`feature/online-reader`<br>`feature/dashboard-reports` |
| **2** | **Trần Minh Chiến** (`52400103`) | **W2** (`BookingModal` nhúng vào W2)<br>**W3** (Giữ chỗ 10p & Mã QR)<br>**W5** (Quầy Thủ thư duyệt/trả) | `src/components/lending/BookingModal.jsx`<br>`src/pages/lending/HoldConfirmPage.jsx`<br>`src/pages/librarian/CirculationDeskPage.jsx` | `feature/asset-lending-hold`<br>`feature/loan-qr-circulation`<br>`feature/room-booking` |
| **3** | **Lý Hạo Danh** (`52400175`) | **W1** (Đăng nhập OTP 2 bước)<br>**W7** (Quản trị User, Tham số & Audit Log) | `src/pages/auth/LoginPage.jsx`<br>`src/pages/admin/AdminDashboardPage.jsx`<br>`src/context/AuthContext.jsx` | `feature/auth-otp`<br>`feature/rbac-system-settings`<br>`feature/audit-log` |
| **4** | **Hồ Thịnh Phát** (`51900821`) | **W4** (Lịch sử, Công nợ & Thanh toán VNPay/MoMo)<br>**Header** (`NotificationBell`) | `src/pages/fines/MyHistoryAndFinesPage.jsx`<br>`src/pages/fines/PaymentResultPage.jsx`<br>`src/components/common/NotificationBell.jsx` | `feature/auto-reminder`<br>`feature/fine-engine`<br>`feature/payment-gateway` |

---

## 3. Đặc tả Chi tiết Từng Màn hình & Cách Thực hiện

### 3.1. Phần 1: Nguyễn Anh Khoa (`52400051`) — Kho Tài nguyên, Đọc PDF & Báo cáo (`W2`, `W6`)
*(Đã có bản làm trước — giữ vai trò khung tham chiếu giao diện danh mục)*

* **Các tệp phụ trách:**
  * `src/pages/repository/CatalogPage.jsx` (`W2`)
  * `src/components/repository/OnlineReaderModal.jsx` (`F-02`)
  * `src/pages/librarian/ResourceManagePage.jsx` (`W6`)
  * `src/pages/reports/ReportDashboardPage.jsx` (`F-09`, `F-10`)

| Màn hình / Component | API kết nối | Chi tiết giao diện & Tương tác cần hoàn thiện |
| :--- | :--- | :--- |
| **`CatalogPage.jsx`** (`W2` - Phần Tra cứu & Lịch trống) | `GET /api/categories`<br>`GET /api/resources`<br>`GET /api/resources/{id}/schedule` | • **Thanh công cụ lọc:** Ô tìm kiếm từ khóa (`debounce 300ms`), bộ lọc Danh mục, Tab chuyển đổi 4 loại (`Tất cả`, `Tài liệu số`, `Sách & Thiết bị`, `Phòng học`).<br>• **Lưới thẻ tài nguyên (Resource Card):** Hiển thị tên, mã ISBN/Serial/Phòng, vị trí, số lượng còn lại (`available_quantity / total_quantity`) và Badge màu (`Xanh`/`Đỏ`/`Xám`).<br>• **Lịch trống tuần (`F-07`):** Khi bấm "Xem lịch trống" ở thẻ Thiết bị/Phòng học, hiển thị bảng khung giờ 7 ngày trong tuần (ô màu đỏ là đã có người đặt, ô trống màu xanh cho phép chọn).<br>• **Điểm ghép nối với Chiến:** Gắn nút `<BookingButton resource={item} />` (mở `BookingModal` của Chiến) ngay dưới mỗi thẻ Sách/Thiết bị/Phòng học. |
| **`OnlineReaderModal.jsx`** (`F-02` - Đọc trực tuyến) | `GET /api/resources/{id}/read` | • Khi tài nguyên có `resource_type === 'DIGITAL'`, nút chính trên thẻ đổi thành **"Đọc trực tuyến"**.<br>• Bấm vào mở Modal toàn màn hình nhúng `<iframe src={pdfStreamUrl} className="w-full h-[80vh]" />`, hiển thị thanh tiến độ đọc. |
| **`ResourceManagePage.jsx`** (`W6` - Quản lý kho) | `POST /api/resources`<br>`PUT /api/resources/{id}`<br>`DELETE /api/resources/{id}` | • Bảng danh sách tài nguyên dành cho Thủ thư có phân trang.<br>• Modal Thêm/Sửa tài nguyên (nếu chọn loại `DIGITAL` thì hiện thêm ô upload file PDF).<br>• Nút **Xóa mềm / Chuyển bảo trì**: Có hộp thoại xác nhận trước khi gọi API đổi trạng thái sang `INACTIVE` hoặc `MAINTENANCE`. |
| **`ReportDashboardPage.jsx`** (`F-09`, `F-10` - Báo cáo) | `GET /api/reports/dashboard`<br>`GET /api/reports/export` | • 4 thẻ KPI tổng quan (Tổng tài sản, Đang cho mượn, Phiếu quá hạn, Tổng thu phạt).<br>• Biểu đồ cột lượt mượn trả theo tháng & Bảng Top 10 tài liệu đọc/mượn nhiều nhất.<br>• Cụm nút **"Xuất Excel (.xlsx)"** và **"Xuất PDF"** tải file trực tiếp về máy. |

---

### 3.2. Phần 2: Trần Minh Chiến (`52400103`) — Đặt mượn Giữ chỗ 10p, Mã QR & Quầy Thủ thư (`W2 Modal`, `W3`, `W5`)

* **Các tệp phụ trách:**
  * `src/components/lending/BookingModal.jsx` (Nhúng vào `CatalogPage.jsx` của Khoa)
  * `src/pages/lending/HoldConfirmPage.jsx` (`W3`)
  * `src/pages/librarian/CirculationDeskPage.jsx` (`W5`)

| Màn hình / Component | API kết nối | Chi tiết giao diện & Tương tác cần thực hiện |
| :--- | :--- | :--- |
| **`BookingModal.jsx`** (Hộp thoại Đặt mượn / Đặt phòng trên `W2`) | `POST /api/loans/hold` | • Nhận prop `resource` từ trang `W2` của Khoa.<br>• Nếu `resource_type === 'BOOK'`: Chọn ngày mượn và số ngày mượn (1–14 ngày).<br>• Nếu `resource_type === 'ROOM'` hoặc `'EQUIPMENT'`: Chọn ngày và khung giờ bắt đầu (`borrow_from`) – kết thúc (`due_date`).<br>• **Xử lý phản hồi:**<br>  - Thành công (`201`): Chuyển hướng ngay sang trang `/loans/hold/{loan_id}` (`W3`) kèm dữ liệu `hold_expires_at`.<br>  - Lỗi `403` (Đang nợ phạt `BR01`): Hiển thị hộp cảnh báo màu đỏ *"Bạn cần thanh toán nợ phạt trước khi mượn tài nguyên mới"* kèm nút dẫn sang trang `W4` của Phát.<br>  - Lỗi `409` (Vừa hết hàng / Trùng giờ): Báo lỗi ngay trên Modal và gọi hàm refresh lại danh sách của Khoa. |
| **`HoldConfirmPage.jsx`** (`W3` - Đếm ngược 10 phút & Mã QR) | `POST /api/loans/{id}/confirm`<br>`POST /api/loans/{id}/cancel` | • **Trạng thái 1 – Đang giữ chỗ (`HOLDING`):**<br>  - Hiển thị đồng hồ đếm ngược lớn (`MM:SS`) tính từ `hold_expires_at - Date.now()` bằng `setInterval` mỗi giây.<br>  - Có 2 nút rõ ràng: **"Xác nhận đặt mượn"** (màu xanh đậm) và **"Hủy giữ chỗ"** (màu xám).<br>  - Nếu đồng hồ về `00:00` mà chưa bấm: Tự động khóa nút Xác nhận và hiện thông báo *"Phiếu đã hết hạn giữ chỗ 10 phút, tài nguyên đã được hoàn lại kho"*.<br>• **Trạng thái 2 – Đã xác nhận (`PENDING`):**<br>  - Hiển thị **Mã QR Phiếu mượn** (dùng thư viện `qrcode.react` truyền chuỗi `qr_token`), mã phiếu, thời hạn nhận đồ tại quầy và nút **"Tải mã QR / Xem lịch sử"**. |
| **`CirculationDeskPage.jsx`** (`W5` - Quầy Thủ thư) | `GET /api/loans`<br>`POST /api/loans/scan-qr`<br>`POST /api/loans/{id}/approve`<br>`POST /api/loans/{id}/reject`<br>`POST /api/loans/{id}/return` | • **Khu vực Quét QR & Tra cứu nhanh (Đầu trang):** Ô nhập mã `qr_token` / Mã phiếu / MSSV (hỗ trợ súng bắn mã vạch hoặc nút bật Camera quét QR) $\rightarrow$ bấm tìm sẽ mở ngay thẻ chi tiết phiếu.<br>• **Tab 1 – Chờ duyệt giao đồ (`PENDING`):** Nút **"Xác nhận giao đồ"** (`approve`) và nút **"Từ chối"** (`reject` — bấm vào mở ô bắt buộc nhập lý do từ chối).<br>• **Tab 2 – Đang mượn & Ghi nhận trả (`BORROWING`):** Bấm **"Ghi nhận trả"** mở Modal chọn tình trạng tài sản khi trả:<br>  - Radio dọc: `Tốt (GOOD)` / `Hư hỏng (DAMAGED)` / `Làm mất (LOST)`.<br>  - Nếu chọn `Hư hỏng` hoặc `Làm mất`: Hiện thêm ô nhập **Số tiền bồi thường (VNĐ)** và **Ghi chú vi phạm** để chuyển dữ liệu sang `FineService` của Phát. |

---

### 3.3. Phần 3: Lý Hạo Danh (`52400175`) — Đăng nhập OTP 2 Bước & Quản trị Hệ thống (`W1`, `W7`)

* **Các tệp phụ trách:**
  * `src/context/AuthContext.jsx` (Lưu thông tin `user`, `token`, `role` và hàm `login`, `logout`)
  * `src/pages/auth/LoginPage.jsx` (`W1`)
  * `src/pages/admin/AdminDashboardPage.jsx` (`W7`)

| Màn hình / Component | API kết nối | Chi tiết giao diện & Tương tác cần thực hiện |
| :--- | :--- | :--- |
| **`LoginPage.jsx`** (`W1` - Đăng nhập OTP không mật khẩu) | `POST /api/auth/otp/request`<br>`POST /api/auth/otp/verify` | • **Bước 1 (Nhập Email trường):**<br>  - Ô nhập email có gợi ý đuôi `@student.tdtu.edu.vn` / `@tdtu.edu.vn`. Kiểm tra định dạng trước khi gọi API.<br>  - Khi thành công: Chuyển sang giao diện Bước 2 trên cùng khung thẻ.<br>• **Bước 2 (Nhập mã OTP 6 chữ số):**<br>  - 6 ô nhập số OTP tự động nhảy con trỏ (hoặc 1 ô lớn canh giữa `tracking-widest`).<br>  - Bộ đếm ngược **60 giây** cho nút *"Gửi lại mã OTP"* và thông báo mã có hiệu lực trong 5 phút.<br>  - Khi xác thực thành công: Lưu token vào `localStorage`, cập nhật `AuthContext` và tự động điều hướng theo vai trò (`STUDENT`/`LECTURER` $\rightarrow$ `/catalog`, `LIBRARIAN` $\rightarrow$ `/librarian/circulation`, `ADMIN` $\rightarrow$ `/admin`). |
| **`AdminDashboardPage.jsx`** (`W7` - Quản trị & Audit Log) | `GET /api/admin/users`<br>`POST /api/admin/users`<br>`PATCH /api/admin/users/{id}`<br>`GET\|PUT /api/admin/settings`<br>`GET /api/admin/audit-logs` | Chia thành **3 Tab quản trị rõ ràng**:<br>• **Tab 1 – Quản lý Tài khoản & Phân quyền:** Bảng danh sách người dùng, bộ lọc theo Role (`STUDENT`, `LECTURER`, `LIBRARIAN`, `ADMIN`), nút tạo tài khoản mới, Dropdown đổi Role và nút gạt **Khóa / Mở khóa** (`LOCKED` / `ACTIVE`).<br>• **Tab 2 – Tham số Hệ thống (`system_settings`):** Form đóng khung có viền cho phép chỉnh sửa trực tiếp: *Số lượng mượn tối đa (`MAX_ACTIVE_LOANS`)*, *Đơn giá phạt mỗi ngày (`FINE_PER_DAY`)*, *Thời gian giữ chỗ (`HOLD_MINUTES`)*, *Giờ hủy phòng tối thiểu (`ROOM_CANCEL_HOURS`)*.<br>• **Tab 3 – Nhật ký Kiểm toán (`Audit Log` - `F-12`):** Bảng tra cứu lịch sử thao tác toàn hệ thống (Thời gian, Người thực hiện, Hành động, Đối tượng, Địa chỉ IP, Nút xem JSON chi tiết cũ/mới). |

---

### 3.4. Phần 4: Hồ Thịnh Phát (`51900821`) — Lịch sử, Công nợ, Thanh toán VNPay/MoMo & Chuông Thông báo (`W4`)

* **Các tệp phụ trách:**
  * `src/pages/fines/MyHistoryAndFinesPage.jsx` (`W4`)
  * `src/pages/fines/PaymentResultPage.jsx` (Hứng kết quả trả về từ cổng thanh toán)
  * `src/components/common/NotificationBell.jsx` (Gắn trên thanh Header chung)

| Màn hình / Component | API kết nối | Chi tiết giao diện & Tương tác cần thực hiện |
| :--- | :--- | :--- |
| **`MyHistoryAndFinesPage.jsx`** (`W4` - Lịch sử & Công nợ phạt) | `GET /api/my-loans`<br>`GET /api/my-penalties`<br>`POST /api/loans/{id}/cancel`<br>`POST /api/penalties/{id}/pay` | • **Banner Cảnh báo Công nợ (Đầu trang):** Nếu tổng tiền phạt `UNPAID > 0`, hiển thị khung cảnh báo màu đỏ nổi bật: *"Bạn đang có công nợ [Số tiền] VNĐ chưa thanh toán. Quyền đặt mượn mới đang tạm khóa (BR01)"*.<br>• **Khối 1 – Lịch sử Mượn trả & Đặt phòng:** Bảng danh sách các phiếu của cá nhân kèm Badge trạng thái (`HOLDING`, `PENDING`, `BORROWING`, `RETURNED`...). Với phiếu đang `HOLDING` hoặc `PENDING`, hiển thị nút **"Xem mã QR"** (dẫn sang `W3`) và nút **"Hủy phiếu"** (gọi API hủy `F-08`).<br>• **Khối 2 – Danh sách Phiếu phạt & Thanh toán (`F-06`, `F-06b`):** Hiển thị nguyên nhân phạt (`Trả trễ X ngày`, `Làm hư hỏng`, `Làm mất`), số tiền phạt và trạng thái (`UNPAID` / `PAID`).<br>• **Tích hợp Thanh toán:** Với phiếu `UNPAID`, hiển thị 2 nút chọn cổng **"Thanh toán VNPay"** hoặc **"Thanh toán MoMo"** $\rightarrow$ gọi API lấy `payment_url` rồi chuyển hướng `window.location.href = payment_url`. |
| **`PaymentResultPage.jsx`** (Trang kết quả giao dịch) | `GET /api/payments/{txn_ref}/status` | • Đọc mã `txn_ref` từ URL sau khi VNPay/MoMo redirect về.<br>• Hiển thị biểu tượng Thành công (màu xanh, thông báo nợ phạt đã về `0đ` và **đã mở khóa quyền đặt mượn `BR06`**) hoặc Thất bại (màu đỏ, kèm nút **"Thử thanh toán lại"** quay về `W4`). |
| **`NotificationBell.jsx`** (`F-05` - Chuông nhắc hạn trả) | `GET /api/notifications`<br>`PATCH /api/notifications/{id}/read` | • Đặt trên thanh Header của `StudentLecturerLayout`.<br>• Hiển thị chấm đỏ số lượng thông báo chưa đọc (`unreadCount`).<br>• Khi bấm vào mở Dropdown liệt kê các thông báo nhắc hạn trả (còn 3 ngày, còn 1 ngày), bấm vào từng dòng sẽ gạch đã đọc và dẫn tới phiếu mượn tương ứng ở `W4`. |

---

## 4. Khung Định tuyến Frontend Chung (`frontend/src/App.jsx`)

Để 4 thành viên ghép trang vào dự án mà không gây xung đột Git, tệp `src/App.jsx` được chia sẵn theo 4 cụm Route tương ứng với từng người như sau:

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Layouts dùng chung
import StudentLecturerLayout from './layouts/StudentLecturerLayout';
import LibrarianLayout from './layouts/LibrarianLayout';
import AdminLayout from './layouts/AdminLayout';

// 1. Pages của NGUYỄN ANH KHOA (Đã dựng trước)
import CatalogPage from './pages/repository/CatalogPage';
import ResourceManagePage from './pages/librarian/ResourceManagePage';
import ReportDashboardPage from './pages/reports/ReportDashboardPage';

// 2. Pages của TRẦN MINH CHIẾN
import HoldConfirmPage from './pages/lending/HoldConfirmPage';
import CirculationDeskPage from './pages/librarian/CirculationDeskPage';

// 3. Pages của LÝ HẠO DANH
import LoginPage from './pages/auth/LoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';

// 4. Pages của HỒ THỊNH PHÁT
import MyHistoryAndFinesPage from './pages/fines/MyHistoryAndFinesPage';
import PaymentResultPage from './pages/fines/PaymentResultPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* W1 - Đăng nhập OTP (Danh) */}
          <Route element="{<LoginPage" path="/login"/>} />

          {/* Phân hệ Sinh viên & Giảng viên (W2, W3, W4) */}
          <Route element="{<StudentLecturerLayout"/>}>
            <Route element="{<CatalogPage" path="/catalog"/>} />                     {/* Khoa (kèm BookingModal của Chiến) */}
            <Route element="{<HoldConfirmPage" path="/loans/hold/:id"/>} />          {/* Chiến (W3) */}
            <Route element="{<MyHistoryAndFinesPage" path="/my-history"/>} />        {/* Phát (W4) */}
            <Route element="{<PaymentResultPage" path="/payments/result"/>} />       {/* Phát (W4 Callback) */}
          </Route>

          {/* Phân hệ Cán bộ Thư viện (W5, W6) */}
          <Route element="{<LibrarianLayout" path="/librarian"/>}>
            <Route element="{<CirculationDeskPage" path="circulation"/>} />          {/* Chiến (W5) */}
            <Route element="{<ResourceManagePage" path="resources"/>} />             {/* Khoa (W6) */}
            <Route element="{<ReportDashboardPage" path="reports"/>} />              {/* Khoa (F-09, F-10) */}
          </Route>

          {/* Phân hệ Quản trị viên (W7) */}
          <Route element="{<AdminLayout" path="/admin"/>}>
            <Route element="{<AdminDashboardPage" index/>} />                        {/* Danh (W7) */}
          </Route>

          {/* Mặc định điều hướng về trang tra cứu */}
          <Route element="{<Navigate" path="*" replace to="/catalog"/>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```