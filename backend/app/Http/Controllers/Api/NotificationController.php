<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    public function index(): JsonResponse
    {
        return $this->successResponse([], 'Danh sách thông báo nhắc hạn');
    }

    public function markAsRead(int $id): JsonResponse
    {
        return $this->successResponse(['is_read' => true], 'Đánh dấu đã đọc thành công');
    }
}

