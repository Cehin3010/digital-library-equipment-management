<?php

declare(strict_types=1);

namespace App\Services;

use App\Config\AppConstants;
use App\Repositories\AuditAndStatsRepository;
use App\Repositories\RoomBookingRepository;
use App\Repositories\UserRepository;
use InvalidArgumentException;
use RuntimeException;

/**
 * Dịch vụ Đặt Phòng Học & Quản lý Hủy/Dời Lịch Đặt (Phân hệ 4: F-07, F-08).
 */
class RoomBookingService
{
    private RoomBookingRepository $roomRepository;
    private UserRepository $userRepository;
    private AuditAndStatsRepository $auditRepository;

    public function __construct(
        RoomBookingRepository $roomRepository,
        UserRepository $userRepository,
        AuditAndStatsRepository $auditRepository
    ) {
        $this->roomRepository = $roomRepository;
        $this->userRepository = $userRepository;
        $this->auditRepository = $auditRepository;
    }

    /**
     * Tính toán chi phí mượn phòng học hoặc thiết bị.
     * Nếu người dùng là Giảng viên (role_id = 3 / ROLE_LECTURER), miễn phí hoàn toàn.
     *
     * @param int $userId ID của người mượn
     * @param int $assetId ID của phòng học hoặc tài sản
     * @param int $hours Số giờ dự kiến mượn
     * @return float Số tiền cần thanh toán
     */
    public function calculateBookingCost(int $userId, int $assetId, int $hours): float
    {
        if ($hours <= 0) {
            return 0.0;
        }

        $user = $this->userRepository->findUserById($userId);
        if ($user === null) {
            throw new RuntimeException('Không tìm thấy thông tin người dùng đặt phòng.');
        }

        // Chính sách học thuật của trường: Giảng viên và Quản trị viên được miễn phí hoàn toàn chi phí đặt phòng
        $userRole = (int) $user['role_id'];
        if ($userRole === AppConstants::ROLE_LECTURER || $userRole === AppConstants::ROLE_ADMIN) {
            return 0.0;
        }

        $room = $this->roomRepository->findRoomById($assetId);
        $hourlyRate = $room !== null
            ? (float) $room['hourly_rate']
            : AppConstants::DEFAULT_ROOM_HOURLY_RATE;

        return round($hourlyRate * $hours, 2);
    }

    /**
     * Đặt phòng học theo khung giờ và kiểm tra xung đột lịch theo thời gian thực (F-07).
     *
     * @param int $userId ID người đặt phòng
     * @param array<string, mixed> $payload Thông tin đặt phòng (room_id, booking_date, start_time, end_time, attendees_count, purpose)
     * @return array<string, mixed> Thông tin xác nhận lịch đặt phòng
     */
    public function bookStudyRoom(int $userId, array $payload): array
    {
        $roomId = (int) ($payload['room_id'] ?? 0);
        $bookingDate = trim((string) ($payload['booking_date'] ?? ''));
        $startTime = trim((string) ($payload['start_time'] ?? ''));
        $endTime = trim((string) ($payload['end_time'] ?? ''));
        $attendeesCount = (int) ($payload['attendees_count'] ?? 1);
        $purpose = trim((string) ($payload['purpose'] ?? 'Học nhóm & Thảo luận đồ án'));

        if ($roomId <= 0 || $bookingDate === '' || $startTime === '' || $endTime === '') {
            throw new InvalidArgumentException('Vui lòng nhập đầy đủ mã phòng, ngày đặt và khung giờ.');
        }

        if (strtotime($startTime) >= strtotime($endTime)) {
            throw new InvalidArgumentException('Giờ kết thúc phải lớn hơn giờ bắt đầu.');
        }

        $room = $this->roomRepository->findRoomById($roomId);
        if ($room === null) {
            throw new RuntimeException('Phòng học không tồn tại trong hệ thống.');
        }

        if ($room['status'] === AppConstants::ASSET_STATUS_MAINTENANCE) {
            throw new RuntimeException(sprintf('Phòng "%s" hiện đang bảo trì, không thể đặt lịch.', $room['room_name']));
        }

        if ($attendeesCount > (int) $room['capacity']) {
            throw new InvalidArgumentException(sprintf(
                'Số lượng người tham gia (%d) vượt quá sức chứa tối đa của phòng (%d chỗ).',
                $attendeesCount,
                (int) $room['capacity']
            ));
        }

        if ($this->roomRepository->hasTimeSlotConflict($roomId, $bookingDate, $startTime, $endTime)) {
            throw new RuntimeException(sprintf(
                'Xung đột lịch đặt! Phòng "%s" đã có người đặt trong khung giờ %s - %s ngày %s.',
                $room['room_name'],
                $startTime,
                $endTime,
                $bookingDate
            ));
        }

        $durationHours = (int) max(
            1,
            ceil((strtotime($endTime) - strtotime($startTime)) / AppConstants::SECONDS_PER_HOUR)
        );
        $totalCost = $this->calculateBookingCost($userId, $roomId, $durationHours);
        $bookingCode = sprintf('ROOM-%s-%d-%d', str_replace('-', '', $bookingDate), $roomId, $userId);

        $bookingId = $this->roomRepository->createBooking([
            'booking_code' => $bookingCode,
            'room_id' => $roomId,
            'user_id' => $userId,
            'booking_date' => $bookingDate,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'attendees_count' => $attendeesCount,
            'purpose' => $purpose,
            'total_cost' => $totalCost,
        ]);

        $this->userRepository->createNotification(
            $userId,
            'Xác nhận Đặt Phòng Học Thành công',
            sprintf(
                'Đã xác nhận đặt phòng %s (%s) ngày %s từ %s đến %s. Mã đặt phòng: %s.',
                $room['room_code'],
                $room['room_name'],
                $bookingDate,
                $startTime,
                $endTime,
                $bookingCode
            ),
            'ROOM_BOOKING'
        );

        $this->auditRepository->insertAuditLog(
            $userId,
            'BOOK_STUDY_ROOM',
            'room_bookings',
            (string) $bookingId,
            sprintf('Đặt phòng %s ngày %s (%s - %s)', $room['room_code'], $bookingDate, $startTime, $endTime)
        );

        return [
            'booking_id' => $bookingId,
            'booking_code' => $bookingCode,
            'room_code' => $room['room_code'],
            'room_name' => $room['room_name'],
            'booking_date' => $bookingDate,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'attendees_count' => $attendeesCount,
            'total_cost' => $totalCost,
            'status' => AppConstants::BOOKING_STATUS_CONFIRMED,
        ];
    }

    /**
     * Hủy lịch đặt phòng học (F-08).
     * Cho phép hủy trước tối thiểu 2 giờ (MIN_CANCEL_HOURS_BEFORE) không phạt và mở lại slot trống ngay.
     *
     * @param int $userId ID người yêu cầu hủy
     * @param int $bookingId ID lịch đặt phòng
     * @param string|null $currentTimestamp Thời điểm hiện tại (cho phép truyền vào khi chạy test)
     * @return array<string, mixed> Kết quả hủy lịch đặt phòng
     */
    public function cancelRoomBooking(int $userId, int $bookingId, ?string $currentTimestamp = null): array
    {
        $booking = $this->roomRepository->findBookingById($bookingId);
        if ($booking === null) {
            throw new RuntimeException('Không tìm thấy lịch đặt phòng.');
        }

        if ($booking['status'] === AppConstants::BOOKING_STATUS_CANCELLED) {
            throw new RuntimeException('Lịch đặt phòng này đã được hủy trước đó.');
        }

        $slotStartTimestamp = strtotime($booking['booking_date'] . ' ' . $booking['start_time']);
        $nowTimestamp = strtotime($currentTimestamp ?: date('Y-m-d H:i:s'));

        $hoursRemaining = ($slotStartTimestamp - $nowTimestamp) / AppConstants::SECONDS_PER_HOUR;
        if ($hoursRemaining < AppConstants::MIN_CANCEL_HOURS_BEFORE) {
            throw new RuntimeException(sprintf(
                'Chỉ được phép hủy lịch đặt phòng không phạt trước giờ bắt đầu tối thiểu %d giờ.',
                AppConstants::MIN_CANCEL_HOURS_BEFORE
            ));
        }

        $this->roomRepository->cancelBooking($bookingId);

        $this->auditRepository->insertAuditLog(
            $userId,
            'CANCEL_ROOM_BOOKING',
            'room_bookings',
            (string) $bookingId,
            sprintf('Hủy lịch đặt phòng #%d (%s) trước %.1f giờ, đã giải phóng slot trống', $bookingId, $booking['booking_code'], $hoursRemaining)
        );

        return [
            'booking_id' => $bookingId,
            'booking_code' => $booking['booking_code'],
            'status' => AppConstants::BOOKING_STATUS_CANCELLED,
            'penalty_fee' => 0.0,
            'slot_released' => true,
        ];
    }
}

