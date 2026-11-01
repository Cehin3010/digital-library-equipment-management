<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Role;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;

class CategoryApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $studentUser;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::firstOrCreate(['role_name' => 'ADMIN'], ['description' => 'Quản trị viên']);
        $studentRole = Role::firstOrCreate(['role_name' => 'STUDENT'], ['description' => 'Sinh viên']);

        $this->adminUser = User::factory()->create(['role_id' => $adminRole->role_id, 'status' => 'ACTIVE']);
        $this->studentUser = User::factory()->create(['role_id' => $studentRole->role_id, 'status' => 'ACTIVE']);
    }

    public function test_authenticated_user_can_list_categories(): void
    {
        Category::create(['category_name' => 'Sách Giáo Trình']);

        $response = $this->actingAs($this->studentUser, 'sanctum')
            ->getJson('/api/categories');

        $response->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    public function test_librarian_or_admin_can_create_category(): void
    {
        $payload = [
            'category_name' => 'Khoa Học Máy Tính',
        ];

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/categories', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.category_name', 'Khoa Học Máy Tính');

        $this->assertDatabaseHas('categories', ['category_name' => 'Khoa Học Máy Tính']);
    }

    public function test_student_cannot_create_category(): void
    {
        $payload = [
            'category_name' => 'Danh mục trái phép',
        ];

        $response = $this->actingAs($this->studentUser, 'sanctum')
            ->postJson('/api/categories', $payload);

        $response->assertStatus(403);
    }
}

