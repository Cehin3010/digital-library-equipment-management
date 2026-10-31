<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Bảng resources (Sở hữu: Nguyễn Anh Khoa - 52400051)
     */
    public function up(): void
    {
        Schema::create('resources', function (Blueprint $table) {
            $table->id('resource_id');
            $table->unsignedBigInteger('category_id');
            $table->string('resource_type', 20); // DIGITAL, BOOK, EQUIPMENT, ROOM
            $table->string('title', 255);
            $table->string('author_or_brand', 150)->nullable();
            $table->string('code', 50)->unique(); // ISBN, Serial, Mã phòng
            $table->string('file_url', 500)->nullable(); // Tệp PDF cho DIGITAL (F-02)
            $table->text('description')->nullable();
            $table->string('location', 100)->nullable();
            $table->integer('total_quantity')->default(1);
            $table->integer('available_quantity')->default(1);
            $table->string('status', 20)->default('ACTIVE'); // ACTIVE, MAINTENANCE, INACTIVE
            $table->timestamps();

            // Khóa ngoại ràng buộc chặt chẽ với danh mục (RESTRICT ON DELETE)
            $table->foreign('category_id')
                ->references('category_id')
                ->on('categories')
                ->restrictOnDelete();

            // Chỉ mục B-Tree hỗ trợ lọc nhanh
            $table->index('resource_type', 'idx_resources_type');
            $table->index('status', 'idx_resources_status');
            $table->index(['status', 'available_quantity'], 'idx_resources_availability');
        });

        // Áp dụng ràng buộc CHECK và GIN Full-Text Search trên PostgreSQL 16
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE resources ADD CONSTRAINT chk_resources_total_quantity CHECK (total_quantity >= 0);");
            DB::statement("ALTER TABLE resources ADD CONSTRAINT chk_resources_available_quantity CHECK (0 <= available_quantity AND available_quantity <= total_quantity);");
            
            // Chỉ mục GIN Full-Text Search theo đặc tả Mục 3.5 và F-01 (tốc độ tra cứu < 2s)
            DB::statement("CREATE INDEX idx_resources_search_gin ON resources USING gin (to_tsvector('simple', title || ' ' || coalesce(author_or_brand, '') || ' ' || code));");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("DROP INDEX IF EXISTS idx_resources_search_gin;");
        }

        Schema::dropIfExists('resources');
    }
};
