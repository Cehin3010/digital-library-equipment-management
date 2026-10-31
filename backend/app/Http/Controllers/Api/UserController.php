<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        return $this->successResponse([], 'Danh sách người dùng');
    }

    public function store(Request $request): JsonResponse
    {
        return $this->successResponse($request->all(), 'Tạo người dùng thành công', 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        return $this->successResponse($request->all(), 'Cập nhật người dùng thành công');
    }
}

