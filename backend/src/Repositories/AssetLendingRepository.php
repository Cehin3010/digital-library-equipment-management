<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Config\AppConstants;
use PDO;

/**
 * Quản lý truy xuất dữ liệu Tài sản Vật lý & Giao dịch Mượn Trả (Phân hệ 2 & 3: F-03..F-06).
 */
class AssetLendingRepository
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * Lấy danh sách toàn bộ tài sản vật lý kèm bộ lọc trạng thái hoặc loại thiết bị.
     *
     * @param string $status Trạng thái (AVAILABLE, BORROWED, MAINTENANCE)
     * @param string $assetType Loại tài sản (EQUIPMENT, LAB_KIT, PRINTED_BOOK)
     * @return array<int, array<string, mixed>>
     */
    public function findAllAssets(string $status = '', string $assetType = ''): array
    {
        $sql = 'SELECT * FROM physical_assets WHERE 1=1';
        $params = [];

        if ($status !== '') {
            $sql .= ' AND status = :status';
            $params['status'] = $status;
        }

        if ($assetType !== '') {
            $sql .= ' AND asset_type = :asset_type';
            $params['asset_type'] = $assetType;
        }

        $sql .= ' ORDER BY asset_id ASC';
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [...$rows];
    }

    /**
     * Tìm thông tin tài sản vật lý theo ID.
     *
     * @param int $assetId ID tài sản
     * @return array<string, mixed>|null
     */
    public function findAssetById(int $assetId): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM physical_assets WHERE asset_id = :asset_id');
        $stmt->execute(['asset_id' => $assetId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ?: null;
    }

    /**
     * Kiểm tra tài sản có đang vướng phiếu mượn hoạt động hoặc công nợ chưa thanh toán hay không.
     * Đảm bảo Yêu cầu Phi chức năng số 3 (Toàn vẹn dữ liệu: Không cho phép xóa tài sản đang mượn/nợ).
     *
     * @param int $assetId ID tài sản cần kiểm tra
     * @return bool True nếu tài sản đang có ràng buộc không thể xóa
     */
    public function hasActiveLoanOrUnpaidFine(int $assetId): bool
    {
        $stmt = $this->db->prepare(
            'SELECT COUNT(*) FROM borrow_transactions bt
             LEFT JOIN fine_invoices fi ON bt.transaction_id = fi.transaction_id
             WHERE bt.asset_id = :asset_id
               AND (bt.status IN (:pending, :borrowed, :overdue) OR (fi.fine_id IS NOT NULL AND fi.is_paid = 0))'
        );
        $stmt->execute([
            'asset_id' => $assetId,
            'pending' => AppConstants::LOAN_STATUS_PENDING_PICKUP,
            'borrowed' => AppConstants::LOAN_STATUS_BORROWED,
            'overdue' => AppConstants::LOAN_STATUS_OVERDUE,
        ]);

        return ((int) $stmt->fetchColumn()) > 0;
    }

    /**
     * Xóa hồ sơ tài sản vật lý nếu không còn ràng buộc giao dịch hoạt động.
     *
     * @param int $assetId ID tài sản
     * @return bool
     */
    public function deleteAssetById(int $assetId): bool
    {
        $stmt = $this->db->prepare('DELETE FROM physical_assets WHERE asset_id = :asset_id');
        return $stmt->execute(['asset_id' => $assetId]);
    }

    /**
     * Cập nhật trạng thái và ghi chú tình trạng của tài sản vật lý (F-03, F-04).
     *
     * @param int $assetId ID tài sản
     * @param string $status Trạng thái mới
     * @param string|null $conditionNote Ghi chú tình trạng vật lý
     * @return void
     */
    public function updateAssetStatus(int $assetId, string $status, ?string $conditionNote = null): void
    {
        if ($conditionNote !== null) {
            $stmt = $this->db->prepare(
                'UPDATE physical_assets SET status = :status, condition_note = :note WHERE asset_id = :id'
            );
            $stmt->execute([
                'status' => $status,
                'note' => $conditionNote,
                'id' => $assetId,
            ]);
            return;
        }

        $stmt = $this->db->prepare('UPDATE physical_assets SET status = :status WHERE asset_id = :id');
        $stmt->execute([
            'status' => $status,
            'id' => $assetId,
        ]);
    }

    /**
     * Tạo phiếu đăng ký mượn tài sản điện tử kèm mã QR (F-03).
     *
     * @param array<string, mixed> $loanData Dữ liệu phiếu mượn
     * @return int ID giao dịch mượn vừa tạo
     */
    public function createBorrowTransaction(array $loanData): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO borrow_transactions
                (transaction_code, user_id, asset_id, qr_code_token, borrow_date, due_date, status)
             VALUES
                (:transaction_code, :user_id, :asset_id, :qr_code_token, :borrow_date, :due_date, :status)'
        );
        $stmt->execute([
            'transaction_code' => $loanData['transaction_code'],
            'user_id' => (int) $loanData['user_id'],
            'asset_id' => (int) $loanData['asset_id'],
            'qr_code_token' => $loanData['qr_code_token'],
            'borrow_date' => $loanData['borrow_date'],
            'due_date' => $loanData['due_date'],
            'status' => $loanData['status'] ?? AppConstants::LOAN_STATUS_PENDING_PICKUP,
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Tìm phiếu mượn theo mã QR được quét tại quầy thư viện (F-04).
     *
     * @param string $qrCodeToken Chuỗi mã QR trên phiếu mượn
     * @return array<string, mixed>|null
     */
    public function findTransactionByQrToken(string $qrCodeToken): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT bt.*, pa.asset_name, pa.asset_code, pa.daily_late_fee, u.full_name, u.email
             FROM borrow_transactions bt
             INNER JOIN physical_assets pa ON bt.asset_id = pa.asset_id
             INNER JOIN users u ON bt.user_id = u.user_id
             WHERE bt.qr_code_token = :qr_token'
        );
        $stmt->execute(['qr_token' => trim($qrCodeToken)]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ?: null;
    }

    /**
     * Cập nhật phiếu mượn khi Cán bộ Thư viện quét QR bàn giao thiết bị (F-04).
     *
     * @param int $transactionId ID giao dịch
     * @param string $receivedAt Thời điểm nhận thiết bị
     * @return void
     */
    public function markAsHandedOver(int $transactionId, string $receivedAt): void
    {
        $stmt = $this->db->prepare(
            'UPDATE borrow_transactions
             SET status = :status, received_at = :received_at
             WHERE transaction_id = :id'
        );
        $stmt->execute([
            'status' => AppConstants::LOAN_STATUS_BORROWED,
            'received_at' => $receivedAt,
            'id' => $transactionId,
        ]);
    }

    /**
     * Cập nhật phiếu mượn khi người dùng mang trả tài sản tại quầy (F-04, F-06).
     *
     * @param int $transactionId ID giao dịch
     * @param string $returnedAt Thời điểm trả thực tế
     * @param string $returnCondition Tình trạng tài sản khi nhận lại
     * @param float $fineAmount Số tiền phạt trễ hạn (nếu có)
     * @return void
     */
    public function markAsReturned(
        int $transactionId,
        string $returnedAt,
        string $returnCondition,
        float $fineAmount
    ): void {
        $stmt = $this->db->prepare(
            'UPDATE borrow_transactions
             SET status = :status,
                 returned_at = :returned_at,
                 return_condition = :return_condition,
                 fine_amount = :fine_amount
             WHERE transaction_id = :id'
        );
        $stmt->execute([
            'status' => AppConstants::LOAN_STATUS_RETURNED,
            'returned_at' => $returnedAt,
            'return_condition' => $returnCondition,
            'fine_amount' => $fineAmount,
            'id' => $transactionId,
        ]);
    }

    /**
     * Ghi nhận hóa đơn phạt trễ hạn vào bảng fine_invoices (F-06).
     *
     * @param int $transactionId ID giao dịch mượn
     * @param int $userId ID người mượn
     * @param int $daysLate Số ngày trả trễ
     * @param float $dailyRate Đơn giá phạt mỗi ngày
     * @param float $amount Tổng tiền phạt
     * @return int ID hóa đơn phạt
     */
    public function createFineInvoice(
        int $transactionId,
        int $userId,
        int $daysLate,
        float $dailyRate,
        float $amount
    ): int {
        $stmt = $this->db->prepare(
            'INSERT INTO fine_invoices (transaction_id, user_id, days_late, daily_rate, amount, is_paid)
             VALUES (:transaction_id, :user_id, :days_late, :daily_rate, :amount, 0)'
        );
        $stmt->execute([
            'transaction_id' => $transactionId,
            'user_id' => $userId,
            'days_late' => $daysLate,
            'daily_rate' => $dailyRate,
            'amount' => $amount,
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Lấy danh sách các phiếu đang mượn để quét nhắc hạn tự động (F-05).
     *
     * @return array<int, array<string, mixed>>
     */
    public function findActiveLoansForReminder(): array
    {
        $stmt = $this->db->prepare(
            'SELECT bt.*, pa.asset_name, pa.asset_code, u.full_name, u.email
             FROM borrow_transactions bt
             INNER JOIN physical_assets pa ON bt.asset_id = pa.asset_id
             INNER JOIN users u ON bt.user_id = u.user_id
             WHERE bt.status = :status'
        );
        $stmt->execute(['status' => AppConstants::LOAN_STATUS_BORROWED]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [...$rows];
    }
}

