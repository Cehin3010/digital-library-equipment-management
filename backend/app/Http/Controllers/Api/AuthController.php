<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function requestOtp(Request $request): JsonResponse
    {
        return $this->successResponse(['email' => $request->email], 'Mã OTP đã được gửi đến email');
    }

    public function verifyOtp(Request $request): JsonResponse
    {
        return $this->successResponse(['token' => 'sample_sanctum_token'], 'Đăng nhập thành công');
    }

    public function me(Request $request): JsonResponse
    {
        return $this->successResponse($request->user(), 'Lấy thông tin người dùng hiện tại');
    }

    public function logout(Request $request): JsonResponse
    {
        return $this->successResponse(null, 'Đăng xuất thành công');
    }
}

