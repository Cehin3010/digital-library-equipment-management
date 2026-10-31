<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\Resource;

class CategoryResourceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Tạo danh mục phân cấp theo chuẩn thư viện
        $cntt = Category::firstOrCreate(['category_name' => 'Công nghệ Thông tin']);
        $kinhte = Category::firstOrCreate(['category_name' => 'Kinh tế & Quản trị']);
        $thietbi = Category::firstOrCreate(['category_name' => 'Thiết bị & Phương tiện']);
        $khonggian = Category::firstOrCreate(['category_name' => 'Không gian & Phòng học']);

        // Danh mục con
        $phanmem = Category::firstOrCreate(['category_name' => 'Kỹ thuật Phần mềm', 'parent_id' => $cntt->category_id]);
        $csdl = Category::firstOrCreate(['category_name' => 'Cơ sở Dữ liệu & AI', 'parent_id' => $cntt->category_id]);
        $maychieu = Category::firstOrCreate(['category_name' => 'Máy chiếu & Thiết bị trình chiếu', 'parent_id' => $thietbi->category_id]);
        $laptop = Category::firstOrCreate(['category_name' => 'Máy tính xách tay & Tablet', 'parent_id' => $thietbi->category_id]);
        $phongnhom = Category::firstOrCreate(['category_name' => 'Phòng học nhóm (4-8 người)', 'parent_id' => $khonggian->category_id]);
        $phonghoithao = Category::firstOrCreate(['category_name' => 'Phòng hội thảo lớn', 'parent_id' => $khonggian->category_id]);

        // 2. Tạo tài nguyên mẫu
        $sampleResources = [
            // DIGITAL (Tài liệu số)
            [
                'category_id' => $phanmem->category_id,
                'resource_type' => 'DIGITAL',
                'title' => 'Giáo trình Clean Architecture & Domain-Driven Design',
                'author_or_brand' => 'Robert C. Martin',
                'code' => 'DIGI-ARCH-001',
                'file_url' => '/storage/digital_assets/clean_architecture.pdf',
                'description' => 'Sách hướng dẫn thiết kế kiến trúc phần mềm chuyên sâu cho sinh viên ngành CNTT.',
                'location' => 'Kho số Máy chủ Thư viện',
                'total_quantity' => 999,
                'available_quantity' => 999,
                'status' => 'ACTIVE',
            ],
            [
                'category_id' => $csdl->category_id,
                'resource_type' => 'DIGITAL',
                'title' => 'Tối ưu hóa Truy vấn PostgreSQL & Thiết kế Index GIN/GiST',
                'author_or_brand' => 'Bruce Momjian',
                'code' => 'DIGI-PG-002',
                'file_url' => '/storage/digital_assets/postgresql_optimization.pdf',
                'description' => 'Tài liệu hướng dẫn tối ưu hiệu năng cơ sở dữ liệu quy mô lớn.',
                'location' => 'Kho số Máy chủ Thư viện',
                'total_quantity' => 999,
                'available_quantity' => 999,
                'status' => 'ACTIVE',
            ],

            // BOOK (Sách in)
            [
                'category_id' => $phanmem->category_id,
                'resource_type' => 'BOOK',
                'title' => 'Design Patterns: Elements of Reusable Object-Oriented Software',
                'author_or_brand' => 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
                'code' => 'ISBN-9780201633610',
                'file_url' => null,
                'description' => 'Kinh điển về mẫu thiết kế hướng đối tượng (GoF).',
                'location' => 'Kệ A3 - Ngăn 2',
                'total_quantity' => 5,
                'available_quantity' => 3,
                'status' => 'ACTIVE',
            ],
            [
                'category_id' => $kinhte->category_id,
                'resource_type' => 'BOOK',
                'title' => 'Nguyên lý Quản trị Kinh doanh Hiện đại',
                'author_or_brand' => 'Philip Kotler',
                'code' => 'ISBN-9786045892341',
                'file_url' => null,
                'description' => 'Giáo trình cốt lõi ngành quản trị kinh doanh.',
                'location' => 'Kệ B1 - Ngăn 4',
                'total_quantity' => 10,
                'available_quantity' => 0, // Đang mượn hết -> Badge Đỏ
                'status' => 'ACTIVE',
            ],

            // EQUIPMENT (Thiết bị)
            [
                'category_id' => $maychieu->category_id,
                'resource_type' => 'EQUIPMENT',
                'title' => 'Máy chiếu Epson EB-E01 XGA 3300 Lumens',
                'author_or_brand' => 'Epson Japan',
                'code' => 'DEV-EPSON-E01',
                'file_url' => null,
                'description' => 'Máy chiếu hỗ trợ cổng HDMI/VGA phục vụ thuyết trình.',
                'location' => 'Kho Thiết bị Tầng 1 - Tủ 2',
                'total_quantity' => 4,
                'available_quantity' => 2,
                'status' => 'ACTIVE',
            ],
            [
                'category_id' => $laptop->category_id,
                'resource_type' => 'EQUIPMENT',
                'title' => 'Laptop Dell Latitude 5420 i7 16GB 512GB SSD',
                'author_or_brand' => 'Dell Inc.',
                'code' => 'DEV-DELL-5420-09',
                'file_url' => null,
                'description' => 'Máy tính xách tay cấu hình cao cho mượn làm đồ án.',
                'location' => 'Kho Thiết bị Tầng 1 - Kệ An toàn',
                'total_quantity' => 2,
                'available_quantity' => 0,
                'status' => 'MAINTENANCE', // Bảo trì -> Badge Xám
            ],

            // ROOM (Phòng học / Không gian thảo luận)
            [
                'category_id' => $phongnhom->category_id,
                'resource_type' => 'ROOM',
                'title' => 'Phòng học nhóm A1-204 (Sức chứa 6-8 người)',
                'author_or_brand' => 'Tòa nhà A1',
                'code' => 'ROOM-A1-204',
                'file_url' => null,
                'description' => 'Trang bị tivi 55 inch, bảng viết kính, điều hòa và ổ cắm từng vị trí.',
                'location' => 'Tầng 2 - Tòa nhà A1',
                'total_quantity' => 1,
                'available_quantity' => 1,
                'status' => 'ACTIVE',
            ],
            [
                'category_id' => $phonghoithao->category_id,
                'resource_type' => 'ROOM',
                'title' => 'Phòng hội thảo sáng tạo B2-101 (Sức chứa 25 người)',
                'author_or_brand' => 'Tòa nhà B2',
                'code' => 'ROOM-B2-101',
                'file_url' => null,
                'description' => 'Không gian mở trang bị máy chiếu, micro không dây và hệ thống loa âm trần.',
                'location' => 'Tầng 1 - Tòa nhà B2',
                'total_quantity' => 1,
                'available_quantity' => 1,
                'status' => 'ACTIVE',
            ],
        ];

        foreach ($sampleResources as $item) {
            Resource::firstOrCreate(['code' => $item['code']], $item);
        }
    }
}
