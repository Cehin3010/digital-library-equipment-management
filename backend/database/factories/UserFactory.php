<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'email' => fake()->unique()->userName() . '@university.edu.vn',
            'full_name' => fake()->name(),
            'user_code' => 'US' . fake()->unique()->numerify('######'),
            'phone' => fake()->phoneNumber(),
            'role_id' => 1,
            'status' => 'ACTIVE',
            'last_login_at' => now(),
        ];
    }
}
