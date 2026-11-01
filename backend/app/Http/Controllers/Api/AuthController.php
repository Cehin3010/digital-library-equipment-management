<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RequestOtpRequest;
use App\Http\Requests\VerifyOtpRequest;
use App\Mail\OtpMail;
use App\Models\AuditLog;
use App\Models\LoginOtp;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Throwable;

class AuthController extends Controller
{
    public function requestLoginOtp(RequestOtpRequest $request): JsonResponse
    {
        $email = Str::lower(trim($request->validated('email')));
        $user = User::query()->with('role')->where('email', $email)->first();

        if (! $user || $user->status !== User::STATUS_ACTIVE) {
            return $this->errorResponse('Email chưa được đăng ký hoặc tài khoản đang bị khóa.', null, 422);
        }

        $latestOtp = LoginOtp::query()->where('email', $email)->latest('created_at')->first();
        if ($latestOtp && $latestOtp->created_at->diffInSeconds(now()) < LoginOtp::RESEND_COOLDOWN_SECONDS) {
            $wait = max(1, (int) ceil(LoginOtp::RESEND_COOLDOWN_SECONDS - $latestOtp->created_at->diffInSeconds(now())));
            return $this->errorResponse(
                "Mã OTP vừa được gửi. Vui lòng đợi {$wait} giây trước khi gửi lại.",
                ['resend_after_seconds' => $wait],
                429,
            );
        }

        $otpCode = (string) random_int(100000, 999999);
        LoginOtp::query()->where('email', $email)->delete();
        LoginOtp::create([
            'email' => $email,
            'otp_hash' => Hash::make($otpCode),
            'attempts' => 0,
            'expires_at' => now()->addMinutes(LoginOtp::EXPIRE_MINUTES),
            'created_at' => now(),
        ]);

        try {
            Mail::to($email)->queue(new OtpMail(
                fullName: $user->full_name,
                otpCode: $otpCode,
                expireMinutes: LoginOtp::EXPIRE_MINUTES,
            ));
        } catch (Throwable $exception) {
            LoginOtp::query()->where('email', $email)->delete();
            Log::error('Không gửi được email OTP.', [
                'email' => $email,
                'exception' => $exception->getMessage(),
            ]);

            return $this->errorResponse('Không gửi được email OTP. Vui lòng kiểm tra cấu hình SMTP hoặc thử lại sau.', null, 503);
        }

        return $this->successResponse([
            'email' => $email,
            'expires_in_seconds' => LoginOtp::EXPIRE_MINUTES * 60,
            'resend_after_seconds' => LoginOtp::RESEND_COOLDOWN_SECONDS,
        ], 'Mã OTP đã được gửi đến email trường');
    }

    public function verifyLoginOtp(VerifyOtpRequest $request): JsonResponse
    {
        $data = $request->validated();
        $email = Str::lower(trim($data['email']));

        $result = DB::transaction(function () use ($email, $data) {
            $otp = LoginOtp::query()
                ->where('email', $email)
                ->lockForUpdate()
                ->first();

            if (! $otp) {
                return ['error' => 'Không tìm thấy mã OTP. Hãy yêu cầu gửi mã mới.'];
            }

            if ($otp->isExpired()) {
                $otp->delete();
                return ['error' => 'Mã OTP đã hết hạn. Hãy yêu cầu gửi mã mới.'];
            }

            if ($otp->hasExceededMaxAttempts()) {
                $otp->delete();
                return ['error' => 'Bạn đã nhập sai quá số lần cho phép. Hãy yêu cầu gửi mã mới.'];
            }

            if (! Hash::check($data['otp'], $otp->otp_hash)) {
                $otp->increment('attempts');
                return ['error' => 'Mã OTP không chính xác.'];
            }

            $user = User::query()->with('role')->where('email', $email)->first();
            if (! $user || $user->status !== User::STATUS_ACTIVE) {
                $otp->delete();
                return ['error' => 'Tài khoản không tồn tại hoặc đang bị khóa.'];
            }

            $otp->delete();
            $user->forceFill(['last_login_at' => now()])->save();
            $token = $user->createToken('web-session')->plainTextToken;
            AuditLog::create([
                'user_id' => $user->user_id,
                'action' => 'LOGIN',
                'entity_type' => 'users',
                'entity_id' => $user->user_id,
                'details' => ['email' => $email],
                'ip_address' => request()->ip(),
                'created_at' => now(),
            ]);

            return ['token' => $token, 'user' => $user];
        });

        if (isset($result['error'])) {
            return $this->errorResponse($result['error'], null, 422);
        }

        return $this->successResponse([
            'token' => $result['token'],
            'user' => $result['user'],
        ], 'Đăng nhập thành công');
    }

    public function me(\Illuminate\Http\Request $request): JsonResponse
    {
        return $this->successResponse($request->user()->load('role'), 'Lấy thông tin người dùng hiện tại');
    }

    public function logout(\Illuminate\Http\Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();
        return $this->successResponse(null, 'Đăng xuất thành công');
    }
}
