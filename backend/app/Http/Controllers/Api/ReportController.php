<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ExportReportRequest;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class ReportController extends Controller
{
    public function __construct(
        protected ReportService $reportService
    ) {}

    /**
     * Thống kê Dashboard thời gian thực (F-09)
     * GET /api/reports/dashboard
     */
    public function dashboard(): JsonResponse
    {
        try {
            $stats = $this->reportService->getDashboardStats();
            return $this->successResponse($stats, 'Lấy dữ liệu thống kê Dashboard thành công');
        } catch (Throwable $e) {
            return $this->errorResponse('Lỗi lấy dữ liệu thống kê: ' . $e->getMessage(), null, 500);
        }
    }

    /**
     * Xuất báo cáo sử dụng tài sản & công nợ ra file Excel / CSV (F-10)
     * GET /api/reports/export
     */
    public function export(ExportReportRequest $request): Response
    {
        try {
            return $this->reportService->exportReport($request->validated());
        } catch (Throwable $e) {
            return $this->errorResponse('Lỗi xuất báo cáo: ' . $e->getMessage(), null, 400);
        }
    }
}
