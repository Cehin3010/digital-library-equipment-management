<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Resource;
use Illuminate\Support\Facades\Log;
use Throwable;

class AuditService
{
    /**
     * Ghi nhận thao tác kiểm toán vào bảng audit_logs (F-12)
     */
    public static function log(?int $userId, string $action, string $entityType, ?int $entityId = null, array $details = [], ?string $ipAddress = null): ?AuditLog
    {
        try {
            return AuditLog::create([
                'user_id' => $userId,
                'action' => $action,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'details' => $details,
                'ip_address' => $ipAddress ?: request()?->ip(),
                'created_at' => now(),
            ]);
        } catch (Throwable $e) {
            Log::warning('Không thể ghi audit_log: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Ghi nhận lượt đọc tài liệu số trực tuyến (Phục vụ F-02 & F-09)
     */
    public static function logReading(?int $userId, Resource $resource, ?string $ipAddress = null): ?AuditLog
    {
        return self::log(
            userId: $userId,
            action: 'READ_DIGITAL_ASSET',
            entityType: 'resources',
            entityId: $resource->resource_id,
            details: [
                'title' => $resource->title,
                'code' => $resource->code,
                'file_url' => $resource->file_url,
                'timestamp' => now()->toIso8601String(),
            ],
            ipAddress: $ipAddress
        );
    }
}
