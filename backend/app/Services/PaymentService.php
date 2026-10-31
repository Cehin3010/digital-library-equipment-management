<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Penalty;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentService
{
    public function createPaymentUrl(Penalty $penalty, string $provider): string
    {
        $txnRef = 'TXN_' . time() . '_' . Str::random(5);

        Payment::create([
            'penalty_id' => $penalty->id,
            'user_id' => $penalty->user_id,
            'txn_ref' => $txnRef,
            'provider' => $provider,
            'amount' => $penalty->amount,
            'status' => 'PENDING',
        ]);

        if ($provider === 'VNPAY') {
            return $this->buildVnPayUrl($txnRef, $penalty->amount);
        }

        return $this->buildMoMoUrl($txnRef, $penalty->amount);
    }

    private function buildVnPayUrl(string $txnRef, float $amount): string
    {
        $vnpUrl = config('services.vnpay.url', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html');
        $vnpTmnCode = config('services.vnpay.tmn_code', 'DEMOTMN01');
        $vnpHashSecret = config('services.vnpay.hash_secret', 'DEMOHASHSECRET');

        $inputData = [
            'vnp_Version' => '2.1.0',
            'vnp_TmnCode' => $vnpTmnCode,
            'vnp_Amount' => $amount * 100,
            'vnp_Command' => 'pay',
            'vnp_CreateDate' => date('YmdHis'),
            'vnp_CurrCode' => 'VND',
            'vnp_IpAddr' => request()->ip() ?? '127.0.0.1',
            'vnp_Locale' => 'vn',
            'vnp_OrderInfo' => "Thanh toan phi phat {$txnRef}",
            'vnp_OrderType' => 'other',
            'vnp_ReturnUrl' => config('app.url') . "/api/payments/vnpay-ipn",
            'vnp_TxnRef' => $txnRef,
        ];

        ksort($inputData);
        $query = http_build_query($inputData);
        $vnpSecureHash = hash_hmac('sha512', $query, $vnpHashSecret);

        return $vnpUrl . '?' . $query . '&vnp_SecureHash=' . $vnpSecureHash;
    }

    private function buildMoMoUrl(string $txnRef, float $amount): string
    {
        return "https://test-payment.momo.vn/pay/checkout?txnRef={$txnRef}&amount={$amount}";
    }

    public function processIpn(string $txnRef, bool $isSuccess): bool
    {
        return DB::transaction(function () use ($txnRef, $isSuccess) {
            $payment = Payment::where('txn_ref', $txnRef)->first();

            if (!$payment || $payment->status === 'SUCCESS') {
                return false;
            }

            if ($isSuccess) {
                $payment->update([
                    'status' => 'SUCCESS',
                    'paid_at' => now(),
                ]);

                $payment->penalty->update(['status' => 'PAID']);
                return true;
            }

            $payment->update(['status' => 'FAILED']);
            return false;
        });
    }
}