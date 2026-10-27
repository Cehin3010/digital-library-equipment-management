<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Config\AppConstants;
use PDO;

/**
 * Quản lý truy xuất dữ liệu Người dùng, Công nợ và Khóa quyền mượn (Phân hệ 3 & 6: F-06, F-11).
 */
class UserRepository
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * Tìm người dùng theo ID.
     *
     * @param int $userId ID người dùng
     * @return array<string, mixed>|null
     */
    public function findUserById(int $userId): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE user_id = :user_id');
        $stmt->execute(['user_id' => $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ?: null;
    }

    /**
     * Tìm người dùng theo mã số sinh viên/giảng viên hoặc địa chỉ email trường (F-11).
     *
     * @param string $identifier Mã số trường hoặc Email
     * @return array<string, mixed>|null
     */
    public function findUserByIdentifier(string $identifier): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM users WHERE university_id = :id OR email = :email LIMIT 1'
        );
        $cleanId = trim($identifier);
        $stmt->execute([
            'id' => $cleanId,
            'email' => $cleanId,
        ]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ?: null;
    }

    /**
     * Cộng dồn công nợ phạt vào hồ sơ người dùng và cập nhật trạng thái khóa nếu vượt ngưỡng (F-06).
     *
     * @param int $userId ID người dùng
     * @param float $newTotalDebt Tổng dư nợ mới
     * @param int $newStatus Trạng thái tài khoản mới (USER_STATUS_ACTIVE hoặc USER_STATUS_LOCKED)
     * @return void
     */
    public function updateUserDebtAndStatus(int $userId, float $newTotalDebt, int $newStatus): void
    {
        $stmt = $this->db->prepare(
            'UPDATE users SET total_debt = :total_debt, status = :status WHERE user_id = :user_id'
        );
        $stmt->execute([
            'total_debt' => $newTotalDebt,
            'status' => $newStatus,
            'user_id' => $userId,
        ]);
    }

    /**
     * Lưu thông báo nhắc hạn trả hoặc thông báo phạt cho người dùng (F-05, F-06).
     *
     * @param int $userId ID người nhận
     * @param string $title Tiêu đề thông báo
     * @param string $message Nội dung chi tiết
     * @param string $notificationType Loại thông báo (REMINDER, FINE, BOOKING)
     * @return int ID thông báo vừa lưu
     */
    public function createNotification(
        int $userId,
        string $title,
        string $message,
        string $notificationType = 'REMINDER'
    ): int {
        $stmt = $this->db->prepare(
            'INSERT INTO notifications (user_id, title, message, notification_type, is_read)
             VALUES (:user_id, :title, :message, :notification_type, 0)'
        );
        $stmt->execute([
            'user_id' => $userId,
            'title' => $title,
            'message' => $message,
            'notification_type' => $notificationType,
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Lấy danh sách thông báo ưu tiên hiển thị trên trang chủ tài khoản (F-05).
     *
     * @param int $userId ID người dùng
     * @return array<int, array<string, mixed>>
     */
    public function findNotificationsByUser(int $userId): array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM notifications WHERE user_id = :user_id ORDER BY created_at DESC LIMIT 20'
        );
        $stmt->execute(['user_id' => $userId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [...$rows];
    }
}

