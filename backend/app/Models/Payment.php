<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'penalty_id',
        'user_id',
        'txn_ref',
        'provider',
        'amount',
        'status',
        'paid_at',
    ];

    public function penalty()
    {
        return $this->belongsTo(Penalty::class);
    }
}