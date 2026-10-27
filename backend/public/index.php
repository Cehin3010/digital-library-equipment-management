<?php

declare(strict_types=1);

/**
 * Front Controller & REST API Router
 * Hệ thống Thư viện Số & Cho mượn Tài sản Đại học - Nhóm 3 (TDTU)
 */

spl_autoload_register(static function (string $class): void {
    $prefix = 'App\\';
    $baseDir = __DIR__ . '/../src/';

    if (strncmp($prefix, $class, strlen($prefix)) !== 0) {
        return;
    }

    $relativeClass = substr($class, strlen($prefix));
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

    if (file_exists($file)) {
        require_once $file;
    }
});

use App\Config\Database;
use App\Controllers\AuthController;
use App\Controllers\LibraryApiController;
use App\Repositories\AssetLendingRepository;
use App\Repositories\AuditAndStatsRepository;
use App\Repositories\BookRepository;
use App\Repositories\RoomBookingRepository;
use App\Repositories\UserRepository;
use App\Services\AssetLendingService;
use App\Services\AuthAndSecurityService;
use App\Services\DigitalLibraryService;
use App\Services\FineCalculationService;
use App\Services\RoomBookingService;

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Actor-User-Id');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    $pdo = Database::getConnection();

    $userRepository = new UserRepository($pdo);
    $bookRepository = new BookRepository($pdo);
    $assetRepository = new AssetLendingRepository($pdo);
    $roomRepository = new RoomBookingRepository($pdo);
    $auditStatsRepository = new AuditAndStatsRepository($pdo);

    $fineService = new FineCalculationService($userRepository);
    $authService = new AuthAndSecurityService($userRepository, $auditStatsRepository);
    $digitalLibraryService = new DigitalLibraryService($bookRepository, $auditStatsRepository);
    $assetLendingService = new AssetLendingService(
        $assetRepository,
        $userRepository,
        $auditStatsRepository,
        $fineService
    );
    $roomBookingService = new RoomBookingService($roomRepository, $userRepository, $auditStatsRepository);

    $authController = new AuthController($authService);
    $apiController = new LibraryApiController(
        $bookRepository,
        $assetRepository,
        $roomRepository,
        $auditStatsRepository,
        $digitalLibraryService,
        $assetLendingService,
        $roomBookingService,
        $authService
    );

    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $rawBody = file_get_contents('php://input');
    $jsonBody = is_string($rawBody) && $rawBody !== '' ? (json_decode($rawBody, true) ?? []) : [];
    $actorUserId = (int) ($_SERVER['HTTP_X_ACTOR_USER_ID'] ?? ($jsonBody['actor_user_id'] ?? 1));

    if ($uri === '/api/auth/login' && $method === 'POST') {
        $clientIp = (string) ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1');
        echo json_encode($authController->login($jsonBody, $clientIp), JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($uri === '/api/documents' && $method === 'GET') {
        echo json_encode($apiController->listDocuments($_GET), JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($uri === '/api/documents' && $method === 'POST') {
        echo json_encode($apiController->createDocument($actorUserId, $jsonBody), JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($uri === '/api/assets/borrow' && $method === 'POST') {
        echo json_encode($apiController->borrowAsset($actorUserId, $jsonBody), JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($uri === '/api/assets/scan-qr' && $method === 'POST') {
        echo json_encode($apiController->scanAssetQrCode($actorUserId, $jsonBody), JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($uri === '/api/rooms/book' && $method === 'POST') {
        echo json_encode($apiController->bookRoom($actorUserId, $jsonBody), JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($uri === '/api/admin/dashboard' && $method === 'GET') {
        $response = $apiController->getAdminDashboardAndAuditLogs($actorUserId);
        if (isset($response['code']) && (int) $response['code'] === 403) {
            http_response_code(403);
        }
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        exit;
    }

    http_response_code(404);
    echo json_encode([
        'success' => false,
        'message' => 'Endpoint không tồn tại.',
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $fatalError) {
    error_log('[Router Fatal Error] ' . $fatalError->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Hệ thống đang bận. Vui lòng thử lại sau.',
    ], JSON_UNESCAPED_UNICODE);
}

