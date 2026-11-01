<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            'STUDENT' => 'Sinh viên',
            'LECTURER' => 'Giảng viên',
            'LIBRARIAN' => 'Thủ thư',
            'ADMIN' => 'Quản trị viên',
        ] as $roleName => $description) {
            Role::firstOrCreate(['role_name' => $roleName], ['description' => $description]);
        }

        $bootstrapEmail = strtolower(trim((string) config('services.bootstrap_admin.email')));
        $adminRole = Role::query()->where('role_name', 'ADMIN')->firstOrFail();
        User::firstOrCreate(
            ['email' => $bootstrapEmail],
            [
                'full_name' => 'Quản trị viên hệ thống',
                'user_code' => config('services.bootstrap_admin.code'),
                'role_id' => $adminRole->role_id,
                'status' => User::STATUS_ACTIVE,
            ],
        );

        foreach ([
            'MAX_ACTIVE_LOANS' => '5',
            'FINE_PER_DAY' => '5000',
            'HOLD_MINUTES' => '10',
            'ROOM_CANCEL_HOURS' => '2',
            'DAMAGE_FINE' => '50000',
            'LOST_FINE' => '100000',
        ] as $key => $value) {
            SystemSetting::firstOrCreate(['setting_key' => $key], ['setting_value' => $value]);
        }

        $this->call([
            CategoryResourceSeeder::class,
            StudentAccountSeeder::class,
        ]);
    }
}
