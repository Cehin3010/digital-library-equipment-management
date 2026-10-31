<?php

namespace App\Services;

use App\Models\Resource;
use App\Models\Loan;
use App\Models\Penalty;
use App\Models\AuditLog;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportService
{
    /**
     * Thống kê Dashboard thời gian thực (F-09)
     */
    public function getDashboardStats(): array
    {
        // 1. Tổng quan tài nguyên & tỷ lệ mượn
        $totalResources = Resource::count();
        $activeResources = Resource::where('status', 'ACTIVE')->count();
        $maintenanceResources = Resource::where('status', 'MAINTENANCE')->count();

        // Thống kê theo loại tài nguyên
        $byType = [
            'DIGITAL' => Resource::where('resource_type', 'DIGITAL')->count(),
            'BOOK' => Resource::where('resource_type', 'BOOK')->count(),
            'EQUIPMENT' => Resource::where('resource_type', 'EQUIPMENT')->count(),
            'ROOM' => Resource::where('resource_type', 'ROOM')->count(),
        ];

        // Tỷ lệ cho mượn tài sản vật lý (BOOK + EQUIPMENT + ROOM)
        $physicalStats = Resource::whereIn('resource_type', ['BOOK', 'EQUIPMENT', 'ROOM'])
            ->where('status', '!=', 'INACTIVE')
            ->selectRaw('COALESCE(SUM(total_quantity), 0) as total_qty, COALESCE(SUM(available_quantity), 0) as avail_qty')
            ->first();

        $totalPhysicalQty = (int) ($physicalStats->total_qty ?? 0);
        $totalAvailQty = (int) ($physicalStats->avail_qty ?? 0);
        $totalBorrowedQty = max(0, $totalPhysicalQty - $totalAvailQty);
        $lendingRate = $totalPhysicalQty > 0 ? round(($totalBorrowedQty / $totalPhysicalQty) * 100, 2) : 0;

        // 2. Thống kê phiếu mượn đang hoạt động
        $holdingLoans = Loan::where('status', 'HOLDING')->count();
        $pendingLoans = Loan::where('status', 'PENDING')->count();
        $borrowingLoans = Loan::where('status', 'BORROWING')->count();
        $returnedLoans = Loan::where('status', 'RETURNED')->count();

        // 3. Top 10 tài liệu được đọc & mượn nhiều nhất
        $topBorrowed = Resource::select('resources.resource_id', 'resources.title', 'resources.code', 'resources.resource_type')
            ->withCount(['loans' => function ($query) {
                $query->whereIn('status', ['BORROWING', 'RETURNED']);
            }])
            ->orderBy('loans_count', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                // Đếm thêm lượt đọc online nếu là tài liệu số
                $readsCount = 0;
                if ($item->resource_type === 'DIGITAL') {
                    $readsCount = AuditLog::where('action', 'READ_DIGITAL_ASSET')
                        ->where('entity_id', $item->resource_id)
                        ->count();
                }

                return [
                    'resource_id' => $item->resource_id,
                    'title' => $item->title,
                    'code' => $item->code,
                    'resource_type' => $item->resource_type,
                    'borrow_count' => $item->loans_count,
                    'read_count' => $readsCount,
                    'total_engagements' => $item->loans_count + $readsCount,
                ];
            });

        // 4. Biểu đồ xu hướng mượn trả 6 tháng gần nhất
        $monthlyTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthStart = now()->subMonths($i)->startOfMonth();
            $monthEnd = now()->subMonths($i)->endOfMonth();
            $monthLabel = $monthStart->format('m/Y');

            $borrowCount = Loan::whereBetween('borrow_from', [$monthStart, $monthEnd])->count();
            $returnCount = Loan::whereBetween('returned_at', [$monthStart, $monthEnd])->count();

            $monthlyTrend[] = [
                'month' => $monthLabel,
                'borrow_count' => $borrowCount,
                'return_count' => $returnCount,
            ];
        }

        // 5. Thống kê công nợ vi phạm
        $unpaidPenalties = Penalty::where('status', 'UNPAID')->sum('amount');
        $paidPenalties = Penalty::where('status', 'PAID')->sum('amount');
        $unpaidCount = Penalty::where('status', 'UNPAID')->count();

        return [
            'overview' => [
                'total_resources' => $totalResources,
                'active_resources' => $activeResources,
                'maintenance_resources' => $maintenanceResources,
                'total_physical_quantity' => $totalPhysicalQty,
                'total_borrowed_quantity' => $totalBorrowedQty,
                'lending_rate' => $lendingRate,
            ],
            'by_type' => $byType,
            'loans_status' => [
                'holding' => $holdingLoans,
                'pending' => $pendingLoans,
                'borrowing' => $borrowingLoans,
                'returned' => $returnedLoans,
            ],
            'top_resources' => $topBorrowed,
            'monthly_trend' => $monthlyTrend,
            'penalties' => [
                'unpaid_amount' => (int) $unpaidPenalties,
                'paid_amount' => (int) $paidPenalties,
                'unpaid_count' => $unpaidCount,
            ],
        ];
    }

    /**
     * Xuất báo cáo định kỳ ra file Excel / CSV (F-10)
     */
    public function exportReport(array $params): StreamedResponse
    {
        $type = $params['type'] ?? 'usage';
        $format = $params['format'] ?? 'csv';
        $startDate = $params['start_date'] ?? now()->startOfMonth()->toDateString();
        $endDate = $params['end_date'] ?? now()->endOfMonth()->toDateString();

        $fileName = sprintf('bao_cao_%s_%s_%s.%s', $type, date('Ymd', strtotime($startDate)), date('Ymd', strtotime($endDate)), $format === 'xlsx' ? 'csv' : $format);

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($type, $startDate, $endDate) {
            $handle = fopen('php://output', 'w');

            // UTF-8 BOM để Excel hiển thị tiếng Việt không bị lỗi font
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            if ($type === 'fines') {
                // Báo cáo danh sách công nợ & vi phạm
                fputcsv($handle, ['Mã phiếu phạt', 'Mã người dùng', 'Mã phiếu mượn', 'Loại vi phạm', 'Số ngày trễ', 'Số tiền (VNĐ)', 'Trạng thái', 'Ngày ghi nhận', 'Ngày thanh toán', 'Ghi chú']);

                $penalties = Penalty::with('user')
                    ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                    ->orderBy('created_at', 'desc')
                    ->get();

                foreach ($penalties as $p) {
                    fputcsv($handle, [
                        $p->penalty_id,
                        $p->user?->user_code ?? $p->user_id,
                        $p->loan_id,
                        $p->penalty_type,
                        $p->overdue_days,
                        number_format($p->amount, 0, ',', '.'),
                        $p->status === 'PAID' ? 'Đã đóng' : 'Chưa đóng',
                        $p->created_at?->format('d/m/Y H:i'),
                        $p->paid_at?->format('d/m/Y H:i') ?? 'N/A',
                        $p->note ?? '',
                    ]);
                }
            } else {
                // Báo cáo sử dụng tài sản
                fputcsv($handle, ['Mã tài sản', 'Tên tài sản', 'Loại tài nguyên', 'Hãng / Tác giả', 'Vị trí', 'Tổng số lượng', 'Còn khả dụng', 'Số lượt mượn', 'Trạng thái']);

                $resources = Resource::withCount('loans')
                    ->where('status', '!=', 'INACTIVE')
                    ->orderBy('title')
                    ->get();

                foreach ($resources as $r) {
                    fputcsv($handle, [
                        $r->code,
                        $r->title,
                        $r->resource_type,
                        $r->author_or_brand ?? '',
                        $r->location ?? '',
                        $r->total_quantity,
                        $r->available_quantity,
                        $r->loans_count,
                        $r->status_label,
                    ]);
                }
            }

            fclose($handle);
        }, 200, $headers);
    }
}
