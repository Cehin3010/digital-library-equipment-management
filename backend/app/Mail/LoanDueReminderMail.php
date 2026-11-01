<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LoanDueReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $fullName,
        public string $resourceTitle,
        public string $dueDate,
        public int $daysRemaining,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Nhắc hạn trả tài sản thư viện');
    }

    public function content(): Content
    {
        return new Content(
            htmlString: '<p>Xin chào <strong>' . e($this->fullName) . '</strong>,</p>'
                . '<p>Tài nguyên <strong>' . e($this->resourceTitle) . '</strong> cần được trả vào ngày '
                . e($this->dueDate) . ' (còn ' . $this->daysRemaining . ' ngày).</p>'
                . '<p>Vui lòng liên hệ thư viện nếu bạn đã hoàn tất việc trả tài sản.</p>',
        );
    }
}
