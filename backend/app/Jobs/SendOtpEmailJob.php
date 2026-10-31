<?php

namespace App\Jobs;

use App\Mail\OtpMail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendOtpEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Số lần thử lại tối đa nếu dịch vụ SMTP tạm thời gián đoạn
     */
    public int $tries = 3;

    public function __construct(
        public string $email,
        public string $fullName,
        public string $otpCode,
        public int $expireMinutes = 5,
    ) {}

    /**
     * Thực thi gửi email OTP qua Mailpit (Dev) hoặc Gmail SMTP (Prod)
     */
    public function handle(): void
    {
        Mail::to($this->email)->send(
            new OtpMail(
                fullName: $this->fullName,
                otpCode: $this->otpCode,
                expireMinutes: $this->expireMinutes,
            )
        );
    }
}
