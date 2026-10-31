<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ExportReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => ['nullable', 'string', 'in:usage,fines,all'],
            'format' => ['nullable', 'string', 'in:xlsx,csv,pdf'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ];
    }

    public function messages(): array
    {
        return [
            'type.in' => 'Loại báo cáo không hợp lệ (hỗ trợ: usage, fines, all).',
            'format.in' => 'Định dạng xuất không hợp lệ (hỗ trợ: xlsx, csv, pdf).',
            'end_date.after_or_equal' => 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.',
        ];
    }
}

