<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SystemSetting extends Model
{
    use HasFactory;

    public const KEY_MAX_ACTIVE_LOANS = 'MAX_ACTIVE_LOANS';
    public const KEY_LOAN_DAYS = 'LOAN_DAYS';
    public const KEY_FINE_PER_DAY = 'FINE_PER_DAY';
    public const KEY_HOLD_MINUTES = 'HOLD_MINUTES';
    public const KEY_ROOM_CANCEL_HOURS = 'ROOM_CANCEL_HOURS';
    public const KEY_MAX_UNPAID_PENALTY = 'MAX_UNPAID_PENALTY';

    /**
     * Danh sách các khóa cấu hình số nguyên/số thực bắt buộc >= 0 (W7 ui-design.md)
     */
    public const NUMERIC_SETTING_KEYS = [
        self::KEY_MAX_ACTIVE_LOANS,
        self::KEY_LOAN_DAYS,
        self::KEY_FINE_PER_DAY,
        self::KEY_HOLD_MINUTES,
        self::KEY_ROOM_CANCEL_HOURS,
        self::KEY_MAX_UNPAID_PENALTY,
    ];

    protected $table = 'system_settings';
    protected $primaryKey = 'setting_key';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'setting_key',
        'setting_value',
        'description',
        'updated_by',
        'updated_at',
    ];

    protected $casts = [
        'updated_at' => 'datetime',
    ];

    public function updatedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by', 'user_id');
    }
}
