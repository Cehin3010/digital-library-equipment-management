<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Bảng categories (Sở hữu: Nguyễn Anh Khoa - 52400051)
     */
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id('category_id');
            $table->string('category_name', 100);
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->timestamps();

            // Khóa ngoại tự tham chiếu phân cấp danh mục (RESTRICT ON DELETE)
            $table->foreign('parent_id')
                ->references('category_id')
                ->on('categories')
                ->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};

