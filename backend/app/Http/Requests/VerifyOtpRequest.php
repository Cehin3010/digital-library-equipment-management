<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class VerifyOtpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email', 'max:100'],
            'otp' => ['required', 'string', 'regex:/^\d{6}$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'Vui lòng nhập địa chỉ email.',
            'email.email' => 'Định dạng địa chỉ email không hợp lệ.',
            'otp.required' => 'Vui lòng nhập mã xác thực OTP.',
            'otp.regex' => 'Mã OTP phải gồm đúng 6 chữ số.',
        ];
    }
}
