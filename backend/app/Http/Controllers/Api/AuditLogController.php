<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $logs = AuditLog::query()
            ->with('user:user_id,full_name,email,user_code')
            ->when($request->filled('action'), fn ($query) => $query->where('action', $request->input('action')))
            ->when($request->filled('entity_type'), fn ($query) => $query->where('entity_type', $request->input('entity_type')))
            ->orderByDesc('created_at')
            ->paginate(min(max($request->integer('per_page', 30), 1), 100));

        return $this->successResponse($logs, 'Danh sách nhật ký kiểm toán');
    }
}
