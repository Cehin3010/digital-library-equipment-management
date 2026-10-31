<?php

namespace App\Http/Controllers/Api;

use App\Http/Controllers/Controller;
use App\Http/Requests/InitiatePaymentRequest;
use App\Models\Payment;
use App\Models\Penalty;
use App\Services\PaymentService;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(protected PaymentService $paymentService) {}

    public function initiatePayment(InitiatePaymentRequest $request, $id)
    {
        $penalty = Penalty::findOrFail($id);

        if ($penalty->status === 'PAID') {
            return response()->json([
                'success' => false,
                'message' => 'Phiếu phạt này đã được thanh toán trước đó.',
            ], 400);
        }

        $paymentUrl = $this->paymentService->createPaymentUrl($penalty, $request->provider);

        return response()->json([
            'success' => true,
            'message' => 'Khởi tạo thanh toán thành công',
            'data' => ['payment_url' => $paymentUrl],
        ]);
    }

    public function checkStatus($txnRef)
    {
        $payment = Payment::where('txn_ref', $txnRef)->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => [
                'txn_ref' => $payment->txn_ref,
                'status' => $payment->status,
                'amount' => $payment->amount,
            ],
        ]);
    }

    public function vnpayIpn(Request $request)
    {
        $txnRef = $request->get('vnp_TxnRef');
        $responseCode = $request->get('vnp_ResponseCode');

        $isSuccess = ($responseCode === '00');
        $this->paymentService->processIpn($txnRef, $isSuccess);

        return response()->json(['RspCode' => '00', 'Message' => 'Confirm Success']);
    }

    public function momoIpn(Request $request)
    {
        $txnRef = $request->get('txnRef');
        $resultCode = $request->get('resultCode');

        $isSuccess = ($resultCode == 0);
        $this->paymentService->processIpn($txnRef, $isSuccess);

        return response()->json(['message' => 'Success']);
    }
}