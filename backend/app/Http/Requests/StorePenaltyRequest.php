<?php

namespace App\Http/Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePenaltyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'loan_id' => 'required|exists:loans,id',
            'user_id' => 'required|exists:users,id',
            'reason' => 'required|string|max:255',
            'overdue_days' => 'integer|min:0',
            'amount' => 'required|numeric|min:1000',
        ];
    }
}