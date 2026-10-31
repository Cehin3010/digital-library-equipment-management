<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Bảng users (Sở hữu: Lý Hạo Danh - 52400175 | F-11)
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id('user_id');
            $table->string('email', 100)->unique();
            $table->string('full_name', 100);
            $table->string('user_code', 20)->unique();
            $table->string('phone', 20)->nullable();
            $table->unsignedBigInteger('role_id');
            $table->string('status', 20)->default('ACTIVE'); // ACTIVE, LOCKED
            $table->timestamp('last_login_at')->nullable();
            $table->timestamps();

            $table->index(['role_id', 'status']);

            // Ràng buộc khóa ngoại RESTRICT ON DELETE bảo toàn lịch sử (Mục 3.5 database.md)
            $table->foreign('role_id')
                ->references('role_id')
                ->on('roles')
                ->restrictOnDelete();
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE users ADD CONSTRAINT chk_users_status CHECK (status IN ('ACTIVE', 'LOCKED'))");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
