<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $table = 'payments';
    protected $primaryKey = 'payment_id';
    public $timestamps = false;

    protected $fillable = [
        'penalty_id',
        'user_id',
        'provider',
        'txn_ref',
        'amount',
        'status',
        'provider_transaction_id',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'amount' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function penalty(): BelongsTo
    {
        return $this->belongsTo(Penalty::class, 'penalty_id', 'penalty_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}
