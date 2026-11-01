<?php

namespace App\Console\Commands;

use App\Mail\LoanDueReminderMail;
use App\Models\LibraryNotification;
use App\Models\Loan;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendLoanDueReminders extends Command
{
    protected $signature = 'loans:send-due-reminders';

    protected $description = 'Send email and in-app reminders three days and one day before loan due dates';

    public function handle(): int
    {
        $failures = 0;

        foreach ([3, 1] as $daysRemaining) {
            $dueDate = now()->addDays($daysRemaining)->toDateString();
            $loans = Loan::query()
                ->with(['user', 'resource'])
                ->where('status', 'BORROWING')
                ->whereDate('due_date', $dueDate)
                ->get();

            foreach ($loans as $loan) {
                $type = "LOAN_DUE_{$daysRemaining}_DAYS";
                $notification = LibraryNotification::firstOrCreate(
                    [
                        'user_id' => $loan->user_id,
                        'type' => $type,
                        'related_type' => 'loan',
                        'related_id' => $loan->loan_id,
                    ],
                    [
                        'title' => 'Sắp đến hạn trả tài sản',
                        'message' => "Tài nguyên {$loan->resource->title} cần được trả trong {$daysRemaining} ngày.",
                        'created_at' => now(),
                    ],
                );

                if (! $notification->wasRecentlyCreated) {
                    continue;
                }

                try {
                    Mail::to($loan->user->email)->send(new LoanDueReminderMail(
                        fullName: $loan->user->full_name,
                        resourceTitle: $loan->resource->title,
                        dueDate: $loan->due_date->format('d/m/Y'),
                        daysRemaining: $daysRemaining,
                    ));
                    $this->info("Reminder sent for loan {$loan->loan_id} ({$daysRemaining} days).");
                } catch (Throwable $exception) {
                    $notification->delete();
                    $this->error("Reminder failed for loan {$loan->loan_id}: {$exception->getMessage()}");
                    $failures++;
                }
            }
        }

        return $failures === 0 ? self::SUCCESS : self::FAILURE;
    }
}
