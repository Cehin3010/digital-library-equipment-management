<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Yêu cầu xác thực tài khoản',
            ], 401);
        }

        // Tải role nếu chưa có
        if (! $user->relationLoaded('role')) {
            $user->load('role');
        }

        $userRole = $user->role?->role_name;

        // Nếu roles rỗng hoặc userRole nằm trong danh sách được phép
        if (empty($roles) || in_array($userRole, $roles, true)) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'message' => 'Bạn không có quyền hạn truy cập tài nguyên này (Yêu cầu vai trò: ' . implode(', ', $roles) . ')',
        ], 403);
    }
}
