<?php

namespace App\Services;

use App\Models\Penalty;

class FineService
{
    public function handleReturnPenalty($loan, string $condition = 'GOOD'): ?Penalty
    {
        $dueDate = \Carbon\Carbon::parse($loan->due_date);
        $returnedAt = \Carbon\Carbon::now();
        $overdueDays = max(0, $returnedAt->diffInDays($dueDate, false) * -1);

        $finePerDay = (float) config('settings.FINE_PER_DAY', 5000);
        $amount = $overdueDays * $finePerDay;

        if ($condition === 'DAMAGED') {
            $amount += 50000;
        } elseif ($condition === 'LOST') {
            $amount += 200000;
        }

        if ($amount <= 0) {
            return null;
        }

        return Penalty::create([
            'loan_id' => $loan->id,
            'user_id' => $loan->user_id,
            'reason' => $overdueDays > 0 ? "Trả trễ {$overdueDays} ngày" : "Hư hỏng/Mất tài sản",
            'overdue_days' => $overdueDays,
            'amount' => $amount,
            'status' => 'UNPAID',
        ]);
    }
}