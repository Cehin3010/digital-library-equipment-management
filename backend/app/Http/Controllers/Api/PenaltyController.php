<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PenaltyController extends Controller
{
    public function myLoans(Request $request): JsonResponse
    {
        return $this->successResponse([], 'Lịch sử mượn trả cá nhân');
    }

    public function myPenalties(Request $request): JsonResponse
    {
        return $this->successResponse([], 'Danh sách công nợ phạt cá nhân');
    }

    public function store(Request $request): JsonResponse
    {
        return $this->successResponse($request->all(), 'Lập phiếu phạt thành công', 201);
    }
}
