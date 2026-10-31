<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateResourceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $resourceId = $this->route('id');

        return [
            'category_id' => ['sometimes', 'required', 'integer', 'exists:categories,category_id'],
            'resource_type' => ['sometimes', 'required', 'string', 'in:DIGITAL,BOOK,EQUIPMENT,ROOM'],
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'author_or_brand' => ['nullable', 'string', 'max:150'],
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('resources', 'code')->ignore($resourceId, 'resource_id'),
            ],
            'file' => ['nullable', 'file', 'mimes:pdf,epub', 'max:51200'],
            'file_url' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:100'],
            'total_quantity' => ['sometimes', 'required', 'integer', 'min:0'],
            'available_quantity' => ['sometimes', 'required', 'integer', 'min:0', 'lte:total_quantity'],
            'status' => ['nullable', 'string', 'in:ACTIVE,MAINTENANCE,INACTIVE'],
        ];
    }

    public function messages(): array
    {
        return [
            'category_id.exists' => 'Danh mục đã chọn không tồn tại.',
            'code.unique' => 'Mã tài nguyên này đã tồn tại ở bản ghi khác.',
            'file.mimes' => 'Tệp tải lên phải có định dạng PDF hoặc EPUB.',
            'total_quantity.min' => 'Tổng số lượng không được âm.',
            'available_quantity.min' => 'Số lượng khả dụng không được âm.',
            'available_quantity.lte' => 'Số lượng khả dụng không được lớn hơn tổng số lượng.',
        ];
    }
}

