<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Loan extends Model
{
    use HasFactory;

    protected $table = 'loans';
    protected $primaryKey = 'loan_id';
    public $timestamps = false;

    protected $fillable = [
        'qr_token',
        'user_id',
        'resource_id',
        'status', // HOLDING, PENDING, BORROWING, RETURNED, REJECTED, CANCELLED, EXPIRED
        'borrow_from',
        'due_date',
        'requested_at',
        'hold_expires_at',
        'approved_by',
        'approved_at',
        'received_by',
        'returned_at',
        'return_condition',
        'reject_reason',
    ];

    protected $casts = [
        'borrow_from' => 'datetime',
        'due_date' => 'datetime',
        'requested_at' => 'datetime',
        'hold_expires_at' => 'datetime',
        'approved_at' => 'datetime',
        'returned_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function resource(): BelongsTo
    {
        return $this->belongsTo(Resource::class, 'resource_id', 'resource_id');
    }

    public function penalties(): HasMany
    {
        return $this->hasMany(Penalty::class, 'loan_id', 'loan_id');
    }
}

