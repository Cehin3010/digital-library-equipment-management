-- ============================================================================
-- HỆ THỐNG THƯ VIỆN SỐ & CHO MƯỢN TÀI SẢN ĐẠI HỌC
-- Database Schema (Chuẩn snake_case số nhiều, khóa ngoại ON DELETE RESTRICT)
-- Nhóm 3: Làng Xi Mi (TDTU)
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Bảng vai trò người dùng (roles)
CREATE TABLE IF NOT EXISTS roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_code VARCHAR(30) NOT NULL UNIQUE,
    role_name VARCHAR(100) NOT NULL,
    description VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng người dùng (users)
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    university_id VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    department VARCHAR(120) DEFAULT 'Khoa Công nghệ Thông tin',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '1: ACTIVE, 2: LOCKED',
    total_debt DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_roles FOREIGN KEY (role_id)
        REFERENCES roles (role_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng danh mục tài liệu số (digital_documents - Phân hệ 1: F-01, F-02)
CREATE TABLE IF NOT EXISTS digital_documents (
    document_id INT AUTO_INCREMENT PRIMARY KEY,
    isbn VARCHAR(30) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(180) NOT NULL,
    category VARCHAR(100) NOT NULL,
    dewey_code VARCHAR(20) NOT NULL,
    publish_year INT NOT NULL,
    file_format VARCHAR(15) NOT NULL DEFAULT 'PDF',
    file_url VARCHAR(500) NOT NULL,
    total_pages INT NOT NULL DEFAULT 100,
    max_print_pages INT NOT NULL DEFAULT 15,
    view_count INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_documents_search (title, author, category, dewey_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng lịch sử & tiến độ đọc trực tuyến (reading_histories - Phân hệ 1: F-02)
CREATE TABLE IF NOT EXISTS reading_histories (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    document_id INT NOT NULL,
    current_page INT NOT NULL DEFAULT 1,
    progress_percent DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    printed_pages INT NOT NULL DEFAULT 0,
    reading_seconds INT NOT NULL DEFAULT 0,
    last_read_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_document (user_id, document_id),
    CONSTRAINT fk_reading_users FOREIGN KEY (user_id)
        REFERENCES users (user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_reading_documents FOREIGN KEY (document_id)
        REFERENCES digital_documents (document_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Bảng tài sản vật lý: thiết bị, dụng cụ, sách in (physical_assets - Phân hệ 2: F-03, F-04)
CREATE TABLE IF NOT EXISTS physical_assets (
    asset_id INT AUTO_INCREMENT PRIMARY KEY,
    asset_code VARCHAR(30) NOT NULL UNIQUE,
    asset_name VARCHAR(200) NOT NULL,
    asset_type VARCHAR(50) NOT NULL COMMENT 'EQUIPMENT, LAB_KIT, PRINTED_BOOK',
    department VARCHAR(120) NOT NULL,
    location VARCHAR(120) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' COMMENT 'AVAILABLE, BORROWED, MAINTENANCE',
    condition_note VARCHAR(255) NOT NULL DEFAULT 'Tốt (100%)',
    daily_late_fee DECIMAL(12, 2) NOT NULL DEFAULT 10000.00,
    hourly_rental_fee DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_assets_status (status, asset_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Bảng giao dịch mượn trả tài sản (borrow_transactions - Phân hệ 2 & 3: F-03..F-06)
CREATE TABLE IF NOT EXISTS borrow_transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_code VARCHAR(40) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    asset_id INT NOT NULL,
    qr_code_token VARCHAR(100) NOT NULL UNIQUE,
    borrow_date DATETIME NOT NULL,
    due_date DATETIME NOT NULL,
    received_at DATETIME DEFAULT NULL,
    returned_at DATETIME DEFAULT NULL,
    status VARCHAR(25) NOT NULL DEFAULT 'PENDING_PICKUP'
        COMMENT 'PENDING_PICKUP, BORROWED, RETURNED, OVERDUE, CANCELLED',
    return_condition VARCHAR(255) DEFAULT NULL,
    fine_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_borrow_users FOREIGN KEY (user_id)
        REFERENCES users (user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_borrow_assets FOREIGN KEY (asset_id)
        REFERENCES physical_assets (asset_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Bảng hóa đơn phí phạt trễ hạn (fine_invoices - Phân hệ 3: F-06)
CREATE TABLE IF NOT EXISTS fine_invoices (
    fine_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL UNIQUE,
    user_id INT NOT NULL,
    days_late INT NOT NULL,
    daily_rate DECIMAL(12, 2) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    is_paid TINYINT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fines_transactions FOREIGN KEY (transaction_id)
        REFERENCES borrow_transactions (transaction_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_fines_users FOREIGN KEY (user_id)
        REFERENCES users (user_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Bảng phòng học & không gian thảo luận (study_rooms - Phân hệ 4: F-07, F-08)
CREATE TABLE IF NOT EXISTS study_rooms (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    room_code VARCHAR(30) NOT NULL UNIQUE,
    room_name VARCHAR(150) NOT NULL,
    capacity INT NOT NULL,
    building VARCHAR(100) NOT NULL,
    equipment_list VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' COMMENT 'AVAILABLE, BORROWED, MAINTENANCE',
    hourly_rate DECIMAL(12, 2) NOT NULL DEFAULT 20000.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Bảng đặt phòng học theo khung giờ (room_bookings - Phân hệ 4: F-07, F-08)
CREATE TABLE IF NOT EXISTS room_bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_code VARCHAR(40) NOT NULL UNIQUE,
    room_id INT NOT NULL,
    user_id INT NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    attendees_count INT NOT NULL,
    purpose VARCHAR(255) NOT NULL,
    total_cost DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED' COMMENT 'CONFIRMED, CANCELLED, COMPLETED',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_bookings_rooms FOREIGN KEY (room_id)
        REFERENCES study_rooms (room_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_bookings_users FOREIGN KEY (user_id)
        REFERENCES users (user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_room_schedule (room_id, booking_date, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Bảng thông báo nhắc hạn & cảnh báo (notifications - Phân hệ 3: F-05)
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(30) NOT NULL DEFAULT 'REMINDER',
    is_read TINYINT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_users FOREIGN KEY (user_id)
        REFERENCES users (user_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Bảng nhật ký kiểm toán (audit_logs - Phân hệ 6: F-12)
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action_code VARCHAR(60) NOT NULL,
    target_entity VARCHAR(60) NOT NULL,
    target_id VARCHAR(60) NOT NULL,
    details TEXT DEFAULT NULL,
    ip_address VARCHAR(45) NOT NULL DEFAULT '127.0.0.1',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_users FOREIGN KEY (user_id)
        REFERENCES users (user_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- DỮ LIỆU KHỞI TẠO MẪU (SEED DATA)
-- ============================================================================

INSERT INTO roles (role_id, role_code, role_name, description) VALUES
(1, 'ADMIN', 'Quản trị viên (Admin / Manager)', 'Cài đặt hệ thống, xem Dashboard báo cáo và giám sát Audit Log'),
(2, 'LIBRARIAN', 'Cán bộ Thư viện (Librarian)', 'Quản lý kho tài liệu, quét QR mượn/trả tài sản và ghi nhận hư hỏng'),
(3, 'LECTURER', 'Giảng viên (Lecturer)', 'Đọc/đề xuất học liệu, mượn thiết bị và đặt phòng học miễn phí'),
(4, 'STUDENT', 'Sinh viên (Student)', 'Tra cứu/đọc tài liệu số, đặt mượn thiết bị và phòng học nhóm');

INSERT INTO users (user_id, university_id, full_name, email, password_hash, role_id, department, status, total_debt) VALUES
(1, '52400175', 'Lý Hạo Danh', '52400175@student.tdtu.edu.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 'Khoa Công nghệ Thông tin', 1, 0.00),
(2, '52400051', 'Nguyễn Anh Khoa', '52400051@student.tdtu.edu.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 2, 'Phòng Thư viện Trung tâm', 1, 0.00),
(3, '52400103', 'Trần Minh Chiến', '52400103@lecturer.tdtu.edu.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 3, 'Khoa Công nghệ Thông tin', 1, 0.00),
(4, '51900821', 'Hồ Thịnh Phát', '51900821@student.tdtu.edu.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 4, 'Khoa Công nghệ Thông tin', 1, 15000.00);

