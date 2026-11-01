<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\AuditLog;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $users = User::query()
            ->with('role')
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = trim((string) $request->input('search'));
                $query->where(function ($userQuery) use ($search) {
                    $userQuery->where('full_name', 'ilike', "%{$search}%")
                        ->orWhere('email', 'ilike', "%{$search}%")
                        ->orWhere('user_code', 'ilike', "%{$search}%");
                });
            })
            ->when($request->filled('role'), function ($query) use ($request) {
                $query->whereHas('role', fn ($roleQuery) => $roleQuery->where('role_name', $request->input('role')));
            })
            ->orderBy('user_id')
            ->paginate(min(max($request->integer('per_page', 20), 1), 100));

        return $this->successResponse($users, 'Danh sách người dùng');
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $data = $request->validated();
        $role = isset($data['role_id'])
            ? Role::query()->findOrFail($data['role_id'])
            : Role::query()->where('role_name', $data['role_name'])->firstOrFail();
        $user = DB::transaction(function () use ($data, $role, $request) {
            $user = User::create([
                'email' => strtolower($data['email']),
                'full_name' => $data['full_name'],
                'user_code' => $data['user_code'],
                'phone' => $data['phone'] ?? null,
                'role_id' => $role->role_id,
                'status' => $data['status'] ?? User::STATUS_ACTIVE,
            ]);
            AuditLog::create([
                'user_id' => $request->user()->user_id,
                'action' => 'CREATE_USER',
                'entity_type' => 'users',
                'entity_id' => $user->user_id,
                'details' => ['email' => $user->email, 'role' => $role->role_name],
                'ip_address' => $request->ip(),
                'created_at' => now(),
            ]);
            return $user->load('role');
        });

        return $this->successResponse($user, 'Tạo người dùng thành công', 201);
    }

    public function update(UpdateUserRequest $request, int $id): JsonResponse
    {
        $data = $request->validated();
        $user = User::query()->with('role')->findOrFail($id);
        $isChangingOwnRole = $request->user()->user_id === $user->user_id
            && (isset($data['role_name']) || isset($data['role_id']));
        $isLockingSelf = $request->user()->user_id === $user->user_id
            && ($data['status'] ?? null) === User::STATUS_LOCKED;
        if ($isChangingOwnRole || $isLockingSelf) {
            return $this->errorResponse('Không thể tự đổi vai trò hoặc khóa tài khoản đang đăng nhập.', null, 422);
        }

        if (isset($data['role_name'])) {
            $data['role_id'] = Role::query()->where('role_name', $data['role_name'])->firstOrFail()->role_id;
            unset($data['role_name']);
        }

        $updated = DB::transaction(function () use ($data, $request, $user) {
            $before = $user->only(['full_name', 'user_code', 'phone', 'role_id', 'status']);
            $user->update($data);
            $user->load('role');
            AuditLog::create([
                'user_id' => $request->user()->user_id,
                'action' => 'UPDATE_USER',
                'entity_type' => 'users',
                'entity_id' => $user->user_id,
                'details' => ['before' => $before, 'after' => $user->only(['full_name', 'user_code', 'phone', 'role_id', 'status'])],
                'ip_address' => $request->ip(),
                'created_at' => now(),
            ]);
            return $user;
        });

        return $this->successResponse($updated, 'Cập nhật người dùng thành công');
    }
}
