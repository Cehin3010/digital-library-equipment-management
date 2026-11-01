<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id('payment_id');
            $table->unsignedBigInteger('penalty_id')->index();
            $table->unsignedBigInteger('user_id')->index();
            $table->string('provider', 20);
            $table->string('txn_ref', 64)->unique();
            $table->unsignedBigInteger('amount');
            $table->string('status', 20)->default('PENDING')->index();
            $table->string('provider_transaction_id', 100)->nullable();
            $table->timestamp('created_at');
            $table->timestamp('updated_at')->nullable();

            $table->foreign('penalty_id')->references('penalty_id')->on('penalties')->restrictOnDelete();
            $table->foreign('user_id')->references('user_id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
