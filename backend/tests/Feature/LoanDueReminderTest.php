<?php

namespace Tests\Feature;

use App\Mail\LoanDueReminderMail;
use App\Models\Category;
use App\Models\Loan;
use App\Models\Resource;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

class LoanDueReminderTest extends TestCase
{
    use RefreshDatabase;

    public function test_due_loan_receives_one_email_and_in_app_reminder(): void
    {
        Mail::fake();
        $role = Role::create(['role_name' => 'STUDENT']);
        $user = User::factory()->create(['role_id' => $role->role_id]);
        $category = Category::create(['category_name' => 'Nhắc hạn']);
        $resource = Resource::create([
            'category_id' => $category->category_id,
            'resource_type' => 'BOOK',
            'title' => 'Sách kiểm thử',
            'code' => 'REMINDER-BOOK',
            'total_quantity' => 1,
            'available_quantity' => 0,
            'status' => 'ACTIVE',
        ]);
        $loan = Loan::create([
            'qr_token' => Str::random(48),
            'user_id' => $user->user_id,
            'resource_id' => $resource->resource_id,
            'status' => 'BORROWING',
            'borrow_from' => now(),
            'due_date' => now()->addDays(3),
            'requested_at' => now(),
        ]);

        $this->assertSame(0, Artisan::call('loans:send-due-reminders'));
        $this->assertSame(0, Artisan::call('loans:send-due-reminders'));

        Mail::assertSent(LoanDueReminderMail::class);
        $this->assertCount(1, Mail::sent(LoanDueReminderMail::class));
        $this->assertDatabaseHas('notifications', [
            'user_id' => $user->user_id,
            'type' => 'LOAN_DUE_3_DAYS',
            'related_type' => 'loan',
            'related_id' => $loan->loan_id,
        ]);
    }
}
