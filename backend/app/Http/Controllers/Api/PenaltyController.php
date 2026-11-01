<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\LibraryNotification;
use App\Models\Loan;
use App\Models\Penalty;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PenaltyController extends Controller
{
    public function myLoans(Request $request): JsonResponse
    {
        $loans = Loan::query()
            ->with(['resource', 'penalties'])
            ->where('user_id', $request->user()->user_id)
            ->latest('requested_at')
            ->paginate(min($request->integer('per_page', 20), 100));

        return $this->successResponse($loans, 'Lịch sử mượn trả cá nhân');
    }

    public function myPenalties(Request $request): JsonResponse
    {
        $penalties = Penalty::query()
            ->with(['loan.resource', 'roomBooking.resource'])
            ->where('user_id', $request->user()->user_id)
            ->latest('created_at')
            ->paginate(min($request->integer('per_page', 20), 100));

        return $this->successResponse($penalties, 'Danh sách công nợ phạt cá nhân');
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'loan_id' => ['nullable', 'integer', Rule::exists('loans', 'loan_id')],
            'user_id' => ['required', 'integer', Rule::exists('users', 'user_id')],
            'penalty_type' => ['required', Rule::in(['OVERDUE', 'DAMAGED', 'LOST', 'RENTAL', 'ROOM_BOOKING'])],
            'overdue_days' => ['nullable', 'integer', 'min:0'],
            'amount' => ['required', 'integer', 'min:1'],
            'note' => ['nullable', 'string', 'max:2000'],
        ]);

        $penalty = DB::transaction(function () use ($data, $request) {
            if (! empty($data['loan_id'])) {
                $loan = Loan::query()->lockForUpdate()->findOrFail($data['loan_id']);
                abort_unless((int) $loan->user_id === (int) $data['user_id'], 422, 'Phiếu mượn không thuộc tài khoản đã chọn.');
            }

            $penalty = Penalty::create([
                ...$data,
                'status' => 'UNPAID',
                'created_by' => $request->user()->user_id,
                'created_at' => now(),
            ]);

            LibraryNotification::create([
                'user_id' => $penalty->user_id,
                'type' => 'PENALTY_CREATED',
                'title' => 'Phát sinh khoản phạt',
                'message' => 'Thư viện đã ghi nhận khoản phạt ' . number_format($penalty->amount, 0, ',', '.') . ' VNĐ.',
                'related_type' => 'penalty',
                'related_id' => $penalty->penalty_id,
                'created_at' => now(),
            ]);

            AuditLog::create([
                'user_id' => $request->user()->user_id,
                'action' => 'CREATE_PENALTY',
                'entity_type' => 'penalties',
                'entity_id' => $penalty->penalty_id,
                'details' => ['amount' => $penalty->amount, 'penalty_type' => $penalty->penalty_type],
                'ip_address' => $request->ip(),
                'created_at' => now(),
            ]);

            return $penalty;
        });

        return $this->successResponse($penalty->load('loan.resource'), 'Lập phiếu phạt thành công', 201);
    }
}
