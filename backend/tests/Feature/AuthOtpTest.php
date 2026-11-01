<?php

namespace Tests\Feature;

use App\Mail\OtpMail;
use App\Models\LoginOtp;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AuthOtpTest extends TestCase
{
    use RefreshDatabase;

    public function test_active_user_can_request_and_verify_email_otp(): void
    {
        Mail::fake();
        $role = Role::create(['role_name' => 'STUDENT', 'description' => 'Sinh viên']);
        $user = User::factory()->create(['role_id' => $role->role_id]);

        $request = $this->postJson('/api/auth/otp/request', ['email' => $user->email]);
        $request->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonMissingPath('data.otp');

        $otp = LoginOtp::where('email', $user->email)->firstOrFail();
        $this->assertNotNull($otp->otp_hash);
        $this->assertSame(0, $otp->attempts);

        $code = null;
        Mail::assertQueued(OtpMail::class, function (OtpMail $mail) use (&$code, $user) {
            $this->assertSame($user->email, $mail->to[0]['address']);
            $code = $mail->otpCode;
            return true;
        });
        $this->assertIsString($code);
        $this->assertTrue(Hash::check($code, $otp->otp_hash));
        $this->assertNotSame($code, $otp->otp_hash);

        $verify = $this->postJson('/api/auth/otp/verify', [
            'email' => $user->email,
            'otp' => $code,
        ]);
        $verify->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.user_id', $user->user_id)
            ->assertJsonStructure(['data' => ['token', 'user' => ['role']]]);

        $token = $verify->json('data.token');
        $this->withToken($token)->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('data.email', $user->email);
        $this->assertDatabaseMissing('login_otps', ['email' => $user->email]);
    }

    public function test_locked_accounts_cannot_request_otp(): void
    {
        Mail::fake();
        $role = Role::create(['role_name' => 'STUDENT', 'description' => 'Sinh viên']);
        $user = User::factory()->create([
            'role_id' => $role->role_id,
            'status' => User::STATUS_LOCKED,
        ]);

        $this->postJson('/api/auth/otp/request', ['email' => $user->email])
            ->assertUnprocessable()
            ->assertJsonPath('success', false);

        Mail::assertNothingSent();
        $this->assertDatabaseCount('login_otps', 0);
    }
}
