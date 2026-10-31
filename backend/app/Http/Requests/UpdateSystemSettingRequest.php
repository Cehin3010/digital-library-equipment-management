<?php

namespace App\Http\Requests;

use App\Models\SystemSetting;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateSystemSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'settings' => ['required_without:setting_key', 'array', 'min:1'],
            'setting_key' => ['required_without:settings', 'string', 'max:50'],
            'setting_value' => ['required_with:setting_key'],
            'description' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $normalized = $this->normalizedSettings();

            if (empty($normalized)) {
                $validator->errors()->add('settings', 'Dữ liệu cấu hình tham số không được để trống.');
                return;
            }

            foreach ($normalized as $index => $item) {
                $key = strtoupper(trim((string) ($item['setting_key'] ?? '')));
                $val = $item['setting_value'] ?? null;

                if ($key === '') {
                    $validator->errors()->add("settings.{$index}.setting_key", 'Khóa cấu hình (setting_key) không hợp lệ.');
                    continue;
                }

                if ($val === null || trim((string) $val) === '') {
                    $validator->errors()->add("settings.{$key}", "Giá trị của tham số {$key} không được để trống.");
                    continue;
                }

                if (in_array($key, SystemSetting::NUMERIC_SETTING_KEYS, true)) {
                    if (! is_numeric($val)) {
                        $validator->errors()->add("settings.{$key}", "Tham số {$key} bắt buộc phải là kiểu số hợp lệ.");
                        continue;
                    }

                    $numValue = (float) $val;
                    if ($numValue < 0) {
                        $validator->errors()->add("settings.{$key}", "Tham số {$key} không được nhận giá trị âm.");
                        continue;
                    }

                    $strictPositiveIntKeys = [
                        SystemSetting::KEY_MAX_ACTIVE_LOANS,
                        SystemSetting::KEY_LOAN_DAYS,
                        SystemSetting::KEY_HOLD_MINUTES,
                        SystemSetting::KEY_ROOM_CANCEL_HOURS,
                    ];

                    if (in_array($key, $strictPositiveIntKeys, true) && ($numValue < 1 || floor($numValue) != $numValue)) {
                        $validator->errors()->add("settings.{$key}", "Tham số {$key} phải là số nguyên dương lớn hơn hoặc bằng 1.");
                    }
                }
            }
        });
    }

    /**
     * Chuẩn hóa dữ liệu cấu hình từ nhiều định dạng payload về mảng thống nhất:
     * [['setting_key' => ..., 'setting_value' => ..., 'description' => ...], ...]
     */
    public function normalizedSettings(): array
    {
        if ($this->filled('setting_key')) {
            return [[
                'setting_key' => strtoupper(trim((string) $this->input('setting_key'))),
                'setting_value' => (string) $this->input('setting_value'),
                'description' => $this->input('description'),
            ]];
        }

        $settings = $this->input('settings', []);
        if (! is_array($settings)) {
            return [];
        }

        $result = [];
        foreach ($settings as $k => $v) {
            if (is_array($v) && array_key_exists('setting_key', $v)) {
                $result[] = [
                    'setting_key' => strtoupper(trim((string) $v['setting_key'])),
                    'setting_value' => isset($v['setting_value']) ? (string) $v['setting_value'] : '',
                    'description' => $v['description'] ?? null,
                ];
            } elseif (is_string($k)) {
                $result[] = [
                    'setting_key' => strtoupper(trim($k)),
                    'setting_value' => is_scalar($v) ? (string) $v : '',
                    'description' => null,
                ];
            }
        }

        return $result;
    }

    public function messages(): array
    {
        return [
            'settings.required_without' => 'Vui lòng cung cấp danh sách tham số cấu hình cần cập nhật.',
            'settings.array' => 'Danh sách tham số cấu hình phải ở dạng mảng hoặc đối tượng.',
            'setting_key.required_without' => 'Vui lòng chỉ định khóa cấu hình (setting_key).',
            'setting_value.required_with' => 'Vui lòng cung cấp giá trị cấu hình (setting_value).',
        ];
    }
}
