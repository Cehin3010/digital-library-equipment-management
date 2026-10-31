<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Penalty extends Model
{
    use HasFactory;

    protected $table = 'penalties';
    protected $primaryKey = 'penalty_id';
    public $timestamps = false;

    protected $fillable = [
        'loan_id',
        'user_id',
        'penalty_type', // OVERDUE, DAMAGED, LOST
        'overdue_days',
        'amount',
        'status', // UNPAID, PAID
        'note',
        'created_by',
        'created_at',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:0',
        'created_at' => 'datetime',
        'paid_at' => 'datetime',
    ];

    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class, 'loan_id', 'loan_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}

