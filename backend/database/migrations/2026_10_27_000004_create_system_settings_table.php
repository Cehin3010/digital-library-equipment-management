<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Bảng system_settings (Sở hữu: Lý Hạo Danh - 52400175 | F-06, F-08, F-11)
     */
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->string('setting_key', 50)->primary();
            $table->string('setting_value', 100);
            $table->string('description', 255)->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamp('updated_at')->useCurrent();

            // Ràng buộc khóa ngoại RESTRICT ON DELETE
            $table->foreign('updated_by')
                ->references('user_id')
                ->on('users')
                ->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
