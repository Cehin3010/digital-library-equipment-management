<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoginOtp extends Model
{
    use HasFactory;

    public const MAX_ATTEMPTS = 5;
    public const EXPIRE_MINUTES = 5;
    public const RESEND_COOLDOWN_SECONDS = 60;

    protected $table = 'login_otps';
    protected $primaryKey = 'otp_id';
    public $timestamps = false;

    protected $fillable = [
        'email',
        'otp_hash',
        'attempts',
        'expires_at',
        'created_at',
    ];

    protected $hidden = [
        'otp_hash',
    ];

    protected $casts = [
        'attempts' => 'integer',
        'expires_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function hasExceededMaxAttempts(): bool
    {
        return $this->attempts >= self::MAX_ATTEMPTS;
    }
}
