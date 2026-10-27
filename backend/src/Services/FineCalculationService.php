<?php

declare(strict_types=1);

namespace App\Services;

use App\Config\AppConstants;
use App\Repositories\UserRepository;

/**
 * Dịch vụ Tính toán Phí phạt Trễ hạn & Kiểm tra Ngưỡng Khóa Tài khoản (Phân hệ 3: F-06).
 * Tuân thủ nghiêm ngặt nguyên lý Single Responsibility Principle (SRP):
 * Tách biệt hoàn toàn hàm tính toán phí phạt (calculateLateFee) với hàm gửi thông báo (notifyUserOfFine).
 */
class FineCalculationService
{
    private UserRepository $userRepository;

    public function __construct(UserRepository $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    /**
     * Tính số ngày trả trễ dựa trên ngày đáo hạn và ngày trả thực tế (F-06).
     * Chỉ thực hiện đúng một nhiệm vụ tính toán thời gian, không truy cập I/O.
     *
     * @param string $dueDate Ngày hẹn trả (ISO-8601 / YYYY-MM-DD HH:MM:SS)
     * @param string $actualReturnDate Ngày trả thực tế
     * @return int Số ngày trễ (trả về 0 nếu trả đúng hoặc trước hạn)
     */
    public function calculateDaysLate(string $dueDate, string $actualReturnDate): int
    {
        $dueTimestamp = strtotime($dueDate);
        $returnTimestamp = strtotime($actualReturnDate);

        if ($dueTimestamp === false || $returnTimestamp === false || $returnTimestamp <= $dueTimestamp) {
            return 0;
        }

        $diffSeconds = $returnTimestamp - $dueTimestamp;
        return (int) ceil($diffSeconds / AppConstants::SECONDS_PER_DAY);
    }

    /**
     * Tính toán số tiền phạt dựa trên số ngày trễ và đơn giá phạt (Chuẩn SRP - F-06).
     *
     * @param int $daysLate Số ngày trả trễ
     * @param float $dailyRate Đơn giá phạt mỗi ngày theo loại tài sản
     * @return float Tổng số tiền phạt (VND)
     */
    public function calculateLateFee(int $daysLate, float $dailyRate = AppConstants::DEFAULT_LATE_FEE_PER_DAY): float
    {
        if ($daysLate <= 0 || $dailyRate <= 0) {
            return 0.0;
        }

        return round($daysLate * $dailyRate, 2);
    }

    /**
     * Kiểm tra xem tổng công nợ có vượt ngưỡng khóa quyền mượn hay không (F-06).
     * Không sử dụng Magic Numbers: so sánh với hằng số AppConstants::DEBT_LOCK_THRESHOLD.
     *
     * @param float $totalDebt Tổng dư nợ hiện tại của người dùng
     * @return bool True nếu cần khóa quyền mượn
     */
    public function shouldLockBorrowPrivilege(float $totalDebt): bool
    {
        return $totalDebt >= AppConstants::DEBT_LOCK_THRESHOLD;
    }

    /**
     * Gửi thông báo phí phạt trễ hạn đến hồ sơ người dùng (Tách biệt khỏi hàm tính phạt theo chuẩn SRP).
     *
     * @param int $userId ID của người mượn
     * @param float $fineAmount Số tiền bị phạt
     * @param int $daysLate Số ngày trả trễ
     * @param bool $isLocked Trạng thái tài khoản có bị khóa do vượt ngưỡng nợ hay không
     * @return int ID thông báo được tạo
     */
    public function notifyUserOfFine(int $userId, float $fineAmount, int $daysLate, bool $isLocked): int
    {
        $formattedFine = number_format($fineAmount, 0, ',', '.');
        $title = 'Thông báo Phí phạt Trễ hạn Tài sản';
        $message = sprintf(
            'Bạn bị phạt %s VND do trả tài sản trễ %d ngày.',
            $formattedFine,
            $daysLate
        );

        if ($isLocked) {
            $thresholdFormatted = number_format(AppConstants::DEBT_LOCK_THRESHOLD, 0, ',', '.');
            $message .= sprintf(
                ' Quyền đặt mượn của bạn đã tạm khóa do tổng công nợ đạt/vượt ngưỡng %s VND.',
                $thresholdFormatted
            );
        }

        return $this->userRepository->createNotification($userId, $title, $message, 'FINE');
    }
}

