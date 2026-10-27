<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\AppConstants;

/**
 * Thực thể Người dùng hệ thống (Sinh viên, Giảng viên, Cán bộ Thư viện, Quản trị viên).
 */
final class User
{
    private int $userId;
    private string $universityId;
    private string $fullName;
    private string $email;
    private int $roleId;
    private string $department;
    private int $status;
    private float $totalDebt;

    /**
     * @param array<string, mixed> $row Bản ghi từ bảng users
     */
    public function __construct(array $row)
    {
        $this->userId = (int) ($row['user_id'] ?? 0);
        $this->universityId = (string) ($row['university_id'] ?? '');
        $this->fullName = (string) ($row['full_name'] ?? '');
        $this->email = (string) ($row['email'] ?? '');
        $this->roleId = (int) ($row['role_id'] ?? AppConstants::ROLE_STUDENT);
        $this->department = (string) ($row['department'] ?? '');
        $this->status = (int) ($row['status'] ?? AppConstants::USER_STATUS_ACTIVE);
        $this->totalDebt = (float) ($row['total_debt'] ?? 0.0);
    }

    public function getUserId(): int
    {
        return $this->userId;
    }

    public function getRoleId(): int
    {
        return $this->roleId;
    }

    public function getStatus(): int
    {
        return $this->status;
    }

    public function getTotalDebt(): float
    {
        return $this->totalDebt;
    }

    public function isLocked(): bool
    {
        return $this->status === AppConstants::USER_STATUS_LOCKED
            || $this->totalDebt >= AppConstants::DEBT_LOCK_THRESHOLD;
    }

    /**
     * Trả về bản sao thông tin hồ sơ người dùng (loại bỏ password_hash để bảo mật).
     *
     * @return array<string, mixed>
     */
    public function getUserProfile(): array
    {
        return [
            'user_id' => $this->userId,
            'university_id' => $this->universityId,
            'full_name' => $this->fullName,
            'email' => $this->email,
            'role_id' => $this->roleId,
            'department' => $this->department,
            'status' => $this->status,
            'total_debt' => $this->totalDebt,
            'is_locked' => $this->isLocked(),
        ];
    }
}

