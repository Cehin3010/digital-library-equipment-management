<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Resource;
use App\Models\Loan;
use App\Models\RoomBooking;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Exception;

class ResourceService
{
    /**
     * Lấy danh sách danh mục phân cấp (F-01)
     */
    public function getCategoriesTree(): Collection
    {
        return Category::with(['children' => function ($query) {
            $query->withCount('resources');
        }])
        ->withCount('resources')
        ->whereNull('parent_id')
        ->orderBy('category_name')
        ->get();
    }

    /**
     * Lấy toàn bộ danh mục dạng phẳng để làm dropdown
     */
    public function getAllCategories(): Collection
    {
        return Category::with('parent')
            ->withCount('resources')
            ->orderBy('category_name')
            ->get();
    }

    /**
     * Tạo mới danh mục
     */
    public function createCategory(array $data): Category
    {
        return DB::transaction(function () use ($data) {
            return Category::create([
                'category_name' => trim($data['category_name']),
                'parent_id' => $data['parent_id'] ?? null,
            ]);
        });
    }

    /**
     * Tra cứu tài nguyên đa tiêu chí với chỉ mục GIN tối ưu < 2s (F-01)
     */
    public function listResources(array $filters): LengthAwarePaginator
    {
        $query = Resource::with('category');

        // Tìm kiếm toàn văn qua GIN Index
        if (!empty($filters['keyword'])) {
            $query->searchKeyword($filters['keyword']);
        }

        // Lọc theo loại tài nguyên (DIGITAL, BOOK, EQUIPMENT, ROOM)
        if (!empty($filters['resource_type'])) {
            $query->filterType($filters['resource_type']);
        }

        // Lọc theo danh mục
        if (!empty($filters['category_id'])) {
            $query->filterCategory((int) $filters['category_id']);
        }

        // Lọc theo trạng thái
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        } else {
            // Mặc định ẩn các bản ghi đã xóa mềm (INACTIVE) đối với người dùng thông thường
            if (empty($filters['include_inactive'])) {
                $query->where('status', '!=', 'INACTIVE');
            }
        }

        // Sắp xếp
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = strtolower($filters['sort_order'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        if (in_array($sortBy, ['title', 'code', 'created_at', 'available_quantity'], true)) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $perPage = (int) ($filters['per_page'] ?? 12);
        return $query->paginate(max(1, min($perPage, 100)));
    }

    /**
     * Xem thông tin chi tiết một tài nguyên
     */
    public function getResourceById(int $id): Resource
    {
        return Resource::with('category')->findOrFail($id);
    }

    /**
     * Thêm mới tài nguyên kèm upload file PDF nếu là DIGITAL (F-01, F-02)
     */
    public function createResource(array $data, $uploadedFile = null): Resource
    {
        return DB::transaction(function () use ($data, $uploadedFile) {
            $fileUrl = $data['file_url'] ?? null;

            // Xử lý upload file cho tài liệu số
            if ($uploadedFile && $uploadedFile->isValid()) {
                $path = $uploadedFile->store('digital_assets', 'public');
                $fileUrl = '/storage/' . $path;
            }

            $totalQuantity = (int) ($data['total_quantity'] ?? 1);
            $availableQuantity = isset($data['available_quantity'])
                ? (int) $data['available_quantity']
                : $totalQuantity;

            // Ràng buộc số lượng khả dụng
            if ($availableQuantity > $totalQuantity) {
                throw new Exception('Số lượng khả dụng không được lớn hơn tổng số lượng.');
            }

            if ($availableQuantity < 0 || $totalQuantity < 0) {
                throw new Exception('Số lượng không được âm.');
            }

            if (strtoupper($data['resource_type']) === 'DIGITAL' && blank($fileUrl)) {
                throw new Exception('Tài liệu số phải đính kèm tệp PDF thật.');
            }

            $resourceType = strtoupper($data['resource_type']);
            return Resource::create([
                'category_id' => $data['category_id'],
                'resource_type' => $resourceType,
                'title' => trim($data['title']),
                'author_or_brand' => isset($data['author_or_brand']) ? trim($data['author_or_brand']) : null,
                'code' => trim($data['code']),
                'file_url' => $fileUrl,
                'description' => $data['description'] ?? null,
                'location' => $data['location'] ?? null,
                'total_quantity' => $totalQuantity,
                'available_quantity' => $availableQuantity,
                'rental_fee_per_day' => $resourceType === 'EQUIPMENT' ? (int) ($data['rental_fee_per_day'] ?? 0) : 0,
                'replacement_cost' => (int) ($data['replacement_cost'] ?? 0),
                'booking_fee_per_hour' => (int) ($data['booking_fee_per_hour'] ?? 0),
                'status' => $data['status'] ?? 'ACTIVE',
            ]);
        });
    }

    /**
     * Cập nhật tài nguyên (F-01)
     */
    public function updateResource(int $id, array $data, $uploadedFile = null): Resource
    {
        return DB::transaction(function () use ($id, $data, $uploadedFile) {
            $resource = Resource::lockForUpdate()->findOrFail($id);

            if ($uploadedFile && $uploadedFile->isValid()) {
                $path = $uploadedFile->store('digital_assets', 'public');
                $data['file_url'] = '/storage/' . $path;
            }

            $totalQuantity = isset($data['total_quantity'])
                ? (int) $data['total_quantity']
                : $resource->total_quantity;

            $availableQuantity = isset($data['available_quantity'])
                ? (int) $data['available_quantity']
                : $resource->available_quantity;

            if ($availableQuantity > $totalQuantity) {
                throw new Exception('Số lượng khả dụng không được lớn hơn tổng số lượng.');
            }

            if ($availableQuantity < 0 || $totalQuantity < 0) {
                throw new Exception('Số lượng không được âm.');
            }

            $resourceType = strtoupper($data['resource_type'] ?? $resource->resource_type);
            $fileUrl = $data['file_url'] ?? $resource->file_url;
            if ($resourceType === 'DIGITAL' && blank($fileUrl)) {
                throw new Exception('Tài liệu số phải đính kèm tệp PDF thật.');
            }

            $resource->update([
                'category_id' => $data['category_id'] ?? $resource->category_id,
                'resource_type' => $resourceType,
                'title' => isset($data['title']) ? trim($data['title']) : $resource->title,
                'author_or_brand' => array_key_exists('author_or_brand', $data) ? $data['author_or_brand'] : $resource->author_or_brand,
                'code' => isset($data['code']) ? trim($data['code']) : $resource->code,
                'file_url' => $fileUrl,
                'description' => array_key_exists('description', $data) ? $data['description'] : $resource->description,
                'location' => array_key_exists('location', $data) ? $data['location'] : $resource->location,
                'total_quantity' => $totalQuantity,
                'available_quantity' => $availableQuantity,
                'rental_fee_per_day' => $resourceType === 'EQUIPMENT'
                    ? ($data['rental_fee_per_day'] ?? $resource->rental_fee_per_day)
                    : 0,
                'replacement_cost' => $data['replacement_cost'] ?? $resource->replacement_cost,
                'booking_fee_per_hour' => $data['booking_fee_per_hour'] ?? $resource->booking_fee_per_hour,
                'status' => $data['status'] ?? $resource->status,
            ]);

            return $resource->fresh('category');
        });
    }

    /**
     * Xóa mềm tài nguyên bằng cách cập nhật status = 'INACTIVE'
     * Chặn xóa nếu đang có phiếu HOLDING, PENDING hoặc BORROWING
     */
    public function deleteResource(int $id): bool
    {
        return DB::transaction(function () use ($id) {
            $resource = Resource::lockForUpdate()->findOrFail($id);

            // Kiểm tra ràng buộc phiếu mượn đang hoạt động
            $activeLoanExists = Loan::where('resource_id', $id)
                ->whereIn('status', ['HOLDING', 'PENDING', 'BORROWING'])
                ->exists();

            if ($activeLoanExists) {
                throw new Exception('Không thể xóa tài sản đang có người mượn hoặc giữ chỗ.');
            }

            $resource->status = 'INACTIVE';
            return $resource->save();
        });
    }

    /**
     * Lấy lịch sử khung giờ đã kín để hiển thị bảng lịch trống tuần (W2, F-07)
     */
    public function getResourceSchedule(int $id, ?string $startDate = null, ?string $endDate = null): array
    {
        $resource = Resource::findOrFail($id);

        $start = $startDate ? date('Y-m-d 00:00:00', strtotime($startDate)) : now()->startOfWeek()->toDateTimeString();
        $end = $endDate ? date('Y-m-d 23:59:59', strtotime($endDate)) : now()->endOfWeek()->toDateTimeString();

        if ($resource->resource_type === 'ROOM') {
            $busySlots = RoomBooking::with('user:user_id,full_name,user_code')
                ->where('resource_id', $id)
                ->where('status', 'CONFIRMED')
                ->where('starts_at', '<=', $end)
                ->where('ends_at', '>=', $start)
                ->orderBy('starts_at')
                ->get()
                ->map(fn ($booking) => [
                    'room_booking_id' => $booking->room_booking_id,
                    'borrow_from' => $booking->starts_at->toDateTimeString(),
                    'due_date' => $booking->ends_at->toDateTimeString(),
                    'status' => $booking->status,
                    'user_code' => $booking->user?->user_code,
                ]);
        } else {
            $busySlots = Loan::with('user:user_id,full_name,user_code')
                ->where('resource_id', $id)
                ->whereIn('status', ['HOLDING', 'PENDING', 'BORROWING'])
                ->where(function ($query) use ($start, $end) {
                    $query->whereBetween('borrow_from', [$start, $end])
                          ->orWhereBetween('due_date', [$start, $end])
                          ->orWhere(function ($q) use ($start, $end) {
                              $q->where('borrow_from', '<=', $start)
                                ->where('due_date', '>=', $end);
                          });
                })
                ->orderBy('borrow_from')
                ->get()
                ->map(fn ($loan) => [
                    'loan_id' => $loan->loan_id,
                    'borrow_from' => $loan->borrow_from->toDateTimeString(),
                    'due_date' => $loan->due_date->toDateTimeString(),
                    'status' => $loan->status,
                    'user_code' => $loan->user?->user_code,
                ]);
        }

        return [
            'resource' => [
                'resource_id' => $resource->resource_id,
                'title' => $resource->title,
                'code' => $resource->code,
                'resource_type' => $resource->resource_type,
                'location' => $resource->location,
            ],
            'time_range' => [
                'start_date' => $start,
                'end_date' => $end,
            ],
            'occupied_slots' => $busySlots,
        ];
    }

    /**
     * Online Reader: Stream PDF trực tiếp trên trình duyệt (F-02)
     */
    public function streamPdf(int $id, ?int $userId = null, ?string $ipAddress = null): StreamedResponse|BinaryFileResponse
    {
        $resource = Resource::findOrFail($id);

        if ($resource->resource_type !== 'DIGITAL') {
            throw new Exception('Chỉ tài liệu số (DIGITAL) mới có thể đọc trực tuyến.');
        }

        if (blank($resource->file_url)) {
            throw new Exception('Tài liệu số này chưa được gắn tệp tin PDF.');
        }

        if (!str_starts_with($resource->file_url, '/storage/digital_assets/')) {
            throw new NotFoundHttpException('Tệp PDF không tồn tại trong kho tài liệu.');
        }

        $relativePath = substr($resource->file_url, strlen('/storage/'));
        if (!Storage::disk('public')->exists($relativePath)) {
            throw new NotFoundHttpException('Tệp PDF không tồn tại trong kho tài liệu.');
        }

        $fullPath = Storage::disk('public')->path($relativePath);
        AuditService::logReading($userId, $resource, $ipAddress);

        return response()->file($fullPath, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . basename($fullPath) . '"',
            'Cache-Control' => 'no-cache, private',
        ]);
    }
}
