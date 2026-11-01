<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LibraryNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notifications = LibraryNotification::query()
            ->where('user_id', $request->user()->user_id)
            ->latest('created_at')
            ->paginate(min($request->integer('per_page', 20), 100));

        return $this->successResponse($notifications, 'Danh sách thông báo');
    }

    public function markAsRead(int $id, Request $request): JsonResponse
    {
        $notification = LibraryNotification::query()
            ->where('user_id', $request->user()->user_id)
            ->findOrFail($id);

        if ($notification->read_at === null) {
            $notification->update(['read_at' => now()]);
        }

        return $this->successResponse($notification->refresh(), 'Đánh dấu đã đọc thành công');
    }
}
