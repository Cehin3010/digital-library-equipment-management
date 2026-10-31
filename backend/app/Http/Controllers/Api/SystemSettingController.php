<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SystemSettingController extends Controller
{
    public function index(): JsonResponse
    {
        return $this->successResponse([], 'Danh sách tham số hệ thống');
    }

    public function update(Request $request): JsonResponse
    {
        return $this->successResponse($request->all(), 'Cập nhật tham số hệ thống thành công');
    }
}

