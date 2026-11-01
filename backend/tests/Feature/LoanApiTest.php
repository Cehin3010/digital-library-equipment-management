<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Resource;
use App\Models\Role;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoanApiTest extends TestCase
{
    use RefreshDatabase;

    private User $student;
    private User $librarian;
    private Resource $equipment;
    private Resource $room;

    protected function setUp(): void
    {
        parent::setUp();

        $studentRole = Role::create(['role_name' => 'STUDENT']);
        $librarianRole = Role::create(['role_name' => 'LIBRARIAN']);
        $this->student = User::factory()->create(['role_id' => $studentRole->role_id]);
        $this->librarian = User::factory()->create(['role_id' => $librarianRole->role_id]);

        $category = Category::create(['category_name' => 'Kiểm thử']);
        $this->equipment = Resource::create([
            'category_id' => $category->category_id,
            'resource_type' => 'EQUIPMENT',
            'title' => 'Máy chiếu',
            'code' => 'TEST-PROJECTOR',
            'total_quantity' => 1,
            'available_quantity' => 1,
            'status' => 'ACTIVE',
        ]);
        $this->room = Resource::create([
            'category_id' => $category->category_id,
            'resource_type' => 'ROOM',
            'title' => 'Phòng học nhóm',
            'code' => 'TEST-ROOM',
            'total_quantity' => 1,
            'available_quantity' => 1,
            'status' => 'ACTIVE',
        ]);
    }

    public function test_student_can_hold_confirm_and_cancel_a_loan(): void
    {
        $holdResponse = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/loans/hold', [
                'resource_id' => $this->equipment->resource_id,
                'borrow_from' => now()->addDay()->toDateTimeString(),
                'due_date' => now()->addDays(3)->toDateTimeString(),
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'HOLDING')
            ->assertJsonPath('data.qr_token', fn ($token) => is_string($token) && strlen($token) === 48);
        $loanId = $holdResponse->json('data.loan_id');

        $this->actingAs($this->student, 'sanctum')
            ->getJson("/api/loans/{$loanId}")
            ->assertOk()
            ->assertJsonPath('data.loan_id', $loanId)
            ->assertJsonPath('data.status', 'HOLDING');

        $this->assertDatabaseHas('resources', [
            'resource_id' => $this->equipment->resource_id,
            'available_quantity' => 0,
        ]);

        $this->actingAs($this->student, 'sanctum')
            ->postJson("/api/loans/{$loanId}/confirm")
            ->assertOk()
            ->assertJsonPath('data.status', 'PENDING');

        $this->actingAs($this->student, 'sanctum')
            ->postJson("/api/loans/{$loanId}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status', 'CANCELLED');

        $this->assertDatabaseHas('resources', [
            'resource_id' => $this->equipment->resource_id,
            'available_quantity' => 1,
        ]);
    }

    public function test_same_day_loan_preserves_timezone_and_rejects_past_start_time(): void
    {
        $borrowFrom = now()->addHours(2)->startOfMinute();
        $dueDate = $borrowFrom->copy()->addHours(2);

        $response = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/loans/hold', [
                'resource_id' => $this->equipment->resource_id,
                'borrow_from' => $borrowFrom->toISOString(),
                'due_date' => $dueDate->toISOString(),
            ])
            ->assertCreated();

        $this->assertTrue(Carbon::parse($response->json('data.borrow_from'))->equalTo($borrowFrom));
        $this->assertTrue(Carbon::parse($response->json('data.due_date'))->equalTo($dueDate));

        $loanId = $response->json('data.loan_id');
        $this->actingAs($this->student, 'sanctum')->postJson("/api/loans/{$loanId}/confirm")->assertOk();
        $this->actingAs($this->librarian, 'sanctum')->postJson("/api/loans/{$loanId}/approve")->assertOk();
        $this->actingAs($this->librarian, 'sanctum')
            ->postJson("/api/loans/{$loanId}/return", ['return_condition' => 'GOOD'])
            ->assertOk()
            ->assertJsonPath('data.penalty_required', false)
            ->assertJsonPath('data.loan.status', 'RETURNED');

        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/loans/hold', [
                'resource_id' => $this->equipment->resource_id,
                'borrow_from' => now()->subHour()->toISOString(),
                'due_date' => now()->addHour()->toISOString(),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('borrow_from');
    }

    public function test_librarian_can_handoff_and_receive_a_loan(): void
    {
        $holdResponse = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/loans/hold', [
                'resource_id' => $this->equipment->resource_id,
                'borrow_from' => now()->addDay()->toDateTimeString(),
                'due_date' => now()->addDays(3)->toDateTimeString(),
            ])->assertCreated();
        $loanId = $holdResponse->json('data.loan_id');
        $this->actingAs($this->student, 'sanctum')->postJson("/api/loans/{$loanId}/confirm")->assertOk();

        $this->actingAs($this->librarian, 'sanctum')
            ->postJson("/api/loans/{$loanId}/approve")
            ->assertOk()
            ->assertJsonPath('data.status', 'BORROWING');

        $this->actingAs($this->librarian, 'sanctum')
            ->postJson("/api/loans/{$loanId}/return", ['return_condition' => 'GOOD'])
            ->assertOk()
            ->assertJsonPath('data.loan.status', 'RETURNED');

        $this->assertDatabaseHas('resources', [
            'resource_id' => $this->equipment->resource_id,
            'available_quantity' => 1,
        ]);
    }

    public function test_late_return_creates_an_unpaid_fine_and_notification(): void
    {
        $holdResponse = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/loans/hold', [
                'resource_id' => $this->equipment->resource_id,
                'borrow_from' => now()->addDay()->toDateTimeString(),
                'due_date' => now()->addDays(3)->toDateTimeString(),
            ])->assertCreated();
        $loanId = $holdResponse->json('data.loan_id');
        $this->actingAs($this->student, 'sanctum')->postJson("/api/loans/{$loanId}/confirm")->assertOk();
        $this->actingAs($this->librarian, 'sanctum')->postJson("/api/loans/{$loanId}/approve")->assertOk();

        \App\Models\Loan::query()->whereKey($loanId)->update([
            'due_date' => now()->subDays(2)->addMinute(),
        ]);

        $response = $this->actingAs($this->librarian, 'sanctum')
            ->postJson("/api/loans/{$loanId}/return", ['return_condition' => 'GOOD'])
            ->assertOk()
            ->assertJsonPath('data.penalty_required', true)
            ->assertJsonPath('data.penalties.0.penalty_type', 'OVERDUE');

        $penaltyId = $response->json('data.penalties.0.penalty_id');
        $this->assertDatabaseHas('penalties', [
            'penalty_id' => $penaltyId,
            'loan_id' => $loanId,
            'user_id' => $this->student->user_id,
            'amount' => 10000,
            'status' => 'UNPAID',
        ]);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->student->user_id,
            'related_id' => $penaltyId,
            'type' => 'PENALTY_CREATED',
        ]);
    }

    public function test_damaged_last_copy_is_removed_from_available_inventory_and_billed(): void
    {
        $this->equipment->update(['replacement_cost' => 15000000]);
        $loanId = $this->createBorrowingLoan($this->equipment);

        $response = $this->actingAs($this->librarian, 'sanctum')
            ->postJson("/api/loans/{$loanId}/return", ['return_condition' => 'DAMAGED'])
            ->assertOk()
            ->assertJsonPath('data.penalties.0.penalty_type', 'DAMAGED')
            ->assertJsonPath('data.penalties.0.amount', '50000');

        $this->assertDatabaseHas('resources', [
            'resource_id' => $this->equipment->resource_id,
            'total_quantity' => 0,
            'available_quantity' => 0,
            'status' => 'MAINTENANCE',
        ]);
        $this->assertDatabaseHas('penalties', [
            'penalty_id' => $response->json('data.penalties.0.penalty_id'),
            'status' => 'UNPAID',
            'amount' => 50000,
        ]);
    }

    public function test_lost_equipment_uses_its_replacement_value(): void
    {
        $this->equipment->update(['replacement_cost' => 15000000]);
        $loanId = $this->createBorrowingLoan($this->equipment);

        $this->actingAs($this->librarian, 'sanctum')
            ->postJson("/api/loans/{$loanId}/return", ['return_condition' => 'LOST'])
            ->assertOk()
            ->assertJsonPath('data.penalties.0.penalty_type', 'LOST')
            ->assertJsonPath('data.penalties.0.amount', '15000000');
    }

    public function test_returned_equipment_adds_a_daily_rental_charge(): void
    {
        $this->equipment->update(['rental_fee_per_day' => 30000]);
        $loanId = $this->createBorrowingLoan($this->equipment);

        $this->actingAs($this->librarian, 'sanctum')
            ->postJson("/api/loans/{$loanId}/return", ['return_condition' => 'GOOD'])
            ->assertOk()
            ->assertJsonPath('data.penalties.0.penalty_type', 'RENTAL')
            ->assertJsonPath('data.penalties.0.amount', '30000');
    }

    public function test_printed_book_remains_free_to_borrow(): void
    {
        $book = Resource::create([
            'category_id' => $this->equipment->category_id,
            'resource_type' => 'BOOK',
            'title' => 'Sách kiểm thử',
            'code' => 'TEST-BOOK-FREE',
            'total_quantity' => 1,
            'available_quantity' => 1,
            'rental_fee_per_day' => 0,
            'status' => 'ACTIVE',
        ]);
        $loanId = $this->createBorrowingLoan($book);

        $this->actingAs($this->librarian, 'sanctum')
            ->postJson("/api/loans/{$loanId}/return", ['return_condition' => 'GOOD'])
            ->assertOk()
            ->assertJsonPath('data.penalty_required', false);

        $this->assertDatabaseMissing('penalties', [
            'loan_id' => $loanId,
            'penalty_type' => 'RENTAL',
        ]);
    }

    public function test_room_booking_creates_fee_for_rounded_up_hours(): void
    {
        $this->room->update(['booking_fee_per_hour' => 20000]);
        $start = now()->addHours(3);

        $response = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/room-bookings', [
                'resource_id' => $this->room->resource_id,
                'starts_at' => $start->toDateTimeString(),
                'ends_at' => $start->copy()->addMinutes(90)->toDateTimeString(),
            ])
            ->assertCreated()
            ->assertJsonPath('data.total_fee', 40000);

        $this->assertDatabaseHas('penalties', [
            'room_booking_id' => $response->json('data.room_booking_id'),
            'user_id' => $this->student->user_id,
            'penalty_type' => 'ROOM_BOOKING',
            'amount' => 40000,
            'status' => 'UNPAID',
        ]);
    }

    private function createBorrowingLoan(Resource $resource): int
    {
        $response = $this->actingAs($this->student, 'sanctum')->postJson('/api/loans/hold', [
            'resource_id' => $resource->resource_id,
            'borrow_from' => now()->addHour()->toDateTimeString(),
            'due_date' => now()->addDay()->toDateTimeString(),
        ])->assertCreated();
        $loanId = $response->json('data.loan_id');

        $this->actingAs($this->student, 'sanctum')->postJson("/api/loans/{$loanId}/confirm")->assertOk();
        $this->actingAs($this->librarian, 'sanctum')->postJson("/api/loans/{$loanId}/approve")->assertOk();

        return $loanId;
    }

    public function test_librarian_can_reject_a_loan_and_release_inventory(): void
    {
        $holdResponse = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/loans/hold', [
                'resource_id' => $this->equipment->resource_id,
                'borrow_from' => now()->addDay()->toDateTimeString(),
                'due_date' => now()->addDays(3)->toDateTimeString(),
            ])->assertCreated();
        $loanId = $holdResponse->json('data.loan_id');
        $this->actingAs($this->student, 'sanctum')->postJson("/api/loans/{$loanId}/confirm")->assertOk();

        $this->actingAs($this->librarian, 'sanctum')
            ->postJson("/api/loans/{$loanId}/reject", ['reason' => 'Tài sản đang được kiểm tra.'])
            ->assertOk()
            ->assertJsonPath('data.status', 'REJECTED');

        $this->assertDatabaseHas('resources', [
            'resource_id' => $this->equipment->resource_id,
            'available_quantity' => 1,
        ]);
    }

    public function test_expired_hold_is_released_when_confirmed(): void
    {
        $holdResponse = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/loans/hold', [
                'resource_id' => $this->equipment->resource_id,
                'borrow_from' => now()->addDay()->toDateTimeString(),
                'due_date' => now()->addDays(3)->toDateTimeString(),
            ])->assertCreated();
        $loanId = $holdResponse->json('data.loan_id');
        \App\Models\Loan::query()->whereKey($loanId)->update(['hold_expires_at' => now()->subMinute()]);

        $this->actingAs($this->student, 'sanctum')
            ->postJson("/api/loans/{$loanId}/confirm")
            ->assertStatus(409);

        $this->assertDatabaseHas('loans', ['loan_id' => $loanId, 'status' => 'EXPIRED']);
        $this->assertDatabaseHas('resources', [
            'resource_id' => $this->equipment->resource_id,
            'available_quantity' => 1,
        ]);
    }

    public function test_room_booking_rejects_overlapping_times(): void
    {
        $start = now()->addDays(2)->setTime(10, 0, 0);
        $end = $start->copy()->addHour();
        $payload = [
            'resource_id' => $this->room->resource_id,
            'starts_at' => $start->toDateTimeString(),
            'ends_at' => $end->toDateTimeString(),
            'purpose' => 'Thảo luận nhóm',
        ];

        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/room-bookings', $payload)
            ->assertCreated()
            ->assertJsonPath('data.status', 'CONFIRMED');

        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/room-bookings', [
                ...$payload,
                'starts_at' => $start->copy()->addMinutes(30)->toDateTimeString(),
                'ends_at' => $end->copy()->addMinutes(30)->toDateTimeString(),
            ])
            ->assertStatus(409);
    }
}
