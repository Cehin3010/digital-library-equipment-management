<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Resource;
use App\Models\LibraryNotification;
use App\Models\Payment;
use App\Models\Penalty;
use App\Models\RoomBooking;
use App\Models\SystemSetting;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RoomBookingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $bookings = RoomBooking::query()
            ->with('resource')
            ->where('user_id', $request->user()->user_id)
            ->orderByDesc('starts_at')
            ->paginate(20);

        return $this->successResponse($bookings, 'Lịch đặt phòng của bạn');
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'resource_id' => ['required', 'integer', 'exists:resources,resource_id'],
            'starts_at' => ['required', 'date', 'after:now'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'purpose' => ['nullable', 'string', 'max:500'],
        ]);
        $data['starts_at'] = Carbon::parse($data['starts_at'])
            ->setTimezone(config('app.timezone'))
            ->format('Y-m-d H:i:s');
        $data['ends_at'] = Carbon::parse($data['ends_at'])
            ->setTimezone(config('app.timezone'))
            ->format('Y-m-d H:i:s');

        $booking = DB::transaction(function () use ($data, $request) {
            $resource = Resource::query()->lockForUpdate()->findOrFail($data['resource_id']);

            if ($resource->resource_type !== 'ROOM') {
                abort(422, 'Chỉ có thể đặt phòng với tài nguyên loại ROOM.');
            }

            if ($resource->status !== 'ACTIVE') {
                abort(409, 'Phòng hiện không sẵn sàng để đặt.');
            }

            $overlap = RoomBooking::query()
                ->where('resource_id', $resource->resource_id)
                ->whereIn('status', ['CONFIRMED'])
                ->where('starts_at', '<', $data['ends_at'])
                ->where('ends_at', '>', $data['starts_at'])
                ->exists();

            if ($overlap) {
                abort(409, 'Khung giờ này đã có người đặt phòng.');
            }

            $hours = max(1, (int) ceil((strtotime($data['ends_at']) - strtotime($data['starts_at'])) / 3600));
            $booking = RoomBooking::create([
                'user_id' => $request->user()->user_id,
                'resource_id' => $resource->resource_id,
                'starts_at' => $data['starts_at'],
                'ends_at' => $data['ends_at'],
                'purpose' => $data['purpose'] ?? null,
                'status' => 'CONFIRMED',
                'total_fee' => $resource->booking_fee_per_hour * $hours,
            ]);

            if ($booking->total_fee > 0) {
                $penalty = Penalty::create([
                    'room_booking_id' => $booking->room_booking_id,
                    'user_id' => $booking->user_id,
                    'penalty_type' => 'ROOM_BOOKING',
                    'overdue_days' => 0,
                    'amount' => $booking->total_fee,
                    'status' => 'UNPAID',
                    'note' => "Phí đặt phòng {$hours} giờ.",
                    'created_by' => $request->user()->user_id,
                    'created_at' => now(),
                ]);
                LibraryNotification::create([
                    'user_id' => $booking->user_id,
                    'type' => 'PENALTY_CREATED',
                    'title' => 'Phát sinh phí đặt phòng',
                    'message' => 'Phí đặt phòng ' . number_format($booking->total_fee, 0, ',', '.') . ' VNĐ đã được ghi nhận vào công nợ.',
                    'related_type' => 'penalty',
                    'related_id' => $penalty->penalty_id,
                    'created_at' => now(),
                ]);
            }

            return $booking->load('resource');
        });

        return $this->successResponse($booking, 'Đặt phòng thành công', 201);
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $booking = DB::transaction(function () use ($id, $request) {
            $booking = RoomBooking::query()->lockForUpdate()->findOrFail($id);
            abort_unless((int) $booking->user_id === (int) $request->user()->user_id, 403, 'Bạn không sở hữu lượt đặt phòng này.');
            abort_unless($booking->status === 'CONFIRMED', 409, 'Lượt đặt phòng này không thể hủy.');
            $roomFee = Penalty::query()->where('room_booking_id', $booking->room_booking_id)->lockForUpdate()->first();

            $cancelHours = (int) (SystemSetting::query()->where('setting_key', 'ROOM_CANCEL_HOURS')->value('setting_value') ?? 2);
            if ($booking->starts_at->lt(now()->addHours($cancelHours))) {
                abort(409, "Chỉ có thể hủy phòng trước giờ bắt đầu ít nhất {$cancelHours} tiếng.");
            }

            $booking->update([
                'status' => 'CANCELLED',
                'cancelled_at' => now(),
            ]);
            if ($roomFee?->status === 'UNPAID') {
                $roomFee->update(['status' => 'WAIVED']);
                Payment::query()->where('penalty_id', $roomFee->penalty_id)
                    ->where('status', 'PENDING')
                    ->update(['status' => 'FAILED', 'updated_at' => now()]);
            }

            return $booking->fresh('resource');
        });

        $message = $booking->total_fee > 0
            ? 'Hủy đặt phòng thành công. Nếu phí đã thanh toán thì hệ thống không tự hoàn tiền.'
            : 'Hủy đặt phòng thành công.';
        return $this->successResponse($booking, $message);
    }
}
