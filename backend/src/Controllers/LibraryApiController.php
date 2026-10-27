<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Config\AppConstants;
use App\Repositories\AssetLendingRepository;
use App\Repositories\AuditAndStatsRepository;
use App\Repositories\BookRepository;
use App\Repositories\RoomBookingRepository;
use App\Services\AssetLendingService;
use App\Services\AuthAndSecurityService;
use App\Services\DigitalLibraryService;
use App\Services\RoomBookingService;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

/**
 * Bộ điều khiển trung tâm cho các phân hệ Thư viện Số, Mượn Tài sản, Đặt Phòng và Báo cáo (F-01..F-12).
 */
class LibraryApiController
{
    private BookRepository $bookRepository;
    private AssetLendingRepository $assetRepository;
    private RoomBookingRepository $roomRepository;
    private AuditAndStatsRepository $auditStatsRepository;
    private DigitalLibraryService $digitalLibraryService;
    private AssetLendingService $assetLendingService;
    private RoomBookingService $roomBookingService;
    private AuthAndSecurityService $authService;

    public function __construct(
        BookRepository $bookRepository,
        AssetLendingRepository $assetRepository,
        RoomBookingRepository $roomRepository,
        AuditAndStatsRepository $auditStatsRepository,
        DigitalLibraryService $digitalLibraryService,
        AssetLendingService $assetLendingService,
        RoomBookingService $roomBookingService,
        AuthAndSecurityService $authService
    ) {
        $this->bookRepository = $bookRepository;
        $this->assetRepository = $assetRepository;
        $this->roomRepository = $roomRepository;
        $this->auditStatsRepository = $auditStatsRepository;
        $this->digitalLibraryService = $digitalLibraryService;
        $this->assetLendingService = $assetLendingService;
        $this->roomBookingService = $roomBookingService;
        $this->authService = $authService;
    }

    /**
     * Tra cứu danh mục tài liệu số theo bộ lọc đa tiêu chí (F-01).
     *
     * @param array<string, mixed> $queryParams Tham số tìm kiếm
     * @return array<string, mixed>
     */
    public function listDocuments(array $queryParams): array
    {
        try {
            $keyword = (string) ($queryParams['keyword'] ?? '');
            $category = (string) ($queryParams['category'] ?? '');
            $publishYear = isset($queryParams['publish_year']) && (int) $queryParams['publish_year'] > 0
                ? (int) $queryParams['publish_year']
                : null;

            $documents = $this->bookRepository->searchDocuments($keyword, $category, $publishYear);

            return [
                'success' => true,
                'data' => $documents,
            ];
        } catch (Throwable $error) {
            error_log('[LibraryApiController::listDocuments] ' . $error->getMessage());
            return [
                'success' => false,
                'message' => 'Không thể tải danh mục tài liệu số. Vui lòng thử lại sau.',
            ];
        }
    }

    /**
     * Thêm mới hoặc đề xuất tài liệu số vào kho (F-01).
     *
     * @param int $actorUserId ID người thực hiện
     * @param array<string, mixed> $payload Dữ liệu tài liệu
     * @return array<string, mixed>
     */
    public function createDocument(int $actorUserId, array $payload): array
    {
        try {
            $this->authService->enforceRoleAccess(
                $actorUserId,
                [AppConstants::ROLE_ADMIN, AppConstants::ROLE_LIBRARIAN, AppConstants::ROLE_LECTURER],
                'DIGITAL_REPOSITORY_CREATE'
            );

            $created = $this->digitalLibraryService->registerDigitalDocument($actorUserId, $payload);

            return [
                'success' => true,
                'message' => 'Thêm tài liệu số thành công.',
                'data' => $created,
            ];
        } catch (InvalidArgumentException | RuntimeException $domainError) {
            return [
                'success' => false,
                'message' => $domainError->getMessage(),
            ];
        } catch (Throwable $error) {
            error_log('[LibraryApiController::createDocument] ' . $error->getMessage());
            return [
                'success' => false,
                'message' => 'Giao dịch không thành công. Vui lòng thử lại sau.',
            ];
        }
    }

    /**
     * Đặt mượn tài sản vật lý trực tuyến (F-03).
     *
     * @param int $userId ID người mượn
     * @param array<string, mixed> $payload Thông tin mượn
     * @return array<string, mixed>
     */
    public function borrowAsset(int $userId, array $payload): array
    {
        try {
            $assetId = (int) ($payload['asset_id'] ?? 0);
            $borrowDays = (int) ($payload['borrow_days'] ?? AppConstants::MAX_BORROW_DAYS);

            $loan = $this->assetLendingService->requestAssetBorrow($userId, $assetId, $borrowDays);

            return [
                'success' => true,
                'message' => 'Đăng ký mượn tài sản thành công. Vui lòng xuất trình mã QR tại quầy.',
                'data' => $loan,
            ];
        } catch (InvalidArgumentException | RuntimeException $domainError) {
            return [
                'success' => false,
                'message' => $domainError->getMessage(),
            ];
        } catch (Throwable $error) {
            error_log('[LibraryApiController::borrowAsset] ' . $error->getMessage());
            return [
                'success' => false,
                'message' => 'Giao dịch mượn tài sản không thành công. Vui lòng thử lại sau.',
            ];
        }
    }

    /**
     * Quét mã QR tại quầy thư viện để bàn giao hoặc nhận trả tài sản (F-04, F-06).
     *
     * @param int $actorUserId ID cán bộ thư viện
     * @param array<string, mixed> $payload Thông tin mã QR và tình trạng tài sản
     * @return array<string, mixed>
     */
    public function scanAssetQrCode(int $actorUserId, array $payload): array
    {
        try {
            $this->authService->enforceRoleAccess(
                $actorUserId,
                [AppConstants::ROLE_ADMIN, AppConstants::ROLE_LIBRARIAN],
                'COUNTER_QR_SCAN'
            );

            $qrToken = (string) ($payload['qr_code_token'] ?? '');
            $condition = (string) ($payload['return_condition'] ?? 'Tốt - Nguyên vẹn (100%)');
            $simulatedDate = isset($payload['simulated_return_date'])
                ? (string) $payload['simulated_return_date']
                : null;

            $result = $this->assetLendingService->processQrCodeScanAtCounter(
                $actorUserId,
                $qrToken,
                $condition,
                $simulatedDate
            );

            return [
                'success' => true,
                'message' => 'Xác nhận quét mã QR thành công.',
                'data' => $result,
            ];
        } catch (InvalidArgumentException | RuntimeException $domainError) {
            return [
                'success' => false,
                'message' => $domainError->getMessage(),
            ];
        } catch (Throwable $error) {
            error_log('[LibraryApiController::scanAssetQrCode] ' . $error->getMessage());
            return [
                'success' => false,
                'message' => 'Không thể xử lý mã QR. Vui lòng thử lại sau.',
            ];
        }
    }

    /**
     * Đặt phòng học theo khung giờ (F-07).
     *
     * @param int $userId ID người đặt
     * @param array<string, mixed> $payload Thông tin đặt phòng
     * @return array<string, mixed>
     */
    public function bookRoom(int $userId, array $payload): array
    {
        try {
            $booking = $this->roomBookingService->bookStudyRoom($userId, $payload);

            return [
                'success' => true,
                'message' => 'Đặt phòng học thành công.',
                'data' => $booking,
            ];
        } catch (InvalidArgumentException | RuntimeException $domainError) {
            return [
                'success' => false,
                'message' => $domainError->getMessage(),
            ];
        } catch (Throwable $error) {
            error_log('[LibraryApiController::bookRoom] ' . $error->getMessage());
            return [
                'success' => false,
                'message' => 'Không thể hoàn tất đặt phòng. Vui lòng thử lại sau.',
            ];
        }
    }

    /**
     * Xem Dashboard Thống kê Thời gian thực và Nhật ký Kiểm toán cho Quản trị viên (F-09, F-10, F-12).
     * Chặn truy cập từ Sinh viên / Giảng viên để chống Leo thang Đặc quyền (DAST).
     *
     * @param int $actorUserId ID người dùng đang truy cập
     * @return array<string, mixed>
     */
    public function getAdminDashboardAndAuditLogs(int $actorUserId): array
    {
        try {
            $this->authService->enforceRoleAccess(
                $actorUserId,
                [AppConstants::ROLE_ADMIN],
                'ADMIN_DASHBOARD_AND_AUDIT_LOGS'
            );

            return [
                'success' => true,
                'data' => [
                    'asset_status_summary' => $this->auditStatsRepository->countAssetsByStatus(),
                    'top_documents' => $this->auditStatsRepository->findTop10MostReadDocuments(),
                    'debt_report' => $this->auditStatsRepository->findDebtReportData(),
                    'audit_logs' => $this->auditStatsRepository->findRecentAuditLogs(50),
                ],
            ];
        } catch (RuntimeException $accessError) {
            return [
                'success' => false,
                'code' => 403,
                'message' => $accessError->getMessage(),
            ];
        } catch (Throwable $error) {
            error_log('[LibraryApiController::getAdminDashboardAndAuditLogs] ' . $error->getMessage());
            return [
                'success' => false,
                'message' => 'Không thể tải dữ liệu báo cáo quản trị. Vui lòng thử lại sau.',
            ];
        }
    }
}

