<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Bảng login_otps (Sở hữu: Lý Hạo Danh - 52400175 | F-11)
     */
    public function up(): void
    {
        Schema::create('login_otps', function (Blueprint $table) {
            $table->id('otp_id');
            $table->string('email', 100)->index();
            $table->string('otp_hash', 255);
            $table->integer('attempts')->default(0);
            $table->timestamp('expires_at');
            $table->timestamp('created_at')->useCurrent();

            $table->index(['email', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('login_otps');
    }
};
