<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'users';
    protected $primaryKey = 'user_id';

    protected $fillable = [
        'email',
        'full_name',
        'user_code',
        'phone',
        'role_id',
        'status',
        'last_login_at',
    ];

    protected $casts = [
        'last_login_at' => 'datetime',
    ];

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id', 'role_id');
    }

    public function loans(): HasMany
    {
        return $this->hasMany(Loan::class, 'user_id', 'user_id');
    }

    public function penalties(): HasMany
    {
        return $this->hasMany(Penalty::class, 'user_id', 'user_id');
    }

    public function hasRole(string ...$roles): bool
    {
        $currentRole = $this->role?->role_name;
        return in_array($currentRole, $roles, true);
    }
}

