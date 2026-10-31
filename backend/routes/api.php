<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\SystemSettingController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ResourceController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\LoanController;
use App\Http\Controllers\Api\LoanCirculationController;
use App\Http\Controllers\Api\PenaltyController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\NotificationController;

// Health-check endpoint
Route::get('/health', fn () => response()->json(['success' => true, 'message' => 'API is running']));

/*
|--------------------------------------------------------------------------
| 1. MODULE CỦA LÝ HẠO DANH (F-11, F-12: Auth, RBAC, Settings, Audit Log)
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('/request-otp', [AuthController::class, 'requestOtp']);
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

Route::middleware(['auth:sanctum', 'role:ADMIN'])->prefix('admin')->group(function () {
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::patch('/users/{id}', [UserController::class, 'update']);
    Route::get('/settings', [SystemSettingController::class, 'index']);
    Route::put('/settings', [SystemSettingController::class, 'update']);
    Route::get('/audit-logs', [AuditLogController::class, 'index']);
});

/*
|--------------------------------------------------------------------------
| 2. MODULE CỦA NGUYỄN ANH KHOA (F-01, F-02, F-09, F-10: Repository & Reports)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/resources', [ResourceController::class, 'index']);
    Route::get('/resources/{id}', [ResourceController::class, 'show']);
    Route::get('/resources/{id}/read', [ResourceController::class, 'streamPdf']);
    Route::get('/resources/{id}/schedule', [ResourceController::class, 'schedule']);

    Route::middleware('role:LIBRARIAN,ADMIN')->group(function () {
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::post('/resources', [ResourceController::class, 'store']);
        Route::put('/resources/{id}', [ResourceController::class, 'update']);
        Route::delete('/resources/{id}', [ResourceController::class, 'destroy']);
        Route::get('/reports/export', [ReportController::class, 'export']);
    });

    Route::middleware('role:LIBRARIAN,ADMIN,LECTURER')
        ->get('/reports/dashboard', [ReportController::class, 'dashboard']);
});

/*
|--------------------------------------------------------------------------
| 3. MODULE CỦA TRẦN MINH CHIẾN (F-03, F-04, F-07, F-08: Lending, QR & Rooms)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->prefix('loans')->group(function () {
    Route::middleware('role:STUDENT,LECTURER')->group(function () {
        Route::post('/hold', [LoanController::class, 'hold']);
        Route::post('/{id}/confirm', [LoanController::class, 'confirm']);
        Route::post('/{id}/cancel', [LoanController::class, 'cancel']);
    });

    Route::middleware('role:LIBRARIAN,ADMIN')->group(function () {
        Route::get('/', [LoanCirculationController::class, 'index']);
        Route::post('/scan-qr', [LoanCirculationController::class, 'scanQr']);
        Route::post('/{id}/approve', [LoanCirculationController::class, 'approve']);
        Route::post('/{id}/reject', [LoanCirculationController::class, 'reject']);
        Route::post('/{id}/return', [LoanCirculationController::class, 'returnAsset']);
    });
});

/*
|--------------------------------------------------------------------------
| 4. MODULE CỦA HỒ THỊNH PHÁT (F-05, F-06, F-06b: Reminders, Fines & Payments)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/my-loans', [PenaltyController::class, 'myLoans']);
    Route::get('/my-penalties', [PenaltyController::class, 'myPenalties']);
    Route::post('/penalties/{id}/pay', [PaymentController::class, 'initiatePayment']);
    Route::get('/payments/{txnRef}/status', [PaymentController::class, 'checkStatus']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);

    Route::middleware('role:LIBRARIAN,ADMIN')
        ->post('/penalties', [PenaltyController::class, 'store']);
});

// Public Webhook IPN từ VNPay & MoMo
Route::match(['get', 'post'], '/payments/vnpay-ipn', [PaymentController::class, 'vnpayIpn']);
Route::post('/payments/momo-ipn', [PaymentController::class, 'momoIpn']);

