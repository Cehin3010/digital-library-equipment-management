<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('penalties', function (Blueprint $table) {
            $table->id('penalty_id');
            $table->unsignedBigInteger('loan_id')->nullable()->index();
            $table->unsignedBigInteger('user_id')->index();
            $table->string('penalty_type', 20);
            $table->unsignedInteger('overdue_days')->default(0);
            $table->unsignedBigInteger('amount');
            $table->string('status', 20)->default('UNPAID')->index();
            $table->text('note')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamp('created_at');
            $table->timestamp('paid_at')->nullable();

            $table->foreign('loan_id')->references('loan_id')->on('loans')->nullOnDelete();
            $table->foreign('user_id')->references('user_id')->on('users')->cascadeOnDelete();
            $table->foreign('created_by')->references('user_id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('penalties');
    }
};
