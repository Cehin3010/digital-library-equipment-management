<?php

declare(strict_types=1);

namespace App\Services;

use App\Config\AppConstants;
use App\Models\User;
use App\Repositories\AuditAndStatsRepository;
use App\Repositories\UserRepository;
use RuntimeException;

/**
 * Dịch vụ Xác thực SSO/Bcrypt, Phân quyền RBAC và Kiểm toán Bảo mật (Phân hệ 6: F-11, F-12).
 */
class AuthAndSecurityService
{
    private UserRepository $userRepository;
    private AuditAndStatsRepository $auditRepository;

    public function __construct(
        UserRepository $userRepository,
        AuditAndStatsRepository $auditRepository
    ) {
        $this->userRepository = $userRepository;
        $this->auditRepository = $auditRepository;
    }

    /**
     * Mã hóa mật khẩu người dùng an toàn theo chuẩn bcrypt (F-11).
     *
     * @param string $plainPassword Mật khẩu thô
     * @return string Chuỗi băm bcrypt
     */
    public function hashPassword(string $plainPassword): string
    {
        return password_hash($plainPassword, PASSWORD_BCRYPT, ['cost' => 10]);
    }

    /**
     * Xác thực đăng nhập người dùng bằng tài khoản nhà trường (SSO / Mật khẩu bcrypt - F-11).
     *
     * @param string $identifier Mã số sinh viên/giảng viên hoặc Email
     * @param string $password Mật khẩu đăng nhập
     * @param string $ipAddress Địa chỉ IP
     * @return array<string, mixed> Hồ sơ người dùng đã xác thực
     */
    public function authenticate(string $identifier, string $password, string $ipAddress = '127.0.0.1'): array
    {
        $userRow = $this->userRepository->findUserByIdentifier($identifier);
        if ($userRow === null || !password_verify($password, (string) $userRow['password_hash'])) {
            throw new RuntimeException('Thông tin đăng nhập không chính xác.');
        }

        $user = new User($userRow);
        $this->auditRepository->insertAuditLog(
            $user->getUserId(),
            'USER_LOGIN_SSO',
            'users',
            (string) $user->getUserId(),
            sprintf('Đăng nhập thành công qua tài khoản %s', $identifier),
            $ipAddress
        );

        return $user->getUserProfile();
    }

    /**
     * Kiểm tra quyền truy cập RBAC cho một thao tác cụ thể để chống Leo thang Đặc quyền (DAST / F-11).
     *
     * @param int $userId ID người dùng đang thực hiện request
     * @param array<int, int> $allowedRoles Danh sách các mã vai trò được phép
     * @param string $protectedResource Tên tài nguyên được bảo vệ (ví dụ: ADMIN_DASHBOARD, AUDIT_TRAIL)
     * @return void
     */
    public function enforceRoleAccess(int $userId, array $allowedRoles, string $protectedResource): void
    {
        $userRow = $this->userRepository->findUserById($userId);
        if ($userRow === null) {
            throw new RuntimeException('Phiên đăng nhập không hợp lệ.');
        }

        $userRole = (int) $userRow['role_id'];
        if (!in_array($userRole, $allowedRoles, true)) {
            $this->auditRepository->insertAuditLog(
                $userId,
                'UNAUTHORIZED_ACCESS_BLOCKED',
                $protectedResource,
                (string) $userId,
                sprintf('Ngăn chặn leo thang đặc quyền: role_id=%d cố truy cập %s', $userRole, $protectedResource)
            );
            throw new RuntimeException('Truy cập bị từ chối: Bạn không có quyền thực hiện chức năng này (RBAC 403).');
        }
    }
}

