# TASK2 — Mượn, trả tài sản và đặt phòng

## 1. Mục tiêu

Tài liệu mô tả phạm vi và cách sử dụng phân hệ mượn–trả tài sản, đặt phòng học. API được đặt dưới tiền tố `/api`; frontend gọi API qua Axios client dùng chung tại `frontend/src/services/api.js`.

## 2. Vai trò

| Vai trò | Quyền trong phân hệ |
|---|---|
| `STUDENT`, `LECTURER` | Tạo và quản lý phiếu mượn của mình; xem lịch sử; đặt và hủy lượt đặt phòng của mình. |
| `LIBRARIAN`, `ADMIN` | Tra cứu phiếu tại quầy, bàn giao, từ chối và ghi nhận trả tài sản. |

Các API nghiệp vụ yêu cầu đăng nhập Sanctum. Quyền truy cập được khai báo bằng middleware trong `backend/routes/api.php`.

## 3. API mượn–trả

### 3.1. Bạn đọc

| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/loans/hold` | Giữ chỗ một sách in hoặc thiết bị đang sẵn có. |
| `POST` | `/api/loans/{id}/confirm` | Xác nhận phiếu trong thời gian giữ chỗ. |
| `POST` | `/api/loans/{id}/cancel` | Hủy phiếu đang giữ chỗ hoặc chờ duyệt. |
| `GET` | `/api/loans/mine` | Xem lịch sử phiếu mượn của người dùng hiện tại. |

Payload tạo giữ chỗ:

```json
{
  "resource_id": 12,
  "borrow_from": "2026-11-02 09:00:00",
  "due_date": "2026-11-05 17:00:00"
}
```

Khi giữ chỗ thành công, hệ thống giảm số lượng sẵn có và tạo mã QR cho phiếu. Giữ chỗ có hiệu lực 10 phút; hết hạn thì số lượng được hoàn lại khi hệ thống xử lý lượt giữ chỗ tiếp theo hoặc khi người dùng xác nhận phiếu đã hết hạn.

### 3.2. Nghiệp vụ tại quầy

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/loans` | Danh sách phiếu chờ duyệt hoặc đang được mượn; có thể lọc bằng `?status=PENDING` hoặc `?status=BORROWING`. |
| `POST` | `/api/loans/scan-qr` | Tra cứu phiếu bằng mã QR. |
| `POST` | `/api/loans/{id}/approve` | Bàn giao phiếu đang chờ duyệt. |
| `POST` | `/api/loans/{id}/reject` | Từ chối phiếu và hoàn số lượng tài nguyên. |
| `POST` | `/api/loans/{id}/return` | Ghi nhận trả tài sản. |

Payload từ chối:

```json
{
  "reason": "Tài sản đang được kiểm tra."
}
```

Payload ghi nhận trả:

```json
{
  "return_condition": "GOOD"
}
```

`return_condition` nhận một trong các giá trị `GOOD`, `DAMAGED`, `LOST`. Khi tài sản trả tốt, số lượng sẵn có được tăng lại. Nếu tài sản hỏng, mất hoặc trả trễ, phản hồi có trường `penalty_required` để báo nghiệp vụ cần xử lý phí phạt; việc tạo khoản phạt chưa được nối với service của phân hệ thanh toán.

## 4. API đặt phòng

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/room-bookings` | Xem các lượt đặt phòng của người dùng hiện tại. |
| `POST` | `/api/room-bookings` | Đặt phòng theo khoảng thời gian. |
| `POST` | `/api/room-bookings/{id}/cancel` | Hủy lượt đặt phòng của chính người dùng. |

Payload đặt phòng:

```json
{
  "resource_id": 24,
  "starts_at": "2026-11-03 10:00:00",
  "ends_at": "2026-11-03 11:00:00",
  "purpose": "Thảo luận nhóm"
}
```

Chỉ tài nguyên loại `ROOM` đang hoạt động được đặt. Khoảng giờ trùng với một lượt đã xác nhận sẽ bị từ chối. Người đặt chỉ được hủy lượt của mình khi còn ít nhất 2 giờ trước giờ bắt đầu.

## 5. Trạng thái chính

### Phiếu mượn

`HOLDING` → `PENDING` → `BORROWING` → `RETURNED`

Các nhánh kết thúc khác gồm `CANCELLED`, `EXPIRED`, `REJECTED`. Chỉ cho phép chuyển trạng thái theo nghiệp vụ tương ứng; các thao tác cập nhật tồn kho được thực hiện trong transaction để tránh giữ vượt số lượng.

### Lượt đặt phòng

Lượt đặt được tạo ở trạng thái `CONFIRMED`; khi hủy hợp lệ, trạng thái chuyển sang `CANCELLED`.

## 6. Cơ sở dữ liệu

- `loans`: phiếu mượn, mã QR, người mượn, tài nguyên, thời gian mượn/trả, người duyệt/nhận trả và tình trạng tài sản.
- `room_bookings`: người đặt, phòng, thời gian bắt đầu/kết thúc, mục đích và trạng thái.
- `resources.available_quantity`: số lượng sẵn có được điều chỉnh trong các thao tác giữ chỗ, hủy, từ chối, hết hạn và trả tài sản tốt.

Migration tương ứng nằm trong `backend/database/migrations/`.

## 7. Giao diện

- `frontend/src/pages/CatalogPage.jsx`: bắt đầu thao tác đặt mượn/đặt phòng từ danh mục.
- `frontend/src/pages/MyLoansPage.jsx`: xem phiếu mượn và mã QR của người dùng.
- `frontend/src/pages/RoomSchedulePage.jsx`: xem lịch và đặt phòng.
- `frontend/src/pages/CirculationDeskPage.jsx`: tra cứu và xử lý phiếu tại quầy.
- `frontend/src/components/repository/LoanBookingModal.jsx`: hộp thoại đặt mượn/đặt phòng.

Các trang nghiệp vụ được giới hạn hiển thị theo vai trò prototype ở frontend. Đây không thay thế cho xác thực và phân quyền ở backend.

## 8. Kiểm thử

Kiểm thử API tập trung tại `backend/tests/Feature/LoanApiTest.php`, bao gồm luồng giữ chỗ–xác nhận–hủy, bàn giao và trả, từ chối phiếu, giải phóng giữ chỗ hết hạn và từ chối lịch đặt phòng bị trùng.

Chạy kiểm thử backend trong môi trường PHP/Laravel:

```bash
cd backend
php artisan test --filter=LoanApiTest
```
