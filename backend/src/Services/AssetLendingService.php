<?php

declare(strict_types=1);

namespace App\Services;

use App\Config\AppConstants;
use App\Repositories\AssetLendingRepository;
use App\Repositories\AuditAndStatsRepository;
use App\Repositories\UserRepository;
use InvalidArgumentException;
use RuntimeException;

/**
 * Dịch vụ Đăng ký Mượn, Quét QR Nhận/Trả Tài sản Vật lý & Nhắc hạn Tự động (Phân hệ 2 & 3: F-03..F-06).
 */
class AssetLendingService
{
    private AssetLendingRepository $lendingRepository;
    private UserRepository $userRepository;
    private AuditAndStatsRepository $auditRepository;
    private FineCalculationService $fineService;

    public function __construct(
        AssetLendingRepository $lendingRepository,
        UserRepository $userRepository,
        AuditAndStatsRepository $auditRepository,
        FineCalculationService $fineService
    ) {
        $this->lendingRepository = $lendingRepository;
        $this->userRepository = $userRepository;
        $this->auditRepository = $auditRepository;
        $this->fineService = $fineService;
    }

    /**
     * Đăng ký đặt mượn thiết bị hoặc sách in trực tuyến, sinh phiếu mượn kèm mã QR (F-03).
     * Kiểm tra chặt chẽ: trạng thái tài khoản không bị khóa công nợ và tài sản đang AVAILABLE.
     *
     * @param int $userId ID sinh viên hoặc giảng viên
     * @param int $assetId ID tài sản vật lý cần mượn
     * @param int $borrowDays Số ngày đăng ký mượn (tối đa MAX_BORROW_DAYS)
     * @return array<string, mixed> Thông tin phiếu mượn điện tử và mã QR
     */
    public function requestAssetBorrow(int $userId, int $assetId, int $borrowDays = AppConstants::MAX_BORROW_DAYS): array
    {
        if ($borrowDays <= 0 || $borrowDays > AppConstants::MAX_BORROW_DAYS) {
            throw new InvalidArgumentException(sprintf(
                'Thời gian mượn phải từ 1 đến tối đa %d ngày.',
                AppConstants::MAX_BORROW_DAYS
            ));
        }

        $user = $this->userRepository->findUserById($userId);
        if ($user === null) {
            throw new RuntimeException('Không tìm thấy hồ sơ người dùng.');
        }

        if (
            (int) $user['status'] === AppConstants::USER_STATUS_LOCKED
            || $this->fineService->shouldLockBorrowPrivilege((float) $user['total_debt'])
        ) {
            throw new RuntimeException(
                'Tài khoản của bạn đang bị khóa quyền mượn do công nợ vượt ngưỡng quy định. Vui lòng thanh toán trước.'
            );
        }

        $asset = $this->lendingRepository->findAssetById($assetId);
        if ($asset === null) {
            throw new RuntimeException('Tài sản không tồn tại trong hệ thống.');
        }

        if ($asset['status'] !== AppConstants::ASSET_STATUS_AVAILABLE) {
            throw new RuntimeException(sprintf(
                'Tài sản "%s" hiện không còn trống (Trạng thái: %s).',
                $asset['asset_name'],
                $asset['status']
            ));
        }

        $now = date('Y-m-d H:i:s');
        $dueDate = date('Y-m-d H:i:s', strtotime(sprintf('+%d days', $borrowDays)));
        $transactionCode = sprintf('LOAN-%s-%d-%d', date('Ymd'), $userId, $assetId);
        $qrCodeToken = sprintf('QR-TDTU-%s-%s', $asset['asset_code'], strtoupper(substr(md5($transactionCode . microtime()), 0, 8)));

        $transactionId = $this->lendingRepository->createBorrowTransaction([
            'transaction_code' => $transactionCode,
            'user_id' => $userId,
            'asset_id' => $assetId,
            'qr_code_token' => $qrCodeToken,
            'borrow_date' => $now,
            'due_date' => $dueDate,
            'status' => AppConstants::LOAN_STATUS_PENDING_PICKUP,
        ]);

        // Đặt giữ chỗ tài sản ngay khi tạo phiếu để tránh 2 người dùng đặt trùng (NFR #1)
        $this->lendingRepository->updateAssetStatus($assetId, AppConstants::ASSET_STATUS_BORROWED);

        $this->userRepository->createNotification(
            $userId,
            'Xác nhận Đặt mượn Tài sản Thành công',
            sprintf(
                'Phiếu mượn %s cho thiết bị "%s" đã được tạo. Vui lòng xuất trình mã QR [%s] tại quầy thư viện.',
                $transactionCode,
                $asset['asset_name'],
                $qrCodeToken
            ),
            'BORROW_CONFIRMATION'
        );

        $this->auditRepository->insertAuditLog(
            $userId,
            'BORROW_REQUEST_CREATED',
            'borrow_transactions',
            (string) $transactionId,
            sprintf('Đặt mượn tài sản %s (%s), mã QR: %s', $asset['asset_code'], $asset['asset_name'], $qrCodeToken)
        );

        return [
            'transaction_id' => $transactionId,
            'transaction_code' => $transactionCode,
            'asset_code' => $asset['asset_code'],
            'asset_name' => $asset['asset_name'],
            'qr_code_token' => $qrCodeToken,
            'borrow_date' => $now,
            'due_date' => $dueDate,
            'status' => AppConstants::LOAN_STATUS_PENDING_PICKUP,
        ];
    }

    /**
     * Xử lý quét mã QR tại quầy thư viện để xác nhận Bàn giao hoặc Nhận trả tài sản (F-04, F-06).
     *
     * @param int $librarianId ID cán bộ thư viện thực hiện quét mã
     * @param string $qrCodeToken Mã QR trên phiếu mượn
     * @param string $returnCondition Tình trạng vật lý của thiết bị khi trả
     * @param string|null $simulatedReturnDate Ngày trả giả lập (phục vụ kiểm thử động kịch bản trễ hạn F-06)
     * @return array<string, mixed> Kết quả cập nhật trạng thái phiếu mượn và phí phạt (nếu có)
     */
    public function processQrCodeScanAtCounter(
        int $librarianId,
        string $qrCodeToken,
        string $returnCondition = 'Tốt - Nguyên vẹn (100%)',
        ?string $simulatedReturnDate = null
    ): array {
        $transaction = $this->lendingRepository->findTransactionByQrToken($qrCodeToken);
        if ($transaction === null) {
            throw new RuntimeException('Mã QR không hợp lệ hoặc không khớp với bất kỳ phiếu mượn nào.');
        }

        $transactionId = (int) $transaction['transaction_id'];
        $assetId = (int) $transaction['asset_id'];
        $borrowerId = (int) $transaction['user_id'];
        $currentStatus = (string) $transaction['status'];
        $timestamp = $simulatedReturnDate ?: date('Y-m-d H:i:s');

        // Trường hợp 1: Phiếu đang chờ nhận tại quầy -> Chuyển sang ĐANG MƯỢN (BORROWED)
        if ($currentStatus === AppConstants::LOAN_STATUS_PENDING_PICKUP) {
            $this->lendingRepository->markAsHandedOver($transactionId, $timestamp);
            $this->lendingRepository->updateAssetStatus($assetId, AppConstants::ASSET_STATUS_BORROWED);

            $this->auditRepository->insertAuditLog(
                $librarianId,
                'QR_SCAN_HANDOVER',
                'borrow_transactions',
                (string) $transactionId,
                sprintf('Cán bộ quét QR [%s] bàn giao thiết bị %s cho user #%d', $qrCodeToken, $transaction['asset_code'], $borrowerId)
            );

            return [
                'action' => 'HANDOVER_COMPLETED',
                'transaction_id' => $transactionId,
                'transaction_code' => $transaction['transaction_code'],
                'asset_status' => AppConstants::ASSET_STATUS_BORROWED,
                'loan_status' => AppConstants::LOAN_STATUS_BORROWED,
                'received_at' => $timestamp,
                'due_date' => $transaction['due_date'],
                'fine_amount' => 0.0,
            ];
        }

        // Trường hợp 2: Phiếu đang mượn -> Quét QR nhận trả tài sản & tự động tính phí phạt nếu trễ hạn
        if ($currentStatus === AppConstants::LOAN_STATUS_BORROWED || $currentStatus === AppConstants::LOAN_STATUS_OVERDUE) {
            $daysLate = $this->fineService->calculateDaysLate((string) $transaction['due_date'], $timestamp);
            $dailyRate = (float) ($transaction['daily_late_fee'] ?? AppConstants::DEFAULT_LATE_FEE_PER_DAY);
            $fineAmount = $this->fineService->calculateLateFee($daysLate, $dailyRate);

            $this->lendingRepository->markAsReturned($transactionId, $timestamp, $returnCondition, $fineAmount);

            // Nếu thiết bị hư hỏng cần bảo trì thì chuyển sang MAINTENANCE (Màu xám), ngược lại AVAILABLE (Màu xanh)
            $isDamaged = stripos($returnCondition, 'hỏng') !== false || stripos($returnCondition, 'bảo trì') !== false;
            $nextAssetStatus = $isDamaged
                ? AppConstants::ASSET_STATUS_MAINTENANCE
                : AppConstants::ASSET_STATUS_AVAILABLE;

            $this->lendingRepository->updateAssetStatus($assetId, $nextAssetStatus, $returnCondition);

            $accountLocked = false;
            $newTotalDebt = 0.0;

            if ($fineAmount > 0) {
                $this->lendingRepository->createFineInvoice(
                    $transactionId,
                    $borrowerId,
                    $daysLate,
                    $dailyRate,
                    $fineAmount
                );

                $user = $this->userRepository->findUserById($borrowerId);
                $currentDebt = $user !== null ? (float) $user['total_debt'] : 0.0;
                $newTotalDebt = $currentDebt + $fineAmount;
                $accountLocked = $this->fineService->shouldLockBorrowPrivilege($newTotalDebt);
                $nextUserStatus = $accountLocked
                    ? AppConstants::USER_STATUS_LOCKED
                    : AppConstants::USER_STATUS_ACTIVE;

                $this->userRepository->updateUserDebtAndStatus($borrowerId, $newTotalDebt, $nextUserStatus);
                $this->fineService->notifyUserOfFine($borrowerId, $fineAmount, $daysLate, $accountLocked);
            }

            $this->auditRepository->insertAuditLog(
                $librarianId,
                'QR_SCAN_RETURN',
                'borrow_transactions',
                (string) $transactionId,
                sprintf(
                    'Quét QR [%s] nhận trả tài sản %s. Trễ: %d ngày, Phạt: %.0f VND, Tình trạng: %s',
                    $qrCodeToken,
                    $transaction['asset_code'],
                    $daysLate,
                    $fineAmount,
                    $returnCondition
                )
            );

            return [
                'action' => 'RETURN_COMPLETED',
                'transaction_id' => $transactionId,
                'transaction_code' => $transaction['transaction_code'],
                'asset_status' => $nextAssetStatus,
                'loan_status' => AppConstants::LOAN_STATUS_RETURNED,
                'returned_at' => $timestamp,
                'days_late' => $daysLate,
                'fine_amount' => $fineAmount,
                'new_total_debt' => $newTotalDebt,
                'is_account_locked' => $accountLocked,
            ];
        }

        throw new RuntimeException('Phiếu mượn này đã được đóng hoặc đã hủy trước đó.');
    }

    /**
     * Động cơ quét và gửi thông báo nhắc hạn tự động khi còn 3 ngày hoặc 1 ngày (F-05).
     *
     * @param string|null $referenceDate Ngày tham chiếu (mặc định là ngày hiện tại)
     * @return array<int, array<string, mixed>> Danh sách các thông báo nhắc hạn đã gửi
     */
    public function dispatchDueSoonReminders(?string $referenceDate = null): array
    {
        $nowTimestamp = strtotime($referenceDate ?: date('Y-m-d H:i:s'));
        $activeLoans = $this->lendingRepository->findActiveLoansForReminder();
        $dispatchedReminders = [];

        foreach ($activeLoans as $loan) {
            $dueTimestamp = strtotime((string) $loan['due_date']);
            if ($dueTimestamp === false) {
                continue;
            }

            $remainingDays = (int) ceil(($dueTimestamp - $nowTimestamp) / AppConstants::SECONDS_PER_DAY);

            if (
                $remainingDays === AppConstants::REMINDER_DAYS_FIRST
                || $remainingDays === AppConstants::REMINDER_DAYS_FINAL
            ) {
                $userId = (int) $loan['user_id'];
                $title = sprintf('Nhắc hạn trả tài sản (Còn %d ngày)', $remainingDays);
                $message = sprintf(
                    'Tài sản "%s" (Mã phiếu: %s) sẽ đến hạn trả vào %s (còn %d ngày). Vui lòng hoàn trả đúng hạn để tránh phí phạt.',
                    $loan['asset_name'],
                    $loan['transaction_code'],
                    $loan['due_date'],
                    $remainingDays
                );

                $notificationId = $this->userRepository->createNotification($userId, $title, $message, 'REMINDER');
                $dispatchedReminders[] = [
                    'notification_id' => $notificationId,
                    'user_id' => $userId,
                    'email' => $loan['email'],
                    'asset_name' => $loan['asset_name'],
                    'remaining_days' => $remainingDays,
                    'due_date' => $loan['due_date'],
                ];
            }
        }

        return [...$dispatchedReminders];
    }

    /**
     * Xóa tài sản vật lý có kiểm tra ràng buộc toàn vẹn dữ liệu (NFR #3).
     *
     * @param int $adminUserId ID quản trị viên thực hiện
     * @param int $assetId ID tài sản cần xóa
     * @return void
     */
    public function deletePhysicalAssetSafely(int $adminUserId, int $assetId): void
    {
        if ($this->lendingRepository->hasActiveLoanOrUnpaidFine($assetId)) {
            throw new RuntimeException(
                'Không thể xóa hồ sơ tài sản khi đang còn phiếu mượn hoạt động hoặc công nợ phí phạt chưa thanh toán.'
            );
        }

        $this->lendingRepository->deleteAssetById($assetId);
        $this->auditRepository->insertAuditLog(
            $adminUserId,
            'DELETE_PHYSICAL_ASSET',
            'physical_assets',
            (string) $assetId,
            sprintf('Đã xóa hồ sơ tài sản vật lý #%d sau khi kiểm tra không còn ràng buộc mượn/nợ', $assetId)
        );
    }
}

