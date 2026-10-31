<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreResourceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['required', 'integer', 'exists:categories,category_id'],
            'resource_type' => ['required', 'string', 'in:DIGITAL,BOOK,EQUIPMENT,ROOM'],
            'title' => ['required', 'string', 'max:255'],
            'author_or_brand' => ['nullable', 'string', 'max:150'],
            'code' => ['required', 'string', 'max:50', 'unique:resources,code'],
            'file' => ['nullable', 'file', 'mimes:pdf,epub', 'max:51200'], // Tối đa 50MB
            'file_url' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:100'],
            'total_quantity' => ['required', 'integer', 'min:0'],
            'available_quantity' => ['required', 'integer', 'min:0', 'lte:total_quantity'],
            'status' => ['nullable', 'string', 'in:ACTIVE,MAINTENANCE,INACTIVE'],
        ];
    }

    public function messages(): array
    {
        return [
            'category_id.required' => 'Danh mục phân loại là bắt buộc.',
            'category_id.exists' => 'Danh mục đã chọn không tồn tại.',
            'resource_type.required' => 'Loại tài nguyên là bắt buộc.',
            'resource_type.in' => 'Loại tài nguyên phải là DIGITAL, BOOK, EQUIPMENT hoặc ROOM.',
            'title.required' => 'Tiêu đề/Tên tài nguyên không được để trống.',
            'code.required' => 'Mã ISBN/Serial/Mã phòng là bắt buộc.',
            'code.unique' => 'Mã tài nguyên này đã tồn tại trong hệ thống.',
            'file.mimes' => 'Tệp tải lên phải có định dạng PDF hoặc EPUB.',
            'file.max' => 'Dung lượng tệp tài liệu số không được vượt quá 50MB.',
            'total_quantity.required' => 'Tổng số lượng là bắt buộc.',
            'total_quantity.min' => 'Tổng số lượng không được âm.',
            'available_quantity.required' => 'Số lượng khả dụng là bắt buộc.',
            'available_quantity.min' => 'Số lượng khả dụng không được âm.',
            'available_quantity.lte' => 'Số lượng khả dụng không được lớn hơn tổng số lượng.',
        ];
    }
}
