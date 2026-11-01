<?php

namespace App\Http\Requests;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('id');

        return [
            'full_name' => ['sometimes', 'required', 'string', 'max:100'],
            'user_code' => [
                'sometimes',
                'required',
                'string',
                'max:20',
                Rule::unique('users', 'user_code')->ignore($userId, 'user_id'),
            ],
            'phone' => ['nullable', 'string', 'max:20'],
            'role_id' => ['sometimes', 'required', 'integer', 'exists:roles,role_id'],
            'role_name' => ['sometimes', 'required', 'string', Rule::in(Role::VALID_ROLES)],
            'status' => ['sometimes', 'required', 'string', Rule::in([User::STATUS_ACTIVE, User::STATUS_LOCKED])],
        ];
    }

    public function messages(): array
    {
        return [
            'full_name.required' => 'Họ và tên không được để trống.',
            'user_code.unique' => 'Mã số người dùng đã tồn tại.',
            'role_id.exists' => 'Vai trò được chọn không tồn tại.',
            'role_name.in' => 'Tên vai trò phải là một trong: STUDENT, LECTURER, LIBRARIAN, ADMIN.',
            'status.in' => 'Trạng thái tài khoản chỉ nhận giá trị ACTIVE hoặc LOCKED.',
        ];
    }
}
