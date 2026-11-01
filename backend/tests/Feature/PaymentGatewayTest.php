<?php

namespace Tests\Feature;

use App\Models\Payment;
use App\Models\Penalty;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class PaymentGatewayTest extends TestCase
{
    use RefreshDatabase;

    public function test_signed_vnpay_callback_marks_payment_and_penalty_paid(): void
    {
        Config::set('services.vnpay.hash_secret', 'test-hash-secret');
        Config::set('services.vnpay.tmn_code', 'TESTMERCHANT');
        [$user, $penalty, $payment] = $this->createPendingPayment();
        $payload = $this->signedPayload([
            'vnp_Amount' => '1250000',
            'vnp_ResponseCode' => '00',
            'vnp_TmnCode' => 'TESTMERCHANT',
            'vnp_TxnRef' => $payment->txn_ref,
            'vnp_TransactionNo' => 'gateway-123',
            'vnp_TransactionStatus' => '00',
        ]);

        $this->postJson('/api/payments/vnpay-ipn', $payload)
            ->assertOk()
            ->assertJsonPath('RspCode', '00');

        $this->assertDatabaseHas('payments', [
            'payment_id' => $payment->payment_id,
            'status' => 'PAID',
            'provider_transaction_id' => 'gateway-123',
        ]);
        $this->assertDatabaseHas('penalties', [
            'penalty_id' => $penalty->penalty_id,
            'status' => 'PAID',
        ]);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $user->user_id,
            'related_id' => $payment->payment_id,
            'type' => 'PAYMENT_CONFIRMED',
        ]);
    }

    public function test_invalid_vnpay_signature_does_not_change_payment_status(): void
    {
        Config::set('services.vnpay.hash_secret', 'test-hash-secret');
        Config::set('services.vnpay.tmn_code', 'TESTMERCHANT');
        [, , $payment] = $this->createPendingPayment();

        $this->postJson('/api/payments/vnpay-ipn', [
            'vnp_Amount' => '1250000',
            'vnp_ResponseCode' => '00',
            'vnp_TxnRef' => $payment->txn_ref,
            'vnp_TransactionStatus' => '00',
            'vnp_SecureHash' => 'invalid',
        ])->assertStatus(400)
            ->assertJsonPath('RspCode', '97');

        $this->assertDatabaseHas('payments', [
            'payment_id' => $payment->payment_id,
            'status' => 'PENDING',
        ]);
    }

    public function test_local_demo_payment_marks_penalty_paid_without_gateway_credentials(): void
    {
        [$user, $penalty] = $this->createPendingPayment();

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/penalties/{$penalty->penalty_id}/pay-demo", ['provider' => 'MOMO'])
            ->assertOk()
            ->assertJsonPath('data.status', 'PAID')
            ->assertJsonPath('data.simulated', true);

        $this->assertDatabaseHas('penalties', [
            'penalty_id' => $penalty->penalty_id,
            'status' => 'PAID',
        ]);
        $this->assertDatabaseHas('payments', [
            'penalty_id' => $penalty->penalty_id,
            'provider' => 'MOMO',
            'status' => 'PAID',
        ]);
    }

    private function createPendingPayment(): array
    {
        $role = Role::create(['role_name' => 'STUDENT']);
        $user = User::factory()->create(['role_id' => $role->role_id]);
        $penalty = Penalty::create([
            'user_id' => $user->user_id,
            'penalty_type' => 'OVERDUE',
            'overdue_days' => 1,
            'amount' => 12500,
            'status' => 'UNPAID',
            'created_at' => now(),
        ]);
        $payment = Payment::create([
            'penalty_id' => $penalty->penalty_id,
            'user_id' => $user->user_id,
            'provider' => 'VNPAY',
            'txn_ref' => 'test-' . $penalty->penalty_id,
            'amount' => $penalty->amount,
            'status' => 'PENDING',
            'created_at' => now(),
        ]);

        return [$user, $penalty, $payment];
    }

    private function signedPayload(array $payload): array
    {
        ksort($payload);
        $query = http_build_query($payload, '', '&', PHP_QUERY_RFC3986);
        $payload['vnp_SecureHash'] = hash_hmac('sha512', $query, 'test-hash-secret');
        return $payload;
    }
}
