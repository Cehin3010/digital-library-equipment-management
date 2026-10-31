<?php

namespace App\Http\Requests;

use Closure;
use Illuminate\Foundation\Http\FormRequest;

class RequestOtpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => [
                'required',
                'string',
                'email',
                'max:100',
                function (string $attribute, mixed $value, Closure $fail): void {
                    $domainsRaw = env('UNIVERSITY_EMAIL_DOMAINS', 'university.edu.vn,tdtu.edu.vn,student.tdtu.edu.vn');
                    $allowedDomains = array_filter(array_map('trim', explode(',', strtolower($domainsRaw))));

                    $emailParts = explode('@', strtolower((string) $value));
                    $domain = $emailParts[1] ?? '';

                    if (! empty($allowedDomains) && ! in_array($domain, $allowedDomains, true)) {
                        $fail('Email phải thuộc tên miền nhà trường (' . implode(', ', $allowedDomains) . ') theo quy định BR08.');
                    }
                },
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'Vui lòng nhập địa chỉ email nhà trường.',
            'email.email' => 'Định dạng địa chỉ email không hợp lệ.',
            'email.max' => 'Địa chỉ email không được vượt quá 100 ký tự.',
        ];
    }
}
