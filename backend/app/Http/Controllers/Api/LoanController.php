<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Models\Resource;
use App\Models\SystemSetting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LoanController extends Controller
{
    public function hold(Request $request): JsonResponse
    {
        $data = $request->validate([
            'resource_id' => ['required', 'integer', 'exists:resources,resource_id'],
            'borrow_from' => ['required', 'date', 'after_or_equal:now'],
            'due_date' => ['required', 'date', 'after:borrow_from'],
        ]);
        $data['borrow_from'] = Carbon::parse($data['borrow_from'])
            ->setTimezone(config('app.timezone'))
            ->format('Y-m-d H:i:s');
        $data['due_date'] = Carbon::parse($data['due_date'])
            ->setTimezone(config('app.timezone'))
            ->format('Y-m-d H:i:s');

        $loan = DB::transaction(function () use ($data, $request) {
            $user = User::query()->lockForUpdate()->findOrFail($request->user()->user_id);
            $maxActiveLoans = (int) (SystemSetting::query()->where('setting_key', 'MAX_ACTIVE_LOANS')->value('setting_value') ?? 5);
            $activeLoans = Loan::query()
                ->where('user_id', $user->user_id)
                ->whereIn('status', ['HOLDING', 'PENDING', 'BORROWING'])
                ->count();
            abort_if($activeLoans >= $maxActiveLoans, 409, 'Bạn đã đạt giới hạn số lượt mượn đang hoạt động.');

            $resource = Resource::query()->lockForUpdate()->findOrFail($data['resource_id']);

            if (! in_array($resource->resource_type, ['BOOK', 'EQUIPMENT'], true)) {
                abort(422, 'Chỉ có thể đặt mượn sách in hoặc thiết bị.');
            }

            if ($resource->status !== 'ACTIVE') {
                abort(409, 'Tài nguyên hiện không sẵn sàng cho mượn.');
            }

            $expiredHolds = Loan::query()
                ->where('resource_id', $resource->resource_id)
                ->where('status', 'HOLDING')
                ->where('hold_expires_at', '<=', now())
                ->lockForUpdate()
                ->get();

            if ($expiredHolds->isNotEmpty()) {
                Loan::query()->whereIn('loan_id', $expiredHolds->pluck('loan_id'))
                    ->update(['status' => 'EXPIRED', 'hold_expires_at' => null]);
                $resource->increment('available_quantity', $expiredHolds->count());
                $resource->refresh();
            }

            if ($resource->available_quantity < 1) {
                abort(409, 'Tài nguyên đã hết số lượng có thể đặt mượn.');
            }

            $resource->decrement('available_quantity');
            $holdMinutes = (int) (SystemSetting::query()->where('setting_key', 'HOLD_MINUTES')->value('setting_value') ?? 10);

            return Loan::create([
                'qr_token' => Str::random(48),
                'user_id' => $request->user()->user_id,
                'resource_id' => $resource->resource_id,
                'status' => 'HOLDING',
                'borrow_from' => $data['borrow_from'],
                'due_date' => $data['due_date'],
                'requested_at' => now(),
                'hold_expires_at' => now()->addMinutes($holdMinutes),
            ])->load('resource');
        });

        return $this->successResponse($loan, 'Giữ chỗ tài sản thành công', 201);
    }

    public function mine(Request $request): JsonResponse
    {
        $loans = Loan::query()
            ->with('resource')
            ->where('user_id', $request->user()->user_id)
            ->orderByDesc('requested_at')
            ->paginate(20);

        return $this->successResponse($loans, 'Lịch sử đặt mượn của bạn');
    }

    public function showMine(Request $request, int $id): JsonResponse
    {
        $loan = Loan::query()
            ->with('resource')
            ->where('user_id', $request->user()->user_id)
            ->findOrFail($id);

        return $this->successResponse($loan, 'Thông tin phiếu mượn của bạn');
    }

    public function confirm(Request $request, int $id): JsonResponse
    {
        $resourceId = Loan::query()->whereKey($id)->value('resource_id');
        abort_if($resourceId === null, 404, 'Không tìm thấy phiếu mượn.');

        [$loan, $expired] = DB::transaction(function () use ($id, $resourceId, $request) {
            Resource::query()->lockForUpdate()->findOrFail($resourceId);
            $loan = Loan::query()->lockForUpdate()->findOrFail($id);
            abort_unless((int) $loan->user_id === (int) $request->user()->user_id, 403, 'Bạn không sở hữu phiếu mượn này.');
            abort_unless($loan->status === 'HOLDING', 409, 'Phiếu mượn không còn ở trạng thái giữ chỗ.');

            if ($loan->hold_expires_at === null || $loan->hold_expires_at->isPast()) {
                $loan->update(['status' => 'EXPIRED', 'hold_expires_at' => null]);
                Resource::query()->whereKey($loan->resource_id)->increment('available_quantity');
                return [null, true];
            }

            $loan->update(['status' => 'PENDING', 'hold_expires_at' => null]);
            return [$loan->fresh('resource'), false];
        });

        if ($expired) {
            abort(409, 'Thời gian giữ chỗ đã hết hạn. Vui lòng đặt mượn lại.');
        }

        return $this->successResponse($loan, 'Xác nhận đặt mượn thành công');
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $resourceId = Loan::query()->whereKey($id)->value('resource_id');
        abort_if($resourceId === null, 404, 'Không tìm thấy phiếu mượn.');

        $loan = DB::transaction(function () use ($id, $resourceId, $request) {
            Resource::query()->lockForUpdate()->findOrFail($resourceId);
            $loan = Loan::query()->lockForUpdate()->findOrFail($id);
            abort_unless((int) $loan->user_id === (int) $request->user()->user_id, 403, 'Bạn không sở hữu phiếu mượn này.');
            abort_unless(in_array($loan->status, ['HOLDING', 'PENDING'], true), 409, 'Chỉ có thể hủy phiếu đang giữ chỗ hoặc chờ duyệt.');

            $loan->update(['status' => 'CANCELLED', 'hold_expires_at' => null]);
            Resource::query()->whereKey($loan->resource_id)->increment('available_quantity');

            return $loan->fresh('resource');
        });

        return $this->successResponse($loan, 'Hủy phiếu đặt mượn thành công');
    }
}
