<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LoanController extends Controller
{
    public function hold(Request $request): JsonResponse
    {
        return $this->successResponse(['status' => 'HOLDING'], 'Giữ chỗ tài sản thành công trong 10 phút', 201);
    }

    public function confirm(int $id): JsonResponse
    {
        return $this->successResponse(['status' => 'PENDING'], 'Xác nhận đặt mượn thành công');
    }

    public function cancel(int $id): JsonResponse
    {
        return $this->successResponse(['status' => 'CANCELLED'], 'Hủy phiếu đặt mượn thành công');
    }
}

