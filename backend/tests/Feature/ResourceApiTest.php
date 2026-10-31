<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Role;
use App\Models\Category;
use App\Models\Resource;
use App\Models\Loan;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ResourceApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $studentUser;
    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::firstOrCreate(['role_name' => 'ADMIN'], ['description' => 'Quản trị viên']);
        $studentRole = Role::firstOrCreate(['role_name' => 'STUDENT'], ['description' => 'Sinh viên']);

        $this->adminUser = User::factory()->create(['role_id' => $adminRole->role_id, 'status' => 'ACTIVE']);
        $this->studentUser = User::factory()->create(['role_id' => $studentRole->role_id, 'status' => 'ACTIVE']);

        $this->category = Category::create(['category_name' => 'Sách Chuyên Khảo']);
    }

    public function test_authenticated_user_can_search_resources_and_see_status_badges(): void
    {
        // Tạo tài nguyên còn trống -> AVAILABLE (Xanh)
        Resource::create([
            'category_id' => $this->category->category_id,
            'resource_type' => 'BOOK',
            'title' => 'Lập trình Python Nâng cao',
            'author_or_brand' => 'Tác giả A',
            'code' => 'BOOK-PY-01',
            'total_quantity' => 5,
            'available_quantity' => 2,
            'status' => 'ACTIVE',
        ]);

        // Tạo tài nguyên đã mượn hết -> BORROWED (Đỏ)
        Resource::create([
            'category_id' => $this->category->category_id,
            'resource_type' => 'EQUIPMENT',
            'title' => 'Máy quay Sony FX3',
            'author_or_brand' => 'Sony',
            'code' => 'DEV-SONY-01',
            'total_quantity' => 1,
            'available_quantity' => 0,
            'status' => 'ACTIVE',
        ]);

        $response = $this->actingAs($this->studentUser, 'sanctum')
            ->getJson('/api/resources?keyword=Python');

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $items = $response->json('data.data');
        $this->assertNotEmpty($items);
        $this->assertEquals('AVAILABLE', $items[0]['status_badge']);
        $this->assertEquals('green', $items[0]['status_color']);
    }

    public function test_admin_can_create_new_resource(): void
    {
        $payload = [
            'category_id' => $this->category->category_id,
            'resource_type' => 'BOOK',
            'title' => 'Cấu trúc Dữ liệu & Giải thuật',
            'author_or_brand' => 'Đỗ Xuân Lôi',
            'code' => 'ISBN-9786049112233',
            'location' => 'Kệ B2',
            'total_quantity' => 10,
            'available_quantity' => 10,
            'status' => 'ACTIVE',
        ];

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/resources', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.code', 'ISBN-9786049112233');

        $this->assertDatabaseHas('resources', ['code' => 'ISBN-9786049112233']);
    }

    public function test_cannot_create_resource_with_invalid_quantity(): void
    {
        $payload = [
            'category_id' => $this->category->category_id,
            'resource_type' => 'EQUIPMENT',
            'title' => 'Máy Chiếu Lỗi Tồn Kho',
            'code' => 'DEV-ERR-01',
            'total_quantity' => 5,
            'available_quantity' => 8, // Lỗi: available > total
        ];

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/resources', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['available_quantity']);
    }

    public function test_cannot_delete_resource_when_active_loan_exists(): void
    {
        $resource = Resource::create([
            'category_id' => $this->category->category_id,
            'resource_type' => 'BOOK',
            'title' => 'Sách Đang Được Mượn',
            'code' => 'BOOK-BUSY-01',
            'total_quantity' => 1,
            'available_quantity' => 0,
            'status' => 'ACTIVE',
        ]);

        // Tạo phiếu mượn đang active (BORROWING)
        Loan::create([
            'qr_token' => 'TOKEN_123456',
            'user_id' => $this->studentUser->user_id,
            'resource_id' => $resource->resource_id,
            'status' => 'BORROWING',
            'borrow_from' => now(),
            'due_date' => now()->addDays(7),
            'requested_at' => now(),
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->deleteJson("/api/resources/{$resource->resource_id}");

        $response->assertStatus(409)
            ->assertJsonPath('success', false);

        // Đảm bảo không bị chuyển INACTIVE
        $this->assertDatabaseHas('resources', [
            'resource_id' => $resource->resource_id,
            'status' => 'ACTIVE',
        ]);
    }

    public function test_can_soft_delete_resource_without_active_loans(): void
    {
        $resource = Resource::create([
            'category_id' => $this->category->category_id,
            'resource_type' => 'BOOK',
            'title' => 'Sách Rảnh Rỗi Cần Xóa',
            'code' => 'BOOK-FREE-01',
            'total_quantity' => 1,
            'available_quantity' => 1,
            'status' => 'ACTIVE',
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->deleteJson("/api/resources/{$resource->resource_id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('resources', [
            'resource_id' => $resource->resource_id,
            'status' => 'INACTIVE',
        ]);
    }
}

