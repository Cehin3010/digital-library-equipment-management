<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Role;
use App\Models\Category;
use App\Models\Resource;
use App\Models\AuditLog;
use App\Services\ResourceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

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
        Storage::fake('public');
        Storage::disk('public')->put('digital_assets/test.pdf', "%PDF-1.4\n%%EOF");

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

    public function test_missing_pdf_returns_not_found_instead_of_a_placeholder(): void
    {
        Storage::fake('public');

        $digitalResource = Resource::create([
            'category_id' => $this->category->category_id,
            'resource_type' => 'DIGITAL',
            'title' => 'Tài Liệu Không Có Tệp',
            'code' => 'DIGI-TEST-MISSING',
            'file_url' => '/storage/digital_assets/missing.pdf',
            'total_quantity' => 100,
            'available_quantity' => 100,
            'status' => 'ACTIVE',
        ]);

        $response = $this->actingAs($this->studentUser, 'sanctum')
            ->getJson("/api/resources/{$digitalResource->resource_id}/read");

        $response->assertNotFound()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Tệp PDF không tồn tại trong kho tài liệu.');

        $this->assertDatabaseMissing('audit_logs', [
            'action' => 'READ_DIGITAL_ASSET',
            'entity_id' => $digitalResource->resource_id,
        ]);
    }

    public function test_uploaded_digital_pdf_is_saved_in_the_public_asset_folder(): void
    {
        Storage::fake('public');

        $resource = app(ResourceService::class)->createResource([
            'category_id' => $this->category->category_id,
            'resource_type' => 'DIGITAL',
            'title' => 'Tài Liệu PDF Đã Tải Lên',
            'code' => 'DIGI-TEST-UPLOAD',
            'total_quantity' => 1,
            'available_quantity' => 1,
        ], UploadedFile::fake()->createWithContent('course.pdf', "%PDF-1.4\n%%EOF"));

        $this->assertStringStartsWith('/storage/digital_assets/', $resource->file_url);
        Storage::disk('public')->assertExists(substr($resource->file_url, strlen('/storage/')));
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

    public function test_unauthenticated_browser_request_receives_json_unauthorized_response(): void
    {
        $digitalResource = Resource::create([
            'category_id' => $this->category->category_id,
            'resource_type' => 'DIGITAL',
            'title' => 'Tài Liệu Đọc Trực Tuyến PDF',
            'code' => 'DIGI-TEST-003',
            'file_url' => '/storage/digital_assets/test.pdf',
            'total_quantity' => 100,
            'available_quantity' => 100,
            'status' => 'ACTIVE',
        ]);

        $response = $this->get("/api/resources/{$digitalResource->resource_id}/read");

        $response->assertUnauthorized()
            ->assertJsonStructure(['message']);
    }
}
