<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Config\AppConstants;
use PDO;

/**
 * Quản lý truy xuất dữ liệu Đặt Phòng Học & Không gian Thảo luận (Phân hệ 4: F-07, F-08).
 */
class RoomBookingRepository
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * Lấy danh sách tất cả các phòng học và không gian thảo luận.
     *
     * @return array<int, array<string, mixed>>
     */
    public function findAllRooms(): array
    {
        $stmt = $this->db->query('SELECT * FROM study_rooms ORDER BY room_code ASC');
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [...$rows];
    }

    /**
     * Tìm thông tin phòng học theo ID.
     *
     * @param int $roomId ID phòng học
     * @return array<string, mixed>|null
     */
    public function findRoomById(int $roomId): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM study_rooms WHERE room_id = :room_id');
        $stmt->execute(['room_id' => $roomId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ?: null;
    }

    /**
     * Kiểm tra xung đột lịch đặt phòng theo thời gian thực (F-07).
     * Hai khung giờ [startA, endA] và [startB, endB] giao nhau khi: startA < endB AND endA > startB.
     *
     * @param int $roomId ID phòng học
     * @param string $bookingDate Ngày đặt (YYYY-MM-DD)
     * @param string $startTime Giờ bắt đầu (HH:MM:SS)
     * @param string $endTime Giờ kết thúc (HH:MM:SS)
     * @param int|null $excludeBookingId ID lịch đặt cần loại trừ (khi dời giờ)
     * @return bool True nếu có xung đột lịch
     */
    public function hasTimeSlotConflict(
        int $roomId,
        string $bookingDate,
        string $startTime,
        string $endTime,
        ?int $excludeBookingId = null
    ): bool {
        $sql = 'SELECT COUNT(*) FROM room_bookings
                WHERE room_id = :room_id
                  AND booking_date = :booking_date
                  AND status = :status
                  AND start_time < :end_time
                  AND end_time > :start_time';

        $params = [
            'room_id' => $roomId,
            'booking_date' => $bookingDate,
            'status' => AppConstants::BOOKING_STATUS_CONFIRMED,
            'start_time' => $startTime,
            'end_time' => $endTime,
        ];

        if ($excludeBookingId !== null) {
            $sql .= ' AND booking_id != :exclude_id';
            $params['exclude_id'] = $excludeBookingId;
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return ((int) $stmt->fetchColumn()) > 0;
    }

    /**
     * Lưu thông tin đặt phòng học mới (F-07).
     *
     * @param array<string, mixed> $bookingData Dữ liệu đặt phòng
     * @return int ID lịch đặt phòng vừa tạo
     */
    public function createBooking(array $bookingData): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO room_bookings
                (booking_code, room_id, user_id, booking_date, start_time, end_time, attendees_count, purpose, total_cost, status)
             VALUES
                (:booking_code, :room_id, :user_id, :booking_date, :start_time, :end_time, :attendees_count, :purpose, :total_cost, :status)'
        );
        $stmt->execute([
            'booking_code' => $bookingData['booking_code'],
            'room_id' => (int) $bookingData['room_id'],
            'user_id' => (int) $bookingData['user_id'],
            'booking_date' => $bookingData['booking_date'],
            'start_time' => $bookingData['start_time'],
            'end_time' => $bookingData['end_time'],
            'attendees_count' => (int) $bookingData['attendees_count'],
            'purpose' => $bookingData['purpose'],
            'total_cost' => (float) ($bookingData['total_cost'] ?? 0.0),
            'status' => AppConstants::BOOKING_STATUS_CONFIRMED,
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Tìm lịch đặt phòng theo ID.
     *
     * @param int $bookingId ID lịch đặt
     * @return array<string, mixed>|null
     */
    public function findBookingById(int $bookingId): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM room_bookings WHERE booking_id = :booking_id');
        $stmt->execute(['booking_id' => $bookingId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ?: null;
    }

    /**
     * Cập nhật trạng thái hủy lịch đặt phòng để giải phóng slot trống ngay lập tức (F-08).
     *
     * @param int $bookingId ID lịch đặt
     * @return bool
     */
    public function cancelBooking(int $bookingId): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE room_bookings
             SET status = :status, updated_at = CURRENT_TIMESTAMP
             WHERE booking_id = :booking_id'
        );

        return $stmt->execute([
            'status' => AppConstants::BOOKING_STATUS_CANCELLED,
            'booking_id' => $bookingId,
        ]);
    }

    /**
     * Lấy danh sách lịch đặt phòng theo khoảng ngày để hiển thị bảng tuần (F-07).
     *
     * @param string $startDate Ngày đầu tuần
     * @param string $endDate Ngày cuối tuần
     * @return array<int, array<string, mixed>>
     */
    public function findBookingsInDateRange(string $startDate, string $endDate): array
    {
        $stmt = $this->db->prepare(
            'SELECT rb.*, sr.room_code, sr.room_name, u.full_name
             FROM room_bookings rb
             INNER JOIN study_rooms sr ON rb.room_id = sr.room_id
             INNER JOIN users u ON rb.user_id = u.user_id
             WHERE rb.booking_date BETWEEN :start_date AND :end_date
               AND rb.status = :status
             ORDER BY rb.booking_date ASC, rb.start_time ASC'
        );
        $stmt->execute([
            'start_date' => $startDate,
            'end_date' => $endDate,
            'status' => AppConstants::BOOKING_STATUS_CONFIRMED,
        ]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [...$rows];
    }
}

