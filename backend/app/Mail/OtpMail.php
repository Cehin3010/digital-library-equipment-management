<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $fullName,
        public string $otpCode,
        public int $expireMinutes = 5,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '[Thư viện số Đại học] Mã xác thực đăng nhập OTP của bạn',
        );
    }

    public function content(): Content
    {
        $html = <<<HTML
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
            <h2 style="color: #1d4ed8; margin-top: 0;">Hệ thống Thư viện Số & Cho mượn Tài sản Đại học</h2>
            <p>Xin chào <strong>{$this->fullName}</strong>,</p>
            <p>Bạn vừa yêu cầu mã xác thực một lần (OTP) để đăng nhập vào hệ thống Thư viện số. Mã xác thực của bạn là:</p>
            <div style="margin: 24px 0; padding: 16px; background-color: #eff6ff; border-radius: 8px; text-align: center;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e40af;">{$this->otpCode}</span>
            </div>
            <p style="color: #4b5563; font-size: 14px;">
                • Mã này có hiệu lực trong vòng <strong>{$this->expireMinutes} phút</strong>.<br>
                • Tuyệt đối không chia sẻ mã này cho bất kỳ ai.<br>
                • Nếu bạn nhập sai quá 5 lần, mã sẽ tự động bị hủy hiệu lực.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0;">Email được gửi tự động từ Hệ thống Thư viện Số Đại học.</p>
        </div>
        HTML;

        return new Content(
            htmlString: $html,
        );
    }
}
