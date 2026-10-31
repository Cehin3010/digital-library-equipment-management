<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Role;
use App\Models\Category;
use App\Models\Resource;
use App\Models\Loan;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ReportApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $lecturerUser;
    protected User $studentUser;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::firstOrCreate(['role_name' => 'ADMIN'], ['description' => 'Quản trị viên']);
        $lecturerRole = Role::firstOrCreate(['role_name' => 'LECTURER'], ['description' => 'Giảng viên']);
        $studentRole = Role::firstOrCreate(['role_name' => 'STUDENT'], ['description' => 'Sinh viên']);

        $this->adminUser = User::factory()->create(['role_id' => $adminRole->role_id, 'status' => 'ACTIVE']);
        $this->lecturerUser = User::factory()->create(['role_id' => $lecturerRole->role_id, 'status' => 'ACTIVE']);
        $this->studentUser = User::factory()->create(['role_id' => $studentRole->role_id, 'status' => 'ACTIVE']);
    }

    public function test_admin_and_lecturer_can_view_dashboard_stats(): void
    {
        $response = $this->actingAs($this->lecturerUser, 'sanctum')
            ->getJson('/api/reports/dashboard');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'overview' => [
                        'total_resources',
                        'active_resources',
                        'total_physical_quantity',
                        'lending_rate',
                    ],
                    'by_type',
                    'loans_status',
                    'top_resources',
                    'monthly_trend',
                ],
            ]);
    }

    public function test_student_cannot_view_dashboard_stats(): void
    {
        $response = $this->actingAs($this->studentUser, 'sanctum')
            ->getJson('/api/reports/dashboard');

        $response->assertStatus(403);
    }

    public function test_admin_can_export_reports_as_csv(): void
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->get('/api/reports/export?type=usage&format=csv');

        $response->assertStatus(200);
        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('attachment', $response->headers->get('Content-Disposition'));
    }
}

