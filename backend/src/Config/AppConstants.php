<?php

declare(strict_types=1);

namespace App\Config;

/**
 * Quản lý tập trung toàn bộ hằng số nghiệp vụ của hệ thống.
 * Tuân thủ nguyên lý "No Magic Numbers" và quy tắc đặt tên UPPER_SNAKE_CASE.
 */
final class AppConstants
{
    // Mã vai trò người dùng (RBAC Roles)
    public const ROLE_ADMIN = 1;
    public const ROLE_LIBRARIAN = 2;
    public const ROLE_LECTURER = 3;
    public const ROLE_STUDENT = 4;

    // Trạng thái tài khoản người dùng
    public const USER_STATUS_ACTIVE = 1;
    public const USER_STATUS_LOCKED = 2;

    // Trạng thái tài sản vật lý & phòng học (Hiển thị màu Xanh / Đỏ / Xám)
    public const ASSET_STATUS_AVAILABLE = 'AVAILABLE';
    public const ASSET_STATUS_BORROWED = 'BORROWED';
    public const ASSET_STATUS_MAINTENANCE = 'MAINTENANCE';

    // Trạng thái phiếu mượn tài sản
    public const LOAN_STATUS_PENDING_PICKUP = 'PENDING_PICKUP';
    public const LOAN_STATUS_BORROWED = 'BORROWED';
    public const LOAN_STATUS_RETURNED = 'RETURNED';
    public const LOAN_STATUS_OVERDUE = 'OVERDUE';
    public const LOAN_STATUS_CANCELLED = 'CANCELLED';

    // Trạng thái lịch đặt phòng
    public const BOOKING_STATUS_CONFIRMED = 'CONFIRMED';
    public const BOOKING_STATUS_CANCELLED = 'CANCELLED';
    public const BOOKING_STATUS_COMPLETED = 'COMPLETED';

    // Trạng thái tài liệu số
    public const DOCUMENT_STATUS_ACTIVE = 'ACTIVE';
    public const DOCUMENT_STATUS_ARCHIVED = 'ARCHIVED';

    // Các ngưỡng nghiệp vụ mượn trả & phí phạt (F-03, F-05, F-06)
    public const MAX_BORROW_DAYS = 7;
    public const MAX_ALLOWED_ACTIVE_LOANS = 3;
    public const DEFAULT_LATE_FEE_PER_DAY = 10000.0;
    public const EQUIPMENT_LATE_FEE_PER_DAY = 25000.0;
    public const DEBT_LOCK_THRESHOLD = 100000.0;

    // Các mốc ngày gửi thông báo nhắc trả tự động (F-05)
    public const REMINDER_DAYS_FIRST = 3;
    public const REMINDER_DAYS_FINAL = 1;

    // Các ngưỡng nghiệp vụ đọc trực tuyến & đặt phòng học (F-02, F-07, F-08)
    public const MAX_PRINT_PAGES_DEFAULT = 15;
    public const MIN_CANCEL_HOURS_BEFORE = 2;
    public const DEFAULT_ROOM_HOURLY_RATE = 20000.0;
    public const SECONDS_PER_HOUR = 3600;
    public const SECONDS_PER_DAY = 86400;

    // Khung phân loại thập phân Dewey tự động (F-01)
    public const DEWEY_CATEGORIES = [
        'CNTT & Khoa học Máy tính' => '004.6',
        'Lập trình & Kỹ thuật Phần mềm' => '005.1',
        'Trí tuệ Nhân tạo & Dữ liệu' => '006.3',
        'Toán học & Thống kê' => '510.1',
        'Kỹ thuật Điện - Điện tử' => '621.3',
        'Kinh tế & Quản trị Dự án' => '658.4',
        'Ngôn ngữ & Học thuật' => '400.1',
    ];
}

