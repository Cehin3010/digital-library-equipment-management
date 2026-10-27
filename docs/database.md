# Thiết kế Cơ sở Dữ liệu (Database Design)

## 1. Quy ước Đặt tên & Toàn vẹn Dữ liệu

Tuân thủ nghiêm ngặt tài liệu **Quy ước Viết mã (Coding Conventions)**:
- **Tên bảng (Tables)**: Sử dụng `snake_case` ở dạng **số nhiều** (`roles`, `users`, `digital_documents`, `reading_histories`, `physical_assets`, `borrow_transactions`, `fine_invoices`, `study_rooms`, `room_bookings`, `notifications`, `audit_logs`).
- **Tên cột (Columns)**: Sử dụng `snake_case` (`user_id`, `asset_id`, `room_id`, `created_at`, `due_date`, `returned_at`).
- **Ràng buộc Toàn vẹn (Data Integrity - NFR #3)**: Tất cả các khóa ngoại liên kết đến tài sản (`physical_assets`), tài liệu (`digital_documents`), phòng học (`study_rooms`) và người dùng (`users`) đều sử dụng `ON DELETE RESTRICT` để ngăn chặn việc xóa hồ sơ tài sản khi đang còn phiếu mượn hoạt động hoặc công nợ chưa thanh toán.

---

## 2. Sơ đồ Thực thể Kết hợp (ERD)

```mermaid
erDiagram
    roles ||--o{ users : "has"
    users ||--o{ reading_histories : "reads"
    digital_documents ||--o{ reading_histories : "logged_in"
    users ||--o{ borrow_transactions : "borrows"
    physical_assets ||--o{ borrow_transactions : "lent_in"
    borrow_transactions ||--o| fine_invoices : "incurs"
    users ||--o{ fine_invoices : "owes"
    users ||--o{ room_bookings : "books"
    study_rooms ||--o{ room_bookings : "scheduled_in"
    users ||--o{ notifications : "receives"
    users ||--o{ audit_logs : "performs"

    roles {
        int role_id PK
        string role_code UK
        string role_name
    }

    users {
        int user_id PK
        string university_id UK
        string full_name
        string email UK
        string password_hash
        int role_id FK
        int status
        decimal total_debt
        datetime created_at
    }

    digital_documents {
        int document_id PK
        string isbn UK
        string title
        string author
        string category
        string dewey_code
        int publish_year
        string file_format
        string file_url
        int total_pages
        int max_print_pages
        int view_count
        datetime created_at
    }

    reading_histories {
        int history_id PK
        int user_id FK
        int document_id FK
        int current_page
        decimal progress_percent
        int printed_pages
        int reading_seconds
        datetime last_read_at
    }

    physical_assets {
        int asset_id PK
        string asset_code UK
        string asset_name
        string asset_type
        string department
        string location
        string status
        string condition_note
        decimal daily_late_fee
        decimal hourly_rental_fee
        datetime created_at
    }

    borrow_transactions {
        int transaction_id PK
        string transaction_code UK
        int user_id FK
        int asset_id FK
        string qr_code_token UK
        datetime borrow_date
        datetime due_date
        datetime received_at
        datetime returned_at
        string status
        string return_condition
        decimal fine_amount
        datetime created_at
    }

    fine_invoices {
        int fine_id PK
        int transaction_id FK
        int user_id FK
        int days_late
        decimal daily_rate
        decimal amount
        string is_paid
        datetime created_at
    }

    study_rooms {
        int room_id PK
        string room_code UK
        string room_name
        int capacity
        string building
        string equipment_list
        string status
        decimal hourly_rate
    }

    room_bookings {
        int booking_id PK
        string booking_code UK
        int room_id FK
        int user_id FK
        date booking_date
        time start_time
        time end_time
        int attendees_count
        string purpose
        decimal total_cost
        string status
        datetime created_at
        datetime updated_at
    }

    notifications {
        int notification_id PK
        int user_id FK
        string title
        string message
        string notification_type
        int is_read
        datetime created_at
    }

    audit_logs {
        int log_id PK
        int user_id FK
        string action_code
        string target_entity
        string target_id
        string details
        string ip_address
        datetime created_at
    }
```

---

## 3. Mô tả Chi tiết Các Bảng Dữ liệu Chính

### 3.1. Bảng `users` & `roles`
- Lưu trữ thông tin định danh sinh viên, giảng viên, cán bộ thư viện và quản trị viên.
- Cột `status`: `1` (`STATUS_ACTIVE`), `2` (`STATUS_LOCKED` - tự động khóa khi `total_debt >= 100000`).
- Cột `password_hash`: Lưu trữ chuỗi băm chuẩn `bcrypt`.

### 3.2. Bảng `digital_documents` & `reading_histories` (Phân hệ 1)
- `isbn`: Có ràng buộc `UNIQUE` để chống trùng lặp khi nhập kho (F-01).
- `dewey_code`: Mã phân loại thập phân Dewey (ví dụ: `005.1` cho Lập trình máy tính, `621.3` cho Kỹ thuật điện tử).
- `reading_histories`: Lưu vết trang đang đọc (`current_page`), tiến độ (`progress_percent`), tổng thời gian đọc (`reading_seconds`) và số trang đã in (`printed_pages` <= `max_print_pages`).

### 3.3. Bảng `physical_assets`, `borrow_transactions` & `fine_invoices` (Phân hệ 2 & 3)
- `physical_assets.status`: Chỉ nhận một trong 3 giá trị chuẩn hóa: `AVAILABLE` (Còn trống - Màu xanh), `BORROWED` (Đang mượn - Màu đỏ), `MAINTENANCE` (Bảo trì - Màu xám).
- `borrow_transactions.qr_code_token`: Chuỗi định danh duy nhất sinh ra khi đặt mượn trực tuyến để Cán bộ Thư viện quét xác nhận bàn giao hoặc nhận trả tại quầy (F-03, F-04).

### 3.4. Bảng `study_rooms` & `room_bookings` (Phân hệ 4)
- Kiểm soát lịch đặt phòng theo ngày (`booking_date`) và khung giờ (`start_time`, `end_time`).
- Hỗ trợ kiểm tra xung đột thời gian thực và lưu trữ lịch sử hủy/dời lịch (`status`: `CONFIRMED`, `CANCELLED`, `COMPLETED`).

### 3.5. Bảng `audit_logs` (Phân hệ 6)
- Ghi nhận đầy đủ: Người thực hiện (`user_id`), Hành động (`action_code`), Đối tượng tác động (`target_entity`, `target_id`), Chi tiết JSON (`details`), Địa chỉ IP (`ip_address`) và Thời gian thực hiện (`created_at`).
