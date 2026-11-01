<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LibraryNotification;
use App\Models\Loan;
use App\Models\Penalty;
use App\Models\Resource;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LoanCirculationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Loan::query()->with(['resource', 'user:user_id,full_name,user_code,email'])
            ->whereIn('status', ['PENDING', 'BORROWING'])
            ->orderByDesc('requested_at');

        if ($request->filled('status') && in_array($request->input('status'), ['PENDING', 'BORROWING'], true)) {
            $query->where('status', $request->input('status'));
        }

        return $this->successResponse($query->paginate(30), 'Danh sách phiếu lưu thông quầy');
    }

    public function scanQr(Request $request): JsonResponse
    {
        $data = $request->validate(['qr_token' => ['required', 'string', 'max:64']]);
        $loan = Loan::query()
            ->with(['resource', 'user:user_id,full_name,user_code,email'])
            ->where('qr_token', $data['qr_token'])
            ->first();

        if (! $loan) {
            return $this->errorResponse('Không tìm thấy phiếu theo mã QR.', null, 404);
        }

        return $this->successResponse($loan, 'Tìm thấy phiếu theo mã QR');
    }

    public function approve(Request $request, int $id): JsonResponse
    {
        $loan = DB::transaction(function () use ($id, $request) {
            $loan = Loan::query()->lockForUpdate()->findOrFail($id);
            abort_unless($loan->status === 'PENDING', 409, 'Chỉ có thể bàn giao phiếu đang chờ duyệt.');

            $loan->update([
                'status' => 'BORROWING',
                'approved_by' => $request->user()->user_id,
                'approved_at' => now(),
            ]);

            return $loan->fresh(['resource', 'user:user_id,full_name,user_code,email']);
        });

        return $this->successResponse($loan, 'Bàn giao tài sản thành công');
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['reason' => ['required', 'string', 'max:1000']]);
        $resourceId = Loan::query()->whereKey($id)->value('resource_id');
        abort_if($resourceId === null, 404, 'Không tìm thấy phiếu mượn.');

        $loan = DB::transaction(function () use ($id, $resourceId, $data) {
            $resource = Resource::query()->lockForUpdate()->findOrFail($resourceId);
            $loan = Loan::query()->lockForUpdate()->findOrFail($id);
            abort_unless($loan->status === 'PENDING', 409, 'Chỉ có thể từ chối phiếu đang chờ duyệt.');

            $loan->update([
                'status' => 'REJECTED',
                'reject_reason' => $data['reason'],
                'hold_expires_at' => null,
            ]);
            $resource->increment('available_quantity');

            return $loan->fresh(['resource', 'user:user_id,full_name,user_code,email']);
        });

        return $this->successResponse($loan, 'Từ chối phiếu mượn và hoàn số lượng tài nguyên');
    }

    public function returnAsset(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'return_condition' => ['required', 'in:GOOD,DAMAGED,LOST'],
        ]);
        $resourceId = Loan::query()->whereKey($id)->value('resource_id');
        abort_if($resourceId === null, 404, 'Không tìm thấy phiếu mượn.');

        [$loan, $penalties] = DB::transaction(function () use ($id, $resourceId, $data, $request) {
            $resource = Resource::query()->lockForUpdate()->findOrFail($resourceId);
            $loan = Loan::query()->lockForUpdate()->findOrFail($id);
            abort_unless($loan->status === 'BORROWING', 409, 'Chỉ có thể ghi nhận trả tài sản đang được mượn.');

            $loan->update([
                'status' => 'RETURNED',
                'returned_at' => now(),
                'return_condition' => $data['return_condition'],
                'received_by' => $request->user()->user_id,
            ]);

            if ($data['return_condition'] === 'GOOD') {
                $resource->increment('available_quantity');
            } elseif ($resource->total_quantity > 0) {
                $resource->decrement('total_quantity');
                if ($resource->total_quantity === 0) {
                    $resource->update(['status' => 'MAINTENANCE']);
                }
            }

            $penalties = [];
            if ($resource->resource_type === 'EQUIPMENT' && $resource->rental_fee_per_day > 0) {
                $loanStart = $loan->approved_at ?? $loan->borrow_from;
                $rentalDays = max(1, (int) ceil(max(0, now()->getTimestamp() - $loanStart->getTimestamp()) / 86400));
                $penalties[] = $this->createPenalty(
                    $loan,
                    $request,
                    'RENTAL',
                    $rentalDays * $resource->rental_fee_per_day,
                    0,
                    "Phí mượn thiết bị {$rentalDays} ngày.",
                );
            }

            $lateSeconds = now()->getTimestamp() - $loan->due_date->getTimestamp();
            if ($lateSeconds > 0) {
                $overdueDays = (int) ceil($lateSeconds / 86400);
                $finePerDay = (int) (SystemSetting::query()->where('setting_key', 'FINE_PER_DAY')->value('setting_value') ?? 5000);
                if ($finePerDay > 0) {
                    $penalties[] = $this->createPenalty(
                        $loan,
                        $request,
                        'OVERDUE',
                        $overdueDays * $finePerDay,
                        $overdueDays,
                        "Trả trễ {$overdueDays} ngày.",
                    );
                }
            }

            if ($data['return_condition'] !== 'GOOD') {
                $settingKey = $data['return_condition'] === 'LOST' ? 'LOST_FINE' : 'DAMAGE_FINE';
                $amount = $data['return_condition'] === 'LOST'
                    ? (int) ($resource->replacement_cost ?: SystemSetting::query()->where('setting_key', $settingKey)->value('setting_value') ?? 100000)
                    : (int) (SystemSetting::query()->where('setting_key', $settingKey)->value('setting_value') ?? 50000);
                if ($amount > 0) {
                    $penalties[] = $this->createPenalty(
                        $loan,
                        $request,
                        $data['return_condition'],
                        $amount,
                        0,
                        $data['return_condition'] === 'LOST' ? 'Tài sản bị ghi nhận mất.' : 'Tài sản bị ghi nhận hư hỏng.',
                    );
                }
            }

            return [
                $loan->fresh(['resource', 'user:user_id,full_name,user_code,email']),
                $penalties,
            ];
        });

        return $this->successResponse([
            'loan' => $loan,
            'penalty_required' => $penalties !== [],
            'penalties' => $penalties,
        ], 'Đã ghi nhận trả tài sản');
    }

    private function createPenalty(Loan $loan, Request $request, string $type, int $amount, int $overdueDays, string $note): Penalty
    {
        $penalty = Penalty::create([
            'loan_id' => $loan->loan_id,
            'user_id' => $loan->user_id,
            'penalty_type' => $type,
            'overdue_days' => $overdueDays,
            'amount' => $amount,
            'status' => 'UNPAID',
            'note' => $note,
            'created_by' => $request->user()->user_id,
            'created_at' => now(),
        ]);

        LibraryNotification::create([
            'user_id' => $loan->user_id,
            'type' => 'PENALTY_CREATED',
            'title' => 'Phát sinh khoản phạt',
            'message' => $note . ' Số tiền: ' . number_format($amount, 0, ',', '.') . ' VNĐ.',
            'related_type' => 'penalty',
            'related_id' => $penalty->penalty_id,
            'created_at' => now(),
        ]);

        return $penalty;
    }
}
