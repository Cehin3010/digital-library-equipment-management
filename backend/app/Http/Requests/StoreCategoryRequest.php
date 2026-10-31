<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_name' => ['required', 'string', 'max:100'],
            'parent_id' => ['nullable', 'integer', 'exists:categories,category_id'],
        ];
    }

    public function messages(): array
    {
        return [
            'category_name.required' => 'Tên danh mục không được để trống.',
            'category_name.max' => 'Tên danh mục không được vượt quá 100 ký tự.',
            'parent_id.exists' => 'Danh mục cha không tồn tại trong hệ thống.',
        ];
    }
}
