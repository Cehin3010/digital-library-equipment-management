<?php

namespace Database\Seeders;

use App\Models\Loan;
use App\Models\Notification;
use App\Models\Penalty;
use App\Models\Resource;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Tạo tài khoản mẫu
        $student = User::create([
            'name' => 'Hồ Thịnh Phát',
            'email' => 'phat.ht@university.edu.vn',
            'password' => Hash::make('123456'),
            'status' => 'ACTIVE',
        ]);

        // 2. Tạo tài sản mẫu
        $resource = Resource::create([
            'code' => 'DEV-LAPTOP-001',
            'title' => 'Máy chiếu Panasonic PT-LB300',
            'resource_type' => 'EQUIPMENT',
            'status' => 'ACTIVE',
            'total_quantity' => 5,
            'available_quantity' => 4,
        ]);

        // 3. Tạo phiếu mượn trễ hạn
        $loan = Loan::create([
            'user_id' => $student->id,
            'resource_id' => $resource->id,
            'status' => 'BORROWING',
            'borrow_from' => now()->subDays(10),
            'due_date' => now()->subDays(3),
        ]);

        // 4. Tạo phiếu phạt mẫu
        Penalty::create([
            'loan_id' => $loan->id,
            'user_id' => $student->id,
            'reason' => 'Trả trễ 3 ngày',
            'overdue_days' => 3,
            'amount' => 15000,
            'status' => 'UNPAID',
        ]);

        // 5. Tạo thông báo mẫu
        Notification::create([
            'user_id' => $student->id,
            'title' => 'Cảnh báo công nợ',
            'message' => 'Bạn có phiếu phạt 15,000 VND chưa thanh toán.',
            'is_read' => false,
        ]);
    }
}