<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('resources')->where('code', 'ISBN-9780201633610')->update([
            'total_quantity' => 6,
            'available_quantity' => 6,
            'description' => 'Sách tham khảo về các mẫu thiết kế hướng đối tượng (GoF).',
        ]);
        DB::table('resources')->where('code', 'ISBN-9786045892341')->update([
            'title' => 'Marketing Management',
            'author_or_brand' => 'Philip Kotler và Kevin Lane Keller',
            'code' => 'ISBN-9780133856460',
            'total_quantity' => 12,
            'available_quantity' => 12,
            'description' => 'Giáo trình tham khảo về nghiên cứu thị trường và quản trị marketing.',
        ]);
    }

    public function down(): void
    {
        DB::table('resources')->where('code', 'ISBN-9780201633610')->update([
            'total_quantity' => 5,
            'available_quantity' => 3,
            'description' => 'Kinh điển về mẫu thiết kế hướng đối tượng (GoF).',
        ]);
        DB::table('resources')->where('code', 'ISBN-9780133856460')->update([
            'title' => 'Nguyên lý Quản trị Kinh doanh Hiện đại',
            'author_or_brand' => 'Philip Kotler',
            'code' => 'ISBN-9786045892341',
            'total_quantity' => 10,
            'available_quantity' => 0,
            'description' => 'Giáo trình cốt lõi ngành quản trị kinh doanh.',
        ]);
    }
};
