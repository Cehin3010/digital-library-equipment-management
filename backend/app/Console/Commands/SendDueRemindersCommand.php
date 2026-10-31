<?php

namespace App\Console\Commands;

use App\Models\Loan;
use App\Models\Notification;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SendDueRemindersCommand extends Command
{
    protected $signature = 'reminders:send-due';
    protected $description = 'Tự động quét và tạo thông báo nhắc hạn trả trước 3 ngày và 1 ngày';

    public function handle(): void
    {
        $loans = Loan::where('status', 'BORROWING')->get();

        foreach ($loans as $loan) {
            $dueDate = Carbon::parse($loan->due_date);
            $daysLeft = (int) ceil(now()->diffInDays($dueDate, false));

            if (in_array($daysLeft, [3, 1])) {
                Notification::create([
                    'user_id' => $loan->user_id,
                    'title' => 'Nhắc nhở hạn trả tài sản',
                    'message' => "Phiếu mượn #{$loan->id} của bạn sẽ hết hạn trong {$daysLeft} ngày tới. Vui lòng sắp xếp trả đúng hạn.",
                ]);
            }
        }

        $this->info('Hoàn tất quét thông báo nhắc hạn.');
    }
}