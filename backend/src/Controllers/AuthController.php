<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Services\AuthAndSecurityService;
use Throwable;

/**
 * Bộ điều khiển Xác thực & Phân quyền người dùng (AuthController - Phân hệ 6: F-11).
 * Tuân thủ quy tắc xử lý lỗi (Section 6): Không bao giờ trả về lỗi hệ thống/SQL cho người dùng cuối.
 */
class AuthController
{
    private AuthAndSecurityService $authService;

    public function __construct(AuthAndSecurityService $authService)
    {
        $this->authService = $authService;
    }

    /**
     * Xử lý yêu cầu đăng nhập qua tài khoản nhà trường (SSO / Mật khẩu).
     *
     * @param array<string, mixed> $requestBody Dữ liệu JSON gửi lên
     * @param string $clientIp Địa chỉ IP của người dùng
     * @return array<string, mixed> Phản hồi JSON chuẩn hóa
     */
    public function login(array $requestBody, string $clientIp = '127.0.0.1'): array
    {
        try {
            $identifier = (string) ($requestBody['identifier'] ?? '');
            $password = (string) ($requestBody['password'] ?? '');

            $profile = $this->authService->authenticate($identifier, $password, $clientIp);

            return [
                'success' => true,
                'message' => 'Đăng nhập thành công vào Hệ thống Thư viện Số.',
                'data' => $profile,
            ];
        } catch (Throwable $error) {
            error_log('[AuthController::login] ' . $error->getMessage());

            return [
                'success' => false,
                'message' => 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin tài khoản.',
            ];
        }
    }
}

