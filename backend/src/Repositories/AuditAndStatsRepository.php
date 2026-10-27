<?php

declare(strict_types=1);

namespace App\Repositories;

use PDO;

/**
 * Quản lý Nhật ký Kiểm toán (Audit Trail - F-12) và Thống kê Báo cáo (Dashboard - F-09, F-10).
 */
class AuditAndStatsRepository
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * Ghi nhận một bản ghi bất biến vào Nhật ký Kiểm toán (F-12).
     * Phục vụ công tác kiểm tra nội bộ và thanh lý tài sản cuối năm.
     *
     * @param int $userId ID người thực hiện
     * @param string $actionCode Mã thao tác (LOGIN, BORROW_ASSET, RETURN_ASSET, CANCEL_BOOKING...)
     * @param string $targetEntity Tên phân hệ / bảng dữ liệu tác động
     * @param string $targetId Mã định danh đối tượng tác động
     * @param string $details Chi tiết hành động (JSON hoặc mô tả)
     * @param string $ipAddress Địa chỉ IP của client
     * @return int ID bản ghi nhật ký
     */
    public function insertAuditLog(
        int $userId,
        string $actionCode,
        string $targetEntity,
        string $targetId,
        string $details,
        string $ipAddress = '127.0.0.1'
    ): int {
        $stmt = $this->db->prepare(
            'INSERT INTO audit_logs (user_id, action_code, target_entity, target_id, details, ip_address)
             VALUES (:user_id, :action_code, :target_entity, :target_id, :details, :ip_address)'
        );
        $stmt->execute([
            'user_id' => $userId,
            'action_code' => $actionCode,
            'target_entity' => $targetEntity,
            'target_id' => $targetId,
            'details' => $details,
            'ip_address' => $ipAddress,
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Truy vấn danh sách Nhật ký Kiểm toán mới nhất cho Quản trị viên (F-12).
     *
     * @param int $limit Giới hạn số dòng trả về
     * @return array<int, array<string, mixed>>
     */
    public function findRecentAuditLogs(int $limit = 50): array
    {
        $stmt = $this->db->prepare(
            'SELECT al.*, u.full_name, u.university_id, u.role_id
             FROM audit_logs al
             INNER JOIN users u ON al.user_id = u.user_id
             ORDER BY al.created_at DESC, al.log_id DESC
             LIMIT :limit'
        );
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [...$rows];
    }

    /**
     * Thống kê tỷ lệ tài sản vật lý theo trạng thái (AVAILABLE, BORROWED, MAINTENANCE) cho Dashboard (F-09).
     *
     * @return array<string, int>
     */
    public function countAssetsByStatus(): array
    {
        $stmt = $this->db->query(
            'SELECT status, COUNT(*) AS total FROM physical_assets GROUP BY status'
        );
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $summary = [
            'AVAILABLE' => 0,
            'BORROWED' => 0,
            'MAINTENANCE' => 0,
        ];
        foreach ($rows as $row) {
            $status = (string) $row['status'];
            $summary[$status] = (int) $row['total'];
        }

        return $summary;
    }

    /**
     * Lấy danh sách Top 10 tài liệu số được đọc nhiều nhất (F-09).
     *
     * @return array<int, array<string, mixed>>
     */
    public function findTop10MostReadDocuments(): array
    {
        $stmt = $this->db->query(
            'SELECT document_id, isbn, title, author, category, dewey_code, view_count
             FROM digital_documents
             ORDER BY view_count DESC, title ASC
             LIMIT 10'
        );
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [...$rows];
    }

    /**
     * Lấy danh sách công nợ phí phạt phục vụ xuất báo cáo định kỳ Excel/PDF (F-10).
     *
     * @return array<int, array<string, mixed>>
     */
    public function findDebtReportData(): array
    {
        $stmt = $this->db->query(
            'SELECT u.user_id, u.university_id, u.full_name, u.email, u.department, u.total_debt, u.status
             FROM users u
             WHERE u.total_debt > 0
             ORDER BY u.total_debt DESC'
        );
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [...$rows];
    }
}

