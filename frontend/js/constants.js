/**
 * Quản lý tập trung toàn bộ hằng số nghiệp vụ trên Frontend.
 * Tuân thủ nghiêm ngặt nguyên lý "No Magic Numbers" và quy tắc UPPER_SNAKE_CASE.
 */

export const STATUS_ACTIVE = 1;
export const STATUS_LOCKED = 2;

export const ROLE_ADMIN = 1;
export const ROLE_LIBRARIAN = 2;
export const ROLE_LECTURER = 3;
export const ROLE_STUDENT = 4;

export const ROLE_LABELS = {
  [ROLE_ADMIN]: 'Quản trị viên (Admin / Manager)',
  [ROLE_LIBRARIAN]: 'Cán bộ Thư viện (Librarian)',
  [ROLE_LECTURER]: 'Giảng viên (Lecturer)',
  [ROLE_STUDENT]: 'Sinh viên (Student)',
};

export const ASSET_STATUS_AVAILABLE = 'AVAILABLE';
export const ASSET_STATUS_BORROWED = 'BORROWED';
export const ASSET_STATUS_MAINTENANCE = 'MAINTENANCE';

export const LOAN_STATUS_PENDING_PICKUP = 'PENDING_PICKUP';
export const LOAN_STATUS_BORROWED = 'BORROWED';
export const LOAN_STATUS_RETURNED = 'RETURNED';

export const BOOKING_STATUS_CONFIRMED = 'CONFIRMED';
export const BOOKING_STATUS_CANCELLED = 'CANCELLED';

export const MAX_BORROW_DAYS = 7;
export const DEFAULT_LATE_FEE = 10000;
export const EQUIPMENT_LATE_FEE = 25000;
export const DEBT_LOCK_THRESHOLD = 100000;
export const REMINDER_DAYS_FIRST = 3;
export const REMINDER_DAYS_FINAL = 1;
export const MIN_CANCEL_HOURS_BEFORE = 2;
export const DEFAULT_ROOM_HOURLY_RATE = 20000;
export const MAX_PRINT_PAGES_DEFAULT = 15;
export const MILLISECONDS_PER_DAY = 86400000;
export const MILLISECONDS_PER_HOUR = 3600000;

export const DEWEY_CLASSIFICATION_MAP = {
  'CNTT & Khoa học Máy tính': '004.6',
  'Lập trình & Kỹ thuật Phần mềm': '005.1',
  'Trí tuệ Nhân tạo & Dữ liệu': '006.3',
  'Toán học & Thống kê': '510.1',
  'Kỹ thuật Điện - Điện tử': '621.3',
  'Kinh tế & Quản trị Dự án': '658.4',
};

