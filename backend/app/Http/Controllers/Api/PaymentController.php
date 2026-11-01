<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LibraryNotification;
use App\Models\Payment;
use App\Models\Penalty;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    public function initiatePayment(int $id, Request $request): JsonResponse
    {
        $data = $request->validate([
            'provider' => ['required', 'in:VNPAY'],
        ]);
        $tmnCode = config('services.vnpay.tmn_code');
        $hashSecret = config('services.vnpay.hash_secret');
        $gatewayUrl = config('services.vnpay.url');

        if (! $tmnCode || ! $hashSecret || ! $gatewayUrl) {
            return $this->errorResponse('Cổng VNPay chưa được cấu hình. Hãy thiết lập thông tin sandbox trong file môi trường.', null, 503);
        }

        $penalty = Penalty::query()
            ->where('user_id', $request->user()->user_id)
            ->findOrFail($id);
        abort_unless($penalty->status === 'UNPAID', 409, 'Khoản phạt này đã được thanh toán.');

        $payment = Payment::create([
            'penalty_id' => $penalty->penalty_id,
            'user_id' => $request->user()->user_id,
            'provider' => $data['provider'],
            'txn_ref' => (string) Str::uuid(),
            'amount' => $penalty->amount,
            'status' => 'PENDING',
            'created_at' => now(),
        ]);

        $params = [
            'vnp_Version' => '2.1.0',
            'vnp_Command' => 'pay',
            'vnp_TmnCode' => $tmnCode,
            'vnp_Amount' => $payment->amount * 100,
            'vnp_CurrCode' => 'VND',
            'vnp_TxnRef' => $payment->txn_ref,
            'vnp_OrderInfo' => 'Thanh toan khoan phat ' . $penalty->penalty_id,
            'vnp_OrderType' => 'other',
            'vnp_Locale' => 'vn',
            'vnp_ReturnUrl' => config('services.vnpay.return_url') ?: url('/api/payments/vnpay-return'),
            'vnp_IpAddr' => $request->ip(),
            'vnp_CreateDate' => now()->format('YmdHis'),
            'vnp_ExpireDate' => now()->addMinutes(15)->format('YmdHis'),
        ];
        ksort($params);
        $query = http_build_query($params, '', '&', PHP_QUERY_RFC3986);
        $signature = hash_hmac('sha512', $query, $hashSecret);

        return $this->successResponse([
            'payment_url' => $gatewayUrl . '?' . $query . '&vnp_SecureHash=' . $signature,
            'txn_ref' => $payment->txn_ref,
            'status' => $payment->status,
        ], 'Đã khởi tạo giao dịch VNPay');
    }

    public function simulatePayment(int $id, Request $request): JsonResponse
    {
        abort_unless(app()->environment('local', 'testing'), 404);
        $data = $request->validate(['provider' => ['required', 'in:VNPAY,MOMO']]);

        $payment = DB::transaction(function () use ($id, $request, $data) {
            $penalty = Penalty::query()
                ->where('user_id', $request->user()->user_id)
                ->lockForUpdate()
                ->findOrFail($id);
            abort_unless($penalty->status === 'UNPAID', 409, 'Khoản thu này không còn ở trạng thái chưa thanh toán.');

            $payment = Payment::create([
                'penalty_id' => $penalty->penalty_id,
                'user_id' => $request->user()->user_id,
                'provider' => $data['provider'],
                'txn_ref' => (string) Str::uuid(),
                'amount' => $penalty->amount,
                'status' => 'PAID',
                'provider_transaction_id' => 'DEMO-' . Str::upper(Str::random(12)),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $penalty->update(['status' => 'PAID', 'paid_at' => now()]);
            LibraryNotification::create([
                'user_id' => $payment->user_id,
                'type' => 'PAYMENT_CONFIRMED',
                'title' => 'Thanh toán thành công',
                'message' => 'Khoản thu #' . $penalty->penalty_id . ' đã được đánh dấu đã thanh toán. Giao dịch không thu tiền thật.',
                'related_type' => 'payment',
                'related_id' => $payment->payment_id,
                'created_at' => now(),
            ]);

            return $payment;
        });

        return $this->successResponse([
            'status' => $payment->status,
            'txn_ref' => $payment->txn_ref,
            'amount' => $payment->amount,
            'simulated' => true,
        ], 'Thanh toán thành công.');
    }

    public function checkStatus(Request $request, string $txnRef): JsonResponse
    {
        $payment = Payment::query()
            ->where('txn_ref', $txnRef)
            ->where('user_id', $request->user()->user_id)
            ->firstOrFail();

        return $this->successResponse([
            'status' => $payment->status,
            'txn_ref' => $payment->txn_ref,
            'amount' => $payment->amount,
        ], 'Trạng thái giao dịch');
    }

    public function vnpayIpn(Request $request): JsonResponse
    {
        if (! $this->hasValidVnpaySignature($request)) {
            return response()->json(['RspCode' => '97', 'Message' => 'Invalid signature'], 400);
        }

        $payment = $this->applyVnpayResult($request);
        if (! $payment) {
            return response()->json(['RspCode' => '01', 'Message' => 'Order not found'], 404);
        }

        return response()->json(['RspCode' => '00', 'Message' => 'Confirm Success']);
    }

    public function vnpayReturn(Request $request): RedirectResponse
    {
        if ($this->hasValidVnpaySignature($request)) {
            $this->applyVnpayResult($request);
        }

        $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:5174'), '/');
        return redirect()->to($frontendUrl . '/payment/result?txn_ref=' . urlencode((string) $request->query('vnp_TxnRef')));
    }

    public function momoIpn(): JsonResponse
    {
        return response()->json(['resultCode' => 1, 'message' => 'MoMo is not configured'], 503);
    }

    private function hasValidVnpaySignature(Request $request): bool
    {
        $hashSecret = config('services.vnpay.hash_secret');
        $providedSignature = (string) $request->input('vnp_SecureHash');
        $tmnCode = config('services.vnpay.tmn_code');
        if (! $hashSecret || ! $tmnCode || $providedSignature === ''
            || $request->input('vnp_TmnCode') !== $tmnCode) {
            return false;
        }

        $params = $request->except(['vnp_SecureHash', 'vnp_SecureHashType']);
        ksort($params);
        $query = http_build_query($params, '', '&', PHP_QUERY_RFC3986);
        return hash_equals(hash_hmac('sha512', $query, $hashSecret), $providedSignature);
    }

    private function applyVnpayResult(Request $request): ?Payment
    {
        $payment = Payment::query()->where('txn_ref', $request->input('vnp_TxnRef'))->first();
        if (! $payment || (int) $request->input('vnp_Amount') !== $payment->amount * 100) {
            return null;
        }

        return DB::transaction(function () use ($payment, $request) {
            $payment = Payment::query()->lockForUpdate()->findOrFail($payment->payment_id);
            if ($payment->status !== 'PENDING') {
                return $payment;
            }

            $successful = $request->input('vnp_ResponseCode') === '00'
                && $request->input('vnp_TransactionStatus') === '00';
            $payment->update([
                'status' => $successful ? 'PAID' : 'FAILED',
                'provider_transaction_id' => $request->input('vnp_TransactionNo'),
                'updated_at' => now(),
            ]);

            if ($successful) {
                $penalty = Penalty::query()->lockForUpdate()->findOrFail($payment->penalty_id);
                if ($penalty->status === 'UNPAID') {
                    $penalty->update(['status' => 'PAID', 'paid_at' => now()]);
                    LibraryNotification::create([
                        'user_id' => $payment->user_id,
                        'type' => 'PAYMENT_CONFIRMED',
                        'title' => 'Đã thanh toán khoản phạt',
                        'message' => 'Giao dịch thanh toán khoản phạt #' . $penalty->penalty_id . ' đã được xác nhận.',
                        'related_type' => 'payment',
                        'related_id' => $payment->payment_id,
                        'created_at' => now(),
                    ]);
                }
            }

            return $payment;
        });
    }
}
