<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Role;
use App\Models\Category;
use App\Models\Resource;
use App\Models\AuditLog;
use Illuminate\Foundation\Testing\RefreshDatabase;

class OnlineReaderApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $studentUser;
    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $studentRole = Role::firstOrCreate(['role_name' => 'STUDENT'], ['description' => 'Sinh viên']);
        $this->studentUser = User::factory()->create(['role_id' => $studentRole->role_id, 'status' => 'ACTIVE']);

        $this->category = Category::create(['category_name' => 'Tài Liệu Số']);
    }

    public function test_can_read_digital_pdf_and_logs_reading_event(): void
    {
        $digitalResource = Resource::create([
            'category_id' => $this->category->category_id,
            'resource_type' => 'DIGITAL',
            'title' => 'Tài Liệu Đọc Trực Tuyến PDF',
            'code' => 'DIGI-TEST-001',
            'file_url' => '/storage/digital_assets/test.pdf',
            'total_quantity' => 100,
            'available_quantity' => 100,
            'status' => 'ACTIVE',
        ]);

        $response = $this->actingAs($this->studentUser, 'sanctum')
            ->get("/api/resources/{$digitalResource->resource_id}/read");

        $response->assertStatus(200);
        $this->assertEquals('application/pdf', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('inline', $response->headers->get('Content-Disposition'));

        // Kiểm tra lượt đọc đã được ghi vào audit_logs
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'READ_DIGITAL_ASSET',
            'entity_type' => 'resources',
            'entity_id' => $digitalResource->resource_id,
        ]);
    }

    public function test_cannot_read_physical_equipment_online(): void
    {
        $equipment = Resource::create([
            'category_id' => $this->category->category_id,
            'resource_type' => 'EQUIPMENT',
            'title' => 'Máy Chiếu Vật Lý',
            'code' => 'DEV-TEST-002',
            'total_quantity' => 2,
            'available_quantity' => 2,
            'status' => 'ACTIVE',
        ]);

        $response = $this->actingAs($this->studentUser, 'sanctum')
            ->getJson("/api/resources/{$equipment->resource_id}/read");

        $response->assertStatus(400)
            ->assertJsonPath('success', false);
    }
}

