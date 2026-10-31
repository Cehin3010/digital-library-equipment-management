<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

abstract class Controller
{
    /**
     * Phản hồi JSON thành công theo chuẩn TASK1.md
     */
    protected function successResponse(mixed $data = null, string $message = 'Thao tác thành công', int $code = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $code);
    }

    /**
     * Phản hồi JSON thất bại theo chuẩn TASK1.md
     */
    protected function errorResponse(string $message = 'Thao tác thất bại', mixed $errors = null, int $code = 400): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
        ], $code);
    }
}
