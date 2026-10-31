<?php

namespace App\Http\Requests;

use App\Models\Role;
use App\Models\User;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
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
                'unique:users,email',
                function (string $attribute, mixed $value, Closure $fail): void {
                    $domainsRaw = env('UNIVERSITY_EMAIL_DOMAINS', 'university.edu.vn,tdtu.edu.vn,student.tdtu.edu.vn');
                    $allowedDomains = array_filter(array_map('trim', explode(',', strtolower($domainsRaw))));

                    $emailParts = explode('@', strtolower((string) $value));
                    $domain = $emailParts[1] ?? '';

                    if (! empty($allowedDomains) && ! in_array($domain, $allowedDomains, true)) {
                        $fail('Email phải thuộc tên miền nhà trường (' . implode(', ', $allowedDomains) . ').');
                    }
                },
            ],
            'full_name' => ['required', 'string', 'max:100'],
            'user_code' => ['required', 'string', 'max:20', 'unique:users,user_code'],
            'phone' => ['nullable', 'string', 'max:20'],
            'role_id' => ['required_without:role_name', 'nullable', 'integer', 'exists:roles,role_id'],
            'role_name' => ['required_without:role_id', 'nullable', 'string', Rule::in(Role::VALID_ROLES)],
            'status' => ['nullable', 'string', Rule::in([User::STATUS_ACTIVE, User::STATUS_LOCKED])],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'Vui lòng nhập email nhà trường.',
            'email.email' => 'Định dạng email không hợp lệ.',
            'email.unique' => 'Email này đã tồn tại trong hệ thống.',
            'full_name.required' => 'Vui lòng nhập họ và tên đầy đủ.',
            'user_code.required' => 'Vui lòng nhập mã số (MSSV / Mã GV / Mã CB).',
            'user_code.unique' => 'Mã số người dùng này đã tồn tại.',
            'role_id.required_without' => 'Vui lòng chọn vai trò cho tài khoản.',
            'role_id.exists' => 'Vai trò được chọn không tồn tại.',
            'role_name.in' => 'Tên vai trò phải là một trong: STUDENT, LECTURER, LIBRARIAN, ADMIN.',
            'status.in' => 'Trạng thái tài khoản chỉ nhận giá trị ACTIVE hoặc LOCKED.',
        ];
    }
}
