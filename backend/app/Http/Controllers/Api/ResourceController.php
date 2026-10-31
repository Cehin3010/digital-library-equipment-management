<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreResourceRequest;
use App\Http\Requests\UpdateResourceRequest;
use App\Http\Requests\ResourceScheduleRequest;
use App\Services\ResourceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class ResourceController extends Controller
{
    public function __construct(
        protected ResourceService $resourceService
    ) {}

    /**
     * Tra cứu tài nguyên đa tiêu chí (F-01)
     * GET /api/resources
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $resources = $this->resourceService->listResources($request->all());
            return $this->successResponse($resources, 'Tra cứu danh sách tài nguyên thành công');
        } catch (Throwable $e) {
            return $this->errorResponse('Lỗi tra cứu tài nguyên: ' . $e->getMessage(), null, 500);
        }
    }

    /**
     * Xem thông tin chi tiết một tài nguyên (F-01)
     * GET /api/resources/{id}
     */
    public function show(int $id): JsonResponse
    {
        try {
            $resource = $this->resourceService->getResourceById($id);
            return $this->successResponse($resource, 'Lấy chi tiết tài nguyên thành công');
        } catch (Throwable $e) {
            return $this->errorResponse('Không tìm thấy tài nguyên yêu cầu', null, 404);
        }
    }

    /**
     * Thêm mới tài nguyên kèm upload file PDF (F-01, F-02)
     * POST /api/resources
     */
    public function store(StoreResourceRequest $request): JsonResponse
    {
        try {
            $resource = $this->resourceService->createResource(
                $request->validated(),
                $request->file('file')
            );
            return $this->successResponse($resource, 'Thêm mới tài nguyên thành công', 201);
        } catch (Throwable $e) {
            return $this->errorResponse('Không thể tạo tài nguyên: ' . $e->getMessage(), null, 400);
        }
    }

    /**
     * Cập nhật thông tin tài nguyên (F-01)
     * PUT /api/resources/{id}
     */
    public function update(UpdateResourceRequest $request, int $id): JsonResponse
    {
        try {
            $resource = $this->resourceService->updateResource(
                $id,
                $request->validated(),
                $request->file('file')
            );
            return $this->successResponse($resource, 'Cập nhật tài nguyên thành công');
        } catch (Throwable $e) {
            return $this->errorResponse('Không thể cập nhật tài nguyên: ' . $e->getMessage(), null, 400);
        }
    }

    /**
     * Xóa mềm tài nguyên (chuyển status = 'INACTIVE') (F-01)
     * DELETE /api/resources/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->resourceService->deleteResource($id);
            return $this->successResponse(null, 'Xóa mềm tài nguyên thành công');
        } catch (Throwable $e) {
            // Chặn xóa nếu có phiếu mượn hoạt động -> trả 409 Conflict
            return $this->errorResponse($e->getMessage(), null, 409);
        }
    }

    /**
     * Lấy lịch sử dụng tài nguyên / phòng học dạng tuần (F-07, W2)
     * GET /api/resources/{id}/schedule
     */
    public function schedule(ResourceScheduleRequest $request, int $id): JsonResponse
    {
        try {
            $data = $this->resourceService->getResourceSchedule(
                $id,
                $request->input('start_date'),
                $request->input('end_date')
            );
            return $this->successResponse($data, 'Lấy lịch trống tài nguyên thành công');
        } catch (Throwable $e) {
            return $this->errorResponse('Không thể tải lịch của tài nguyên: ' . $e->getMessage(), null, 400);
        }
    }

    /**
     * Online Reader: Stream PDF trực tiếp trên trình duyệt (F-02)
     * GET /api/resources/{id}/read
     */
    public function streamPdf(Request $request, int $id): Response
    {
        try {
            return $this->resourceService->streamPdf(
                $id,
                $request->user()?->user_id,
                $request->ip()
            );
        } catch (Throwable $e) {
            return $this->errorResponse($e->getMessage(), null, 400);
        }
    }
}
