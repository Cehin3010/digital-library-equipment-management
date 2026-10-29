# Đặc tả Phân công Phát triển API, Database & Giao diện (Full-Stack Module Assignment)

Tài liệu này quy định ranh giới công việc, danh sách RESTful API, bảng Cơ sở dữ liệu, màn hình React và cách giao tiếp giữa các module cho 4 thành viên trong nhóm. Mọi người bám sát tài liệu này khi tạo nhánh `feature/*` và mở Pull Request để không bị xung đột mã nguồn (Merge Conflict).

---

## 1. Quy chuẩn Kỹ thuật Chung (Bắt buộc)

| Tầng công nghệ | Ngôn ngữ / Công cụ | Quy định bắt buộc khi lập trình |
| :--- | :--- | :--- |
| **Backend API** | **PHP 8.3 (Laravel 11)** | • **Controller** (`app/Http/Controllers/Api/`): Chỉ nhận Request, gọi Service và trả về JSON.<br>• **FormRequest** (`app/Http/Requests/`): Chứa toàn bộ luật kiểm tra dữ liệu đầu vào (`rules()`).<br>• **Service** (`app/Services/`): Chứa toàn bộ logic nghiệp vụ và `DB::transaction()`.<br>• **Xác thực:** Dùng `Laravel Sanctum` (gửi header `Authorization: Bearer <token>`). |
| **Database** | **PostgreSQL 16** | • Quản lý cấu trúc bảng qua **Laravel Migration** (`database/migrations/`), truy vấn qua **Eloquent ORM**.<br>• Mọi khóa ngoại bắt buộc đặt `restrictOnDelete()` để bảo toàn lịch sử mượn trả và kiểm toán. |
| **Frontend UI** | **React (Vite) + Tailwind CSS + Axios** | • Gọi API thông qua instance chung `src/services/api.js`.<br>• Mỗi thành viên chỉ sửa code trong thư mục trang thuộc phân hệ của mình (`src/pages/<module>/`) và component riêng (`src/components/<module>/`). |

### Định dạng JSON phản hồi chuẩn cho mọi API:
```json
// Khi thành công (HTTP 200, 201)
{
  "success": true,
  "message": "Thao tác thành công",
  "data": { ... }
}

// Khi thất bại (HTTP 400, 401, 403, 404, 409, 422)
{
  "success": false,
  "message": "Mô tả lỗi rõ ràng bằng tiếng Việt để hiển thị lên UI",
  "errors": { ... }
}
```

---

## 2. Bảng Phân công Tổng quan theo Thành viên

| Thành viên | MSSV | Phân hệ phụ trách (`F`) | Nhánh Git (`feature/*`) | Bảng DB sở hữu | Màn hình UI |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Lý Hạo Danh** | `52400175` | **Phân hệ 6:** Xác thực OTP, Phân quyền RBAC, Tham số hệ thống & Audit Log (`F-11`, `F-12`) | `chore/init-laravel-ci`<br>`feature/auth-otp`<br>`feature/rbac-system-settings`<br>`feature/audit-log` | `roles`<br>`users`<br>`login_otps`<br>`system_settings`<br>`audit_logs` | **W1** (Đăng nhập OTP)<br>**W7** (Quản trị & Audit Log) |
| **Nguyễn Anh Khoa** | `52400051` | **Phân hệ 1 & 5:** Kho Tài liệu số, Tài sản, Online Reader & Báo cáo thống kê (`F-01`, `F-02`, `F-09`, `F-10`) | `chore/docker-nginx-setup`<br>`feature/digital-repository`<br>`feature/online-reader`<br>`feature/dashboard-reports` | `categories`<br>`resources` *(kèm GIN Index)* | **W2** (Tra cứu, Lịch trống, Đọc PDF)<br>**W6** (Quản lý kho & Báo cáo) |
| **Trần Minh Chiến** | `52400103` | **Phân hệ 2 & 4:** Đặt mượn giữ chỗ 10p, Quét QR Nhận/Trả & Đặt phòng học (`F-03`, `F-04`, `F-07`, `F-08`) | `chore/init-react-ui`<br>`feature/asset-lending-hold`<br>`feature/loan-qr-circulation`<br>`feature/room-booking` | `loans` *(kèm Partial Unique Index)* | **W2** (`BookingModal`)<br>**W3** (Đếm ngược 10p & QR)<br>**W5** (Quầy Thủ thư) |
| **Hồ Thịnh Phát** | `51900821` | **Phân hệ 3 & Thanh toán:** Nhắc hạn tự động, Tính phí phạt & Cổng VNPay/MoMo (`F-05`, `F-06`, `F-06b`) | `chore/db-seeders-docs`<br>`feature/auto-reminder`<br>`feature/fine-engine`<br>`feature/payment-gateway` | `penalties`<br>`payments`<br>`notifications` | **W4** (Lịch sử, Công nợ & Thanh toán)<br>`NotificationBell` |

---

## 3. Đặc tả Chi tiết API & Cách Hiện thực của Từng Thành viên

### 3.1. Lý Hạo Danh (`52400175`) — Bảo mật, Tài khoản, Cấu hình & Audit Log (`F-11`, `F-12`)

* **File Backend phụ trách:**
  * Controllers: `app/Http/Controllers/Api/AuthController.php`, `UserController.php`, `SystemSettingController.php`, `AuditLogController.php`
  * Services & Middleware: `app/Services/AuthService.php`, `app/Services/AuditService.php`, `app/Http/Middleware/RoleMiddleware.php`
* **File Frontend phụ trách:** `src/pages/auth/LoginPage.jsx` (`W1`), `src/pages/admin/AdminDashboardPage.jsx` (`W7`)

| Method & Endpoint | Quyền truy cập | Logic xử lý chi tiết tại Backend (Laravel) |
| :--- | :--- | :--- |
| `POST /api/auth/request-otp` | Public | 1. Validate `email` phải thuộc đuôi email trường và có trong bảng `users` với `status = 'ACTIVE'` (`BR08`).<br>2. Kiểm tra trong `login_otps` nếu mã gần nhất tạo chưa quá **60 giây** thì báo lỗi chờ.<br>3. Sinh mã 6 chữ số (`random_int(100000, 999999)`), băm bằng `Hash::make()` lưu vào `login_otps` (`expires_at = now()->addMinutes(5)`, `attempts = 0`).<br>4. Đẩy Job gửi email OTP vào **Laravel Queue** (hiển thị trên Mailpit cổng `8025`). |
| `POST /api/auth/verify-otp` | Public | 1. Tìm bản ghi OTP mới nhất của `email`. Kiểm tra `expires_at > now()` và `attempts < 5`.<br>2. Kiểm tra `Hash::check($otp, $record->otp_hash)`. Nếu sai: tăng `attempts` lên 1, trả lỗi `422`.<br>3. Nếu đúng: xóa OTP đã dùng, cập nhật `last_login_at`, cấp token `$user->createToken('api')->plainTextToken`, ghi `audit_logs` và trả về thông tin user kèm `role_name`. |
| `POST /api/auth/logout` | Đã đăng nhập | Xóa token hiện hành (`$request->user()->currentAccessToken()->delete()`) và ghi `audit_logs`. |
| `GET /api/auth/me` | Đã đăng nhập | Trả về thông tin người dùng hiện tại kèm `role` để Frontend duy trì phiên đăng nhập. |
| `GET /api/admin/users` | `ADMIN` | Danh sách tài khoản có phân trang, hỗ trợ lọc theo `role_id`, `status` và tìm theo `email` / `user_code`. |
| `POST /api/admin/users`<br>`PATCH /api/admin/users/{id}` | `ADMIN` | Tạo người dùng mới, cập nhật vai trò (`STUDENT`, `LECTURER`, `LIBRARIAN`, `ADMIN`) hoặc khóa/mở khóa tài khoản (`status = 'LOCKED' / 'ACTIVE'`). Ghi nhận vào `audit_logs`. |
| `GET /api/admin/settings`<br>`PUT /api/admin/settings` | `ADMIN` | Lấy và cập nhật các tham số trong `system_settings` (`MAX_ACTIVE_LOANS`, `LOAN_DAYS`, `FINE_PER_DAY`, `HOLD_MINUTES`, `ROOM_CANCEL_HOURS`). |
| `GET /api/admin/audit-logs` | `ADMIN` | Truy vấn bảng `audit_logs` sắp xếp mới nhất (`created_at DESC`), lọc theo `user_id`, `action`, `entity_type`. |

---

### 3.2. Nguyễn Anh Khoa (`52400051`) — Kho Tài nguyên, Online Reader & Báo cáo (`F-01`, `F-02`, `F-09`, `F-10`)

* **File Backend phụ trách:**
  * Controllers: `app/Http/Controllers/Api/CategoryController.php`, `ResourceController.php`, `ReportController.php`
  * Services: `app/Services/ResourceService.php`, `app/Services/ReportService.php`
* **File Frontend phụ trách:** `src/pages/repository/CatalogPage.jsx` (`W2`), `src/components/repository/OnlineReaderModal.jsx`, `src/pages/librarian/ResourceManagePage.jsx` (`W6`), `src/pages/reports/ReportDashboardPage.jsx`

| Method & Endpoint | Quyền truy cập | Logic xử lý chi tiết tại Backend (Laravel) |
| :--- | :--- | :--- |
| `GET /api/categories`<br>`POST /api/categories` | Đã đăng nhập (`GET`)<br>`LIBRARIAN`, `ADMIN` (`POST`) | Lấy danh sách danh mục phân cấp (`parent_id`) và thêm mới danh mục tài liệu / thiết bị / phòng học. |
| `GET /api/resources` | Đã đăng nhập | • Tìm kiếm theo từ khóa (`keyword`) sử dụng chỉ mục **PostgreSQL GIN Full-Text Search** trên `title`, `author_or_brand`, `code` đảm bảo tốc độ phản hồi $< 2\text{ giây}$.<br>• Lọc theo `category_id`, `resource_type` (`DIGITAL`, `BOOK`, `EQUIPMENT`, `ROOM`) và `status`.<br>• Trả về kèm nhãn trạng thái màu sắc: `AVAILABLE` (Xanh), `BORROWED` (Đỏ), `MAINTENANCE` (Xám). |
| `GET /api/resources/{id}` | Đã đăng nhập | Xem thông tin chi tiết của một tài liệu số, sách in, thiết bị hoặc phòng học. |
| `GET /api/resources/{id}/read` | Đã đăng nhập | **Phục vụ `F-02` (Online Reader):** Kiểm tra `resource_type === 'DIGITAL'`, trả về luồng đọc file PDF trực tiếp trên trình duyệt (`Content-Disposition: inline`) và gọi `AuditService` ghi nhận lượt đọc. |
| `POST /api/resources`<br>`PUT /api/resources/{id}`<br>`DELETE /api/resources/{id}` | `LIBRARIAN`, `ADMIN` | • `POST` / `PUT`: Kiểm tra trùng mã `code` (ISBN/Serial/Mã phòng), kiểm tra `0 <= available_quantity <= total_quantity`, hỗ trợ upload file PDF cho `DIGITAL`.<br>• `DELETE`: Thực hiện **Xóa mềm** bằng cách chuyển `status = 'INACTIVE'`. Chặn xóa nếu tài sản đang có phiếu `HOLDING` hoặc `BORROWING`. |
| `GET /api/resources/{id}/schedule` | Đã đăng nhập | Nhận `start_date`, `end_date` (lịch tuần), trả về danh sách các khung giờ `(borrow_from, due_date)` đang có người giữ chỗ hoặc mượn (`HOLDING`, `PENDING`, `BORROWING`) để hiển thị bảng lịch trống trên `W2`. |
| `GET /api/reports/dashboard` | `LIBRARIAN`, `ADMIN`, `LECTURER` | **Phục vụ `F-09`:** Thống kê thời gian thực tỷ lệ tài sản đang mượn, Top 10 tài liệu được đọc/mượn nhiều nhất, biểu đồ xu hướng mượn trả và vi phạm theo tháng. |
| `GET /api/reports/export` | `LIBRARIAN`, `ADMIN` | **Phục vụ `F-10`:** Xuất báo cáo sử dụng tài sản và danh sách công nợ phạt theo tháng/quý ra định dạng file **Excel (`.xlsx` / `.csv`)** hoặc **PDF**. |

---

### 3.3. Trần Minh Chiến (`52400103`) — Đặt mượn Giữ chỗ 10p, Quét QR Nhận/Trả & Đặt phòng (`F-03`, `F-04`, `F-07`, `F-08`)

* **File Backend phụ trách:**
  * Controllers: `app/Http/Controllers/Api/LoanController.php`, `LoanCirculationController.php`
  * Services & Console: `app/Services/LoanService.php`, `app/Console/Commands/ExpireHoldLoansCommand.php`
* **File Frontend phụ trách:** `src/components/lending/BookingModal.jsx`, `src/pages/lending/HoldConfirmPage.jsx` (`W3`), `src/pages/librarian/CirculationDeskPage.jsx` (`W5`)

| Method & Endpoint | Quyền truy cập | Logic xử lý chi tiết tại Backend (Laravel) |
| :--- | :--- | :--- |
| `POST /api/loans/hold` | `STUDENT`, `LECTURER` | **Xử lý Đặt mượn & Đặt phòng có giữ chỗ 10 phút (`F-03`, `F-07`):**<br>1. Kiểm tra người dùng có phiếu phạt `UNPAID` không (`BR01`) và tổng số phiếu đang giữ có vượt `MAX_ACTIVE_LOANS` không.<br>2. Kiểm tra xung đột lịch theo thời gian thực: không có phiếu đang hoạt động nào giao thoa khoảng `(borrow_from, due_date)`.<br>3. Mở `DB::transaction()`: thực thi câu lệnh nguyên tử chống *Race Condition*:<br>`UPDATE resources SET available_quantity = available_quantity - 1 WHERE resource_id = :id AND status = 'ACTIVE' AND available_quantity > 0`<br>4. Nếu số dòng cập nhật $= 0 \rightarrow$ `rollback()`, trả về `409 Conflict` ("Tài sản vừa hết số lượng khả dụng").<br>5. Tạo phiếu `loans` ở trạng thái `HOLDING`, `hold_expires_at = now()->addMinutes(10)`, sinh mã `qr_token` duy nhất $\rightarrow$ `commit()`. |
| `POST /api/loans/{id}/confirm` | `STUDENT`, `LECTURER` | Xác nhận phiếu đang `HOLDING` còn trong thời hạn 10 phút $\rightarrow$ chuyển `status = 'PENDING'`, gửi email xác nhận kèm mã QR nhận tài sản (`qr_token`) và ghi `audit_logs`. |
| `POST /api/loans/{id}/cancel` | `STUDENT`, `LECTURER` | **Phục vụ `F-08`:** Cho phép hủy phiếu đang `HOLDING` hoặc `PENDING` (với phòng học phải hủy trước giờ bắt đầu tối thiểu 2 giờ). Trong Transaction: đổi `status = 'CANCELLED'` và cộng trả `1` vào `available_quantity`. |
| `GET /api/loans` | `LIBRARIAN`, `ADMIN` | Danh sách phiếu mượn phục vụ quầy Thủ thư (`W5`), lọc theo `status`, tìm theo mã phiếu, `qr_token` hoặc MSSV. |
| `POST /api/loans/scan-qr` | `LIBRARIAN` | **Phục vụ `F-04`:** Nhận chuỗi `qr_token` từ máy quét QR / Webcam tại quầy, trả về chi tiết phiếu mượn, thông tin người mượn và tình trạng tài sản để Thủ thư xác nhận nhanh. |
| `POST /api/loans/{id}/approve` | `LIBRARIAN` | **Xác nhận bàn giao tài sản (`F-04`):** Chuyển phiếu từ `PENDING` sang `BORROWING`, ghi nhận `approved_by`, `approved_at` (không trừ tồn kho lần hai). |
| `POST /api/loans/{id}/reject` | `LIBRARIAN` | Từ chối phiếu `PENDING` (bắt buộc nhập `reject_reason`). Trong Transaction: chuyển `status = 'REJECTED'` và hoàn lại `1` vào `available_quantity`. |
| `POST /api/loans/{id}/return` | `LIBRARIAN` | **Xác nhận nhận trả tài sản (`F-04`):** Nhận `return_condition` (`GOOD`, `DAMAGED`, `LOST`) và phí bồi thường/ghi chú (nếu có). Trong Transaction:<br>1. Chuyển `status = 'RETURNED'`, `returned_at = now()`, `received_by = auth()->id()`.<br>2. Nếu không bị mất (`!= 'LOST'`), cộng trả `1` vào `available_quantity`.<br>3. Gọi `FineService::handleReturnPenalty($loan, ...)` của **Phát** để tự động tính phạt nếu trả trễ hoặc hư hỏng. |

* **Tác vụ tự động (Scheduler):** `ExpireHoldLoansCommand` chạy định kỳ mỗi phút (`everyMinute()`), tự động chuyển các phiếu `HOLDING` đã quá `hold_expires_at` sang `EXPIRED` và hoàn lại `available_quantity`.

---

### 3.4. Hồ Thịnh Phát (`51900821`) — Nhắc hạn tự động, Tính phí phạt & Cổng VNPay/MoMo (`F-05`, `F-06`, `F-06b`)

* **File Backend phụ trách:**
  * Controllers: `app/Http/Controllers/Api/PenaltyController.php`, `PaymentController.php`, `NotificationController.php`
  * Services & Console: `app/Services/FineService.php`, `app/Services/PaymentService.php`, `app/Console/Commands/SendDueRemindersCommand.php`
  * Seeders: `database/seeders/DatabaseSeeder.php`
* **File Frontend phụ trách:** `src/pages/fines/MyHistoryAndFinesPage.jsx` (`W4`), `src/components/common/NotificationBell.jsx`

| Method & Endpoint | Quyền truy cập | Logic xử lý chi tiết tại Backend (Laravel) |
| :--- | :--- | :--- |
| `GET /api/my-loans`<br>`GET /api/my-penalties` | `STUDENT`, `LECTURER` | Trả về lịch sử mượn trả cá nhân (đang mượn, chờ duyệt, đã trả) và danh sách phiếu phạt kèm tổng công nợ hiện tại trên màn hình `W4`. |
| `GET /api/notifications`<br>`PATCH /api/notifications/{id}/read` | Đã đăng nhập | **Phục vụ `F-05`:** Lấy danh sách thông báo nhắc hạn trả (ưu tiên hiển thị trên trang chủ tài khoản) và đánh dấu đã đọc. |
| `POST /api/penalties` | `LIBRARIAN` | Lập phiếu phạt bổ sung hoặc được gọi tự động từ `FineService`: tính `overdue_days = ceil((returned_at - due_date) / 86400)` và `amount = overdue_days * FINE_PER_DAY`, lưu vào bảng `penalties` với `status = 'UNPAID'`. |
| `POST /api/penalties/{id}/pay` | `STUDENT`, `LECTURER` | **Khởi tạo thanh toán VNPay / MoMo (`F-06b`):**<br>1. Kiểm tra phiếu phạt đang ở trạng thái `UNPAID`.<br>2. Sinh mã giao dịch duy nhất `txn_ref`, tạo bản ghi `payments` (`status = 'PENDING'`).<br>3. Ký số HMAC-SHA512 / SHA256 theo chuẩn VNPay / MoMo Sandbox và trả về `payment_url`. |
| `GET\|POST /api/payments/vnpay-ipn`<br>`POST /api/payments/momo-ipn` | Public (Webhook) | **Xử lý IPN Callback từ cổng thanh toán:**<br>1. Kiểm tra chữ ký điện tử (`vnp_SecureHash` / `signature`) và khớp số tiền `amount`.<br>2. Kiểm tra chống xử lý trùng bằng `txn_ref` (nếu `payments.status === 'SUCCESS'` thì trả về kết quả ngay).<br>3. Nếu giao dịch thành công: mở `DB::transaction()` cập nhật `payments.status = 'SUCCESS'`, `penalties.status = 'PAID'`, `paid_at = now()`, ghi `audit_logs` $\rightarrow$ tự động mở khóa quyền đặt mượn (`BR06`). |
| `GET /api/payments/{txn_ref}/status` | Đã đăng nhập | Kiểm tra trạng thái giao dịch sau khi trình duyệt người dùng được chuyển hướng từ cổng thanh toán về lại màn hình `W4`. |

* **Tác vụ tự động (Scheduler):** `SendDueRemindersCommand` chạy hằng ngày lúc `07:00` sáng (`dailyAt('07:00')`), quét các phiếu `BORROWING` sắp đến hạn (còn **3 ngày** và **1 ngày** theo `F-05`), tạo thông báo trong bảng `notifications` và đẩy Job gửi email nhắc hạn qua Queue.

---

## 4. Khung Định tuyến Chung (`backend/routes/api.php`)

Khi khởi tạo dự án, nhóm dùng chung cấu trúc file `routes/api.php` được chia sẵn 4 phân vùng dưới đây để không xảy ra xung đột khi gộp nhánh vào `develop`:

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\SystemSettingController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ResourceController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\LoanController;
use App\Http\Controllers\Api\LoanCirculationController;
use App\Http\Controllers\Api\PenaltyController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\NotificationController;

// Health-check endpoint
Route::get('/health', fn () => response()->json(['success' => true, 'message' => 'API is running']));

/*
|--------------------------------------------------------------------------
| 1. MODULE CỦA LÝ HẠO DANH (F-11, F-12: Auth, RBAC, Settings, Audit Log)
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('/request-otp', [AuthController::class, 'requestOtp']);
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

Route::middleware(['auth:sanctum', 'role:ADMIN'])->prefix('admin')->group(function () {
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::patch('/users/{id}', [UserController::class, 'update']);
    Route::get('/settings', [SystemSettingController::class, 'index']);
    Route::put('/settings', [SystemSettingController::class, 'update']);
    Route::get('/audit-logs', [AuditLogController::class, 'index']);
});

/*
|--------------------------------------------------------------------------
| 2. MODULE CỦA NGUYỄN ANH KHOA (F-01, F-02, F-09, F-10: Repository & Reports)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/resources', [ResourceController::class, 'index']);
    Route::get('/resources/{id}', [ResourceController::class, 'show']);
    Route::get('/resources/{id}/read', [ResourceController::class, 'streamPdf']);
    Route::get('/resources/{id}/schedule', [ResourceController::class, 'schedule']);

    Route::middleware('role:LIBRARIAN,ADMIN')->group(function () {
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::post('/resources', [ResourceController::class, 'store']);
        Route::put('/resources/{id}', [ResourceController::class, 'update']);
        Route::delete('/resources/{id}', [ResourceController::class, 'destroy']);
        Route::get('/reports/export', [ReportController::class, 'export']);
    });

    Route::middleware('role:LIBRARIAN,ADMIN,LECTURER')
        ->get('/reports/dashboard', [ReportController::class, 'dashboard']);
});

/*
|--------------------------------------------------------------------------
| 3. MODULE CỦA TRẦN MINH CHIẾN (F-03, F-04, F-07, F-08: Lending, QR & Rooms)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->prefix('loans')->group(function () {
    Route::middleware('role:STUDENT,LECTURER')->group(function () {
        Route::post('/hold', [LoanController::class, 'hold']);
        Route::post('/{id}/confirm', [LoanController::class, 'confirm']);
        Route::post('/{id}/cancel', [LoanController::class, 'cancel']);
    });

    Route::middleware('role:LIBRARIAN,ADMIN')->group(function () {
        Route::get('/', [LoanCirculationController::class, 'index']);
        Route::post('/scan-qr', [LoanCirculationController::class, 'scanQr']);
        Route::post('/{id}/approve', [LoanCirculationController::class, 'approve']);
        Route::post('/{id}/reject', [LoanCirculationController::class, 'reject']);
        Route::post('/{id}/return', [LoanCirculationController::class, 'returnAsset']);
    });
});

/*
|--------------------------------------------------------------------------
| 4. MODULE CỦA HỒ THỊNH PHÁT (F-05, F-06, F-06b: Reminders, Fines & Payments)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/my-loans', [PenaltyController::class, 'myLoans']);
    Route::get('/my-penalties', [PenaltyController::class, 'myPenalties']);
    Route::post('/penalties/{id}/pay', [PaymentController::class, 'initiatePayment']);
    Route::get('/payments/{txnRef}/status', [PaymentController::class, 'checkStatus']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);

    Route::middleware('role:LIBRARIAN,ADMIN')
        ->post('/penalties', [PenaltyController::class, 'store']);
});

// Public Webhook IPN từ VNPay & MoMo
Route::match(['get', 'post'], '/payments/vnpay-ipn', [PaymentController::class, 'vnpayIpn']);
Route::post('/payments/momo-ipn', [PaymentController::class, 'momoIpn']);
```