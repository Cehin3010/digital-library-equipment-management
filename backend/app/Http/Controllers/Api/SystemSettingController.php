<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SystemSettingController extends Controller
{
    private const ALLOWED_SETTINGS = [
        'MAX_ACTIVE_LOANS',
        'FINE_PER_DAY',
        'HOLD_MINUTES',
        'ROOM_CANCEL_HOURS',
        'DAMAGE_FINE',
        'LOST_FINE',
    ];

    public function index(): JsonResponse
    {
        $settings = SystemSetting::query()
            ->whereIn('setting_key', self::ALLOWED_SETTINGS)
            ->pluck('setting_value', 'setting_key');

        return $this->successResponse(['settings' => $settings], 'Danh sách tham số hệ thống');
    }

    public function update(Request $request): JsonResponse
    {
        $rules = [];
        foreach (self::ALLOWED_SETTINGS as $key) {
            $rules[$key] = ['sometimes', 'required', 'integer', 'min:0'];
        }
        $data = $request->validate($rules);
        if ($data === []) {
            return $this->errorResponse('Không có tham số hợp lệ để cập nhật.', null, 422);
        }

        DB::transaction(function () use ($data, $request) {
            $before = SystemSetting::query()->whereIn('setting_key', array_keys($data))
                ->pluck('setting_value', 'setting_key')->all();
            foreach ($data as $key => $value) {
                SystemSetting::updateOrCreate(
                    ['setting_key' => $key],
                    ['setting_value' => (string) $value, 'updated_by' => $request->user()->user_id],
                );
            }
            AuditLog::create([
                'user_id' => $request->user()->user_id,
                'action' => 'UPDATE_SYSTEM_SETTINGS',
                'entity_type' => 'system_settings',
                'details' => ['before' => $before, 'after' => $data],
                'ip_address' => $request->ip(),
                'created_at' => now(),
            ]);
        });

        return $this->successResponse(['settings' => $data], 'Cập nhật tham số hệ thống thành công');
    }
}
