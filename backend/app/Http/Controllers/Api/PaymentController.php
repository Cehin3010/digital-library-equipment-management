<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function initiatePayment(int $id, Request $request): JsonResponse
    {
        return $this->successResponse(['payment_url' => 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?sample=1'], 'Khởi tạo link thanh toán thành công');
    }

    public function checkStatus(string $txnRef): JsonResponse
    {
        return $this->successResponse(['status' => 'SUCCESS', 'txn_ref' => $txnRef], 'Trạng thái giao dịch');
    }

    public function vnpayIpn(Request $request): JsonResponse
    {
        return response()->json(['RspCode' => '00', 'Message' => 'Confirm Success']);
    }

    public function momoIpn(Request $request): JsonResponse
    {
        return response()->json(['resultCode' => 0, 'message' => 'Successful']);
    }
}

