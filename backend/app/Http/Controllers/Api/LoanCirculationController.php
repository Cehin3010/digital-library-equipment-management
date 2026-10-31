<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LoanCirculationController extends Controller
{
    public function index(): JsonResponse
    {
        return $this->successResponse([], 'Danh sách phiếu lưu thông quầy');
    }

    public function scanQr(Request $request): JsonResponse
    {
        return $this->successResponse(['qr_token' => $request->qr_token], 'Quét mã QR thành công');
    }

    public function approve(int $id): JsonResponse
    {
        return $this->successResponse(['status' => 'BORROWING'], 'Bàn giao tài sản thành công');
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        return $this->successResponse(['status' => 'REJECTED'], 'Từ chối phiếu mượn');
    }

    public function returnAsset(Request $request, int $id): JsonResponse
    {
        return $this->successResponse(['status' => 'RETURNED'], 'Ghi nhận nhận trả tài sản thành công');
    }
}
