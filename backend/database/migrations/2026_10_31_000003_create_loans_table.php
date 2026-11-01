<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loans', function (Blueprint $table) {
            $table->id('loan_id');
            $table->string('qr_token', 64)->unique();
            $table->unsignedBigInteger('user_id')->index();
            $table->unsignedBigInteger('resource_id');
            $table->string('status', 20)->default('HOLDING')->index();
            $table->timestamp('borrow_from');
            $table->timestamp('due_date');
            $table->timestamp('requested_at');
            $table->timestamp('hold_expires_at')->nullable()->index();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->unsignedBigInteger('received_by')->nullable();
            $table->timestamp('returned_at')->nullable();
            $table->string('return_condition', 20)->nullable();
            $table->text('reject_reason')->nullable();

            $table->foreign('resource_id')
                ->references('resource_id')
                ->on('resources')
                ->restrictOnDelete();
            $table->index(['resource_id', 'status', 'borrow_from', 'due_date'], 'loans_resource_schedule_idx');
            $table->index(['user_id', 'requested_at'], 'loans_user_requested_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loans');
    }
};
