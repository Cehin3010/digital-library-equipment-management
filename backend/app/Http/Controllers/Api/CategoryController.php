<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Services\ResourceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class CategoryController extends Controller
{
    public function __construct(
        protected ResourceService $resourceService
    ) {}

    /**
     * Lấy danh sách danh mục phân cấp (F-01)
     * GET /api/categories
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $data = $request->boolean('flat')
                ? $this->resourceService->getAllCategories()
                : $this->resourceService->getCategoriesTree();

            return $this->successResponse($data, 'Lấy danh sách danh mục thành công');
        } catch (Throwable $e) {
            return $this->errorResponse('Không thể tải danh sách danh mục: ' . $e->getMessage(), null, 500);
        }
    }

    /**
     * Thêm mới danh mục
     * POST /api/categories
     */
    public function store(StoreCategoryRequest $request): JsonResponse
    {
        try {
            $category = $this->resourceService->createCategory($request->validated());
            return $this->successResponse($category, 'Thêm mới danh mục thành công', 201);
        } catch (Throwable $e) {
            return $this->errorResponse('Lỗi khi thêm mới danh mục: ' . $e->getMessage(), null, 400);
        }
    }
}

