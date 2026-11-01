<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class StudentAccountSeeder extends Seeder
{
    public function run(): void
    {
        $studentRole = Role::query()->where('role_name', 'STUDENT')->firstOrFail();
        $students = [
            ['full_name' => 'Lý Hạo Danh', 'user_code' => '52400175'],
            ['full_name' => 'Nguyễn Anh Khoa', 'user_code' => '52400051'],
            ['full_name' => 'Trần Minh Chiến', 'user_code' => '52400103'],
            ['full_name' => 'Hồ Thịnh Phát', 'user_code' => '51900821'],
        ];

        foreach ($students as $student) {
            User::firstOrCreate(
                ['user_code' => $student['user_code']],
                [
                    ...$student,
                    'email' => $student['user_code'] . '@student.tdtu.edu.vn',
                    'role_id' => $studentRole->role_id,
                    'status' => User::STATUS_ACTIVE,
                ],
            );
        }
    }
}
