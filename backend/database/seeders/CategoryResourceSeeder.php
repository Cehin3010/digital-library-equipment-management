<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Resource;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CategoryResourceSeeder extends Seeder
{
    public function run(): void
    {
        $cntt = Category::firstOrCreate(['category_name' => 'Công nghệ Thông tin']);
        $kinhte = Category::firstOrCreate(['category_name' => 'Kinh tế & Quản trị']);
        $thietbi = Category::firstOrCreate(['category_name' => 'Thiết bị & Phương tiện']);
        $khonggian = Category::firstOrCreate(['category_name' => 'Không gian & Phòng học']);
        $kynang = Category::firstOrCreate(['category_name' => 'Kỹ năng học tập']);

        $phanmem = Category::firstOrCreate(['category_name' => 'Kỹ thuật Phần mềm', 'parent_id' => $cntt->category_id]);
        $csdl = Category::firstOrCreate(['category_name' => 'Cơ sở Dữ liệu & AI', 'parent_id' => $cntt->category_id]);
        $maychieu = Category::firstOrCreate(['category_name' => 'Máy chiếu & Thiết bị trình chiếu', 'parent_id' => $thietbi->category_id]);
        $laptop = Category::firstOrCreate(['category_name' => 'Máy tính xách tay & Tablet', 'parent_id' => $thietbi->category_id]);
        $phongnhom = Category::firstOrCreate(['category_name' => 'Phòng học nhóm (4-8 người)', 'parent_id' => $khonggian->category_id]);
        $phonghoithao = Category::firstOrCreate(['category_name' => 'Phòng hội thảo lớn', 'parent_id' => $khonggian->category_id]);

        $resources = [
            [
                'category_id' => $phanmem->category_id,
                'resource_type' => 'DIGITAL',
                'title' => 'Giáo trình Clean Architecture & Domain-Driven Design',
                'author_or_brand' => 'Thư viện Số Đại học',
                'code' => 'DIGI-ARCH-001',
                'file_url' => '/storage/digital_assets/clean_architecture.pdf',
                'description' => 'Bài đọc mẫu tự biên soạn về phân lớp, mô-đun và nguyên tắc thiết kế phần mềm.',
                'location' => 'Kho số Thư viện',
                'total_quantity' => 50,
                'available_quantity' => 50,
                'status' => 'ACTIVE',
                'reading_content' => [
                    'Kien truc phan mem la cach to chuc cac thanh phan va moi quan he giua chung.',
                    'Muc tieu cua kien truc tot la giup he thong de hieu, de thay doi va de kiem thu.',
                    'Bat dau bang quy tac nghiep vu: viet ro he thong can lam gi truoc khi chon cong nghe.',
                    'Chia chuong trinh thanh cac mo-dun co trach nhiem ro rang va giao tiep qua giao dien nho.',
                    'Trong kien truc phan lop, giao dien phu thuoc vao nghiep vu; nghiep vu khong phu thuoc giao dien.',
                    'Cac lop thuong gap gom giao dien, ung dung, nghiep vu va ha tang du lieu.',
                    'Khong de truy van SQL, gui email hay loi goi HTTP xuat hien trong quy tac nghiep vu cot loi.',
                    'Thay vao do, dinh nghia mot giao dien va de lop ha tang cung cap cach thuc thi cu the.',
                    'Vi du: dich vu muon sach kiem tra han muc va tinh trang sach, khong tu ket noi truc tiep PostgreSQL.',
                    'Khi can doi co so du lieu, chi lop truy cap du lieu can thay doi; quy tac muon sach duoc giu nguyen.',
                    'Mo hinh mien nen mo ta cac khai niem nhu BanDoc, TaiLieu, PhieuMuon va KhoanPhat.',
                    'Ten va hanh vi cua mo hinh nen gan voi nghiep vu, khong gan voi ten bang trong co so du lieu.',
                    'Moi mo-dun nen co mot ly do thay doi chinh. Tach cac chuc nang khong lien quan de giam pham vi loi.',
                    'Dung unit test cho quy tac nghiep vu va integration test cho ket noi voi he thong ben ngoai.',
                    'Khi tach he thong, uu tien bat dau voi mo-dun ro ranh gioi thay vi chia dich vu qua som.',
                    'Kiem tra kien truc bang cach thu mot thay doi nho: co the sua mot quy tac ma khong sua toan bo ung dung?',
                    'Cau hoi on tap: neu doi giao dien web sang ung dung di dong, quy tac tinh tien phat co can viet lai khong?',
                ],
            ],
            [
                'category_id' => $csdl->category_id,
                'resource_type' => 'DIGITAL',
                'title' => 'Tối ưu hóa Truy vấn PostgreSQL & Thiết kế Index GIN/GiST',
                'author_or_brand' => 'Thư viện Số Đại học',
                'code' => 'DIGI-PG-002',
                'file_url' => '/storage/digital_assets/postgresql_optimization.pdf',
                'description' => 'Bài đọc mẫu tự biên soạn về mô hình quan hệ, SQL, chỉ mục và đọc kế hoạch truy vấn.',
                'location' => 'Kho số Thư viện',
                'total_quantity' => 50,
                'available_quantity' => 50,
                'status' => 'ACTIVE',
                'reading_content' => [
                    'Co so du lieu quan he luu tru du lieu trong cac bang co hang va cot.',
                    'Moi bang nen dai dien cho mot loai doi tuong; moi hang la mot doi tuong cu the.',
                    'Khoa chinh dinh danh duy nhat mot hang. Khoa ngoai lien ket hang voi bang khac.',
                    'Vi du: phieu muon co user_id tham chieu den ban doc va resource_id tham chieu den tai lieu.',
                    'Dung NOT NULL cho du lieu bat buoc va UNIQUE cho gia tri khong duoc lap lai.',
                    'Duy tri toan ven du lieu bang transaction khi mot nghiep vu cap nhat nhieu bang.',
                    'SELECT title FROM resources WHERE status = active la mot truy van loc tai lieu dang phuc vu.',
                    'Trong SQL thuc te, gia tri chuoi phai duoc truyen bang parameter binding, khong ghep truc tiep vao cau lenh.',
                    'Sap xep bang ORDER BY va phan trang bang LIMIT/OFFSET hoac cursor khi tap du lieu lon.',
                    'Index giup tim kiem nhanh hon nhung can them dung luong va lam cham thao tac ghi.',
                    'Tao index cho cot thuong dung trong dieu kien loc, khoa ngoai va sap xep.',
                    'Index B-tree phu hop voi so sanh bang, nho hon, lon hon va sap xep thong thuong.',
                    'GIN phu hop voi mot gia tri co nhieu thanh phan, chang han full-text search hoac mang.',
                    'Truoc khi them index, do thoi gian truy van va xem EXPLAIN ANALYZE de biet nut that.',
                    'Seq Scan khong luon la loi: voi bang nho, doc tuan tu co the re hon di qua index.',
                    'Tranh SELECT * neu man hinh chi can mot vai cot; tranh lap truy van cho tung hang trong danh sach.',
                    'Cau hoi on tap: tai sao index tren cot status co the it hieu qua neu gan nhu moi hang co cung mot gia tri?',
                ],
            ],
            [
                'category_id' => $phanmem->category_id,
                'resource_type' => 'DIGITAL',
                'title' => 'Nhập môn Git và quy trình làm việc nhóm',
                'author_or_brand' => 'Thư viện Số Đại học',
                'code' => 'DIGI-GIT-003',
                'file_url' => '/storage/digital_assets/git_collaboration.pdf',
                'description' => 'Bài đọc thực hành về commit, branch, pull request và xử lý xung đột.',
                'location' => 'Kho số Thư viện',
                'total_quantity' => 50,
                'available_quantity' => 50,
                'status' => 'ACTIVE',
                'reading_content' => [
                    'Git theo doi lich su thay doi cua tep va cho phep nhieu nguoi lam viec tren cac nhanh rieng.',
                    'Working tree la noi chinh sua tep; staging area la danh sach thay doi sap duoc commit.',
                    'Mot commit nen nho, co mot muc dich ro rang va mot thong diep mo ta dung noi dung.',
                    'Nhanh tinh nang giup tach cong viec moi khoi nhanh chinh va de review truoc khi hop nhat.',
                    'Truoc khi tao pull request, cap nhat nhanh lam viec va chay cac bai kiem tra cua du an.',
                    'Pull request la noi giai thich ly do thay doi, xem diff va trao doi review.',
                    'Xung dot xay ra khi cac nhanh sua cung mot vung tep theo cach Git khong the tu ket hop.',
                    'De xu ly, doc ca hai phien ban, thong nhat ket qua mong muon, xoa dau danh dau va chay test.',
                    'Khong commit file .env, token, mat khau hay du lieu ca nhan.',
                    'Dung .gitignore de bo qua file build, cache va secret tren may ca nhan.',
                    'Sau khi merge, xoa nhanh da hoan thanh va cap nhat nhanh moi tu nhanh chinh.',
                    'Neu commit co loi, dung revert tao mot commit dao nguoc an toan tren lich su da chia se.',
                    'Tranh sua lich su bang rebase hoac force push tren nhanh ma dong doi dang su dung.',
                    'Quy trinh don gian: tao nhanh, sua mot muc tieu, chay test, mo pull request, review va merge.',
                    'Cau hoi on tap: vi sao commit nho va doc lap giup tim loi bang git bisect de hon?',
                ],
            ],
            [
                'category_id' => $csdl->category_id,
                'resource_type' => 'DIGITAL',
                'title' => 'Python căn bản cho phân tích dữ liệu',
                'author_or_brand' => 'Thư viện Số Đại học',
                'code' => 'DIGI-PYTHON-004',
                'file_url' => '/storage/digital_assets/python_data_basics.pdf',
                'description' => 'Tài liệu nhập môn tự biên soạn về kiểu dữ liệu, hàm và quy trình phân tích.',
                'location' => 'Kho số Thư viện',
                'total_quantity' => 50,
                'available_quantity' => 50,
                'status' => 'ACTIVE',
                'reading_content' => [
                    'Python la ngon ngu de doc, thuong duoc dung de tu dong hoa va phan tich du lieu.',
                    'Cac kieu co ban gom int, float, str, bool va None.',
                    'List luu mot day gia tri co thu tu; dictionary luu cap khoa va gia tri.',
                    'Vong lap for duyet tung phan tu; if va elif chon nhanh theo dieu kien.',
                    'Ham gom mot nhiem vu co ten, nhan tham so va tra ve ket qua bang return.',
                    'Dat ten bien de mo ta y nghia, vi du monthly_total thay vi x.',
                    'Khi doc CSV, kiem tra so dong, cot trong va gia tri khong hop le truoc khi tinh toan.',
                    'Lam sach du lieu can ghi lai quy tac: loai bo dong trung, chuan hoa ngay va xu ly gia tri thieu.',
                    'Tom tat du lieu bang so luong, trung binh, trung vi va khoang gia tri.',
                    'Bieu do nen tra loi mot cau hoi cu the, khong chi trang tri bao cao.',
                    'Khong nham tuong quan voi quan he nhan qua; hai bien cung thay doi chua chung minh mot bien gay ra bien kia.',
                    'Chia tap du lieu theo thoi gian hoac theo doi tuong truoc khi danh gia mo hinh du doan.',
                    'Ghi lai nguon, buoc xu ly va gia dinh de nguoi khac co the lap lai ket qua.',
                    'Cau hoi on tap: neu 20 phan tram ban ghi thieu ngay, ban se kiem tra dieu gi truoc khi xoa chung?',
                ],
            ],
            [
                'category_id' => $kynang->category_id,
                'resource_type' => 'DIGITAL',
                'title' => 'Kỹ năng tìm kiếm và trích dẫn tài liệu học thuật',
                'author_or_brand' => 'Thư viện Số Đại học',
                'code' => 'DIGI-RESEARCH-005',
                'file_url' => '/storage/digital_assets/academic_research.pdf',
                'description' => 'Hướng dẫn tự biên soạn về câu hỏi nghiên cứu, đánh giá nguồn và trích dẫn trung thực.',
                'location' => 'Kho số Thư viện',
                'total_quantity' => 50,
                'available_quantity' => 50,
                'status' => 'ACTIVE',
                'reading_content' => [
                    'Bat dau mot bai nghien cuu bang cau hoi hep, ro doi tuong va co the tim bang chung.',
                    'Chia cau hoi thanh cac tu khoa chinh, tu dong nghia va cach viet khac nhau.',
                    'Ket hop tu khoa bang AND de thu hep, OR de mo rong va ngoac kep de tim cum tu chinh xac.',
                    'Ghi lai co so du lieu, ngay tim, tu khoa va bo loc de co the lap lai qua trinh.',
                    'Danh gia nguon qua tac gia, don vi xuat ban, bang chung va thoi diem cap nhat.',
                    'Doc tom tat truoc, sau do kiem tra phuong phap va ket qua trong toan van.',
                    'Phan biet bai bao phan bien, sach chuyen mon, bao cao va y kien ca nhan.',
                    'Ghi thong tin thu muc ngay khi doc: tac gia, nam, ten tai lieu, nha xuat ban va DOI neu co.',
                    'Trich dan moi y tuong hoac ket qua khong phai cua minh, ke ca khi da viet lai bang loi cua minh.',
                    'Dau ngoac kep danh dau nguyen van; phan dien giai can giu dung y va gan voi nguon.',
                    'Khong tao nguon, so lieu hoac trich dan khong ton tai.',
                    'Khi tong hop, so sanh cac nguon va chi ra diem dong, diem khac va han che.',
                    'Ghi chu phan biet du lieu quan sat, ket qua tinh toan va nhan dinh cua nguoi viet.',
                    'Cau hoi on tap: ban se kiem tra gi de xac nhan mot bai bao co the trich dan duoc?',
                ],
            ],
            [
                'category_id' => $phanmem->category_id,
                'resource_type' => 'BOOK',
                'title' => 'Design Patterns: Elements of Reusable Object-Oriented Software',
                'author_or_brand' => 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
                'code' => 'ISBN-9780201633610',
                'file_url' => null,
                'description' => 'Sách tham khảo về các mẫu thiết kế hướng đối tượng (GoF).',
                'location' => 'Kệ A3 - Ngăn 2',
                'total_quantity' => 6,
                'available_quantity' => 6,
                'status' => 'ACTIVE',
            ],
            [
                'category_id' => $kinhte->category_id,
                'resource_type' => 'BOOK',
                'title' => 'Marketing Management',
                'author_or_brand' => 'Philip Kotler và Kevin Lane Keller',
                'code' => 'ISBN-9780133856460',
                'file_url' => null,
                'description' => 'Giáo trình tham khảo về nghiên cứu thị trường và quản trị marketing.',
                'location' => 'Kệ B1 - Ngăn 4',
                'total_quantity' => 12,
                'available_quantity' => 12,
                'status' => 'ACTIVE',
            ],
            [
                'category_id' => $phanmem->category_id,
                'resource_type' => 'BOOK',
                'title' => 'Clean Code: A Handbook of Agile Software Craftsmanship',
                'author_or_brand' => 'Robert C. Martin',
                'code' => 'BOOK-SWE-001',
                'file_url' => null,
                'description' => 'Sách tham khảo về khả năng đọc, tổ chức và bảo trì mã nguồn.',
                'location' => 'Kệ A3 - Ngăn 3',
                'total_quantity' => 8,
                'available_quantity' => 8,
                'status' => 'ACTIVE',
            ],
            [
                'category_id' => $phanmem->category_id,
                'resource_type' => 'BOOK',
                'title' => 'Refactoring: Improving the Design of Existing Code',
                'author_or_brand' => 'Martin Fowler',
                'code' => 'BOOK-SWE-002',
                'file_url' => null,
                'description' => 'Tài liệu tham khảo về cải thiện cấu trúc mã mà vẫn giữ hành vi.',
                'location' => 'Kệ A3 - Ngăn 3',
                'total_quantity' => 7,
                'available_quantity' => 7,
                'status' => 'ACTIVE',
            ],
            [
                'category_id' => $phanmem->category_id,
                'resource_type' => 'BOOK',
                'title' => 'Effective Java',
                'author_or_brand' => 'Joshua Bloch',
                'code' => 'BOOK-JAVA-001',
                'file_url' => null,
                'description' => 'Tài liệu tham khảo về thực hành lập trình Java.',
                'location' => 'Kệ A3 - Ngăn 4',
                'total_quantity' => 6,
                'available_quantity' => 6,
                'status' => 'ACTIVE',
            ],
            [
                'category_id' => $csdl->category_id,
                'resource_type' => 'BOOK',
                'title' => 'Database System Concepts',
                'author_or_brand' => 'Abraham Silberschatz, Henry F. Korth, S. Sudarshan',
                'code' => 'BOOK-DB-001',
                'file_url' => null,
                'description' => 'Giáo trình về mô hình dữ liệu, SQL, giao dịch và xử lý truy vấn.',
                'location' => 'Kệ A2 - Ngăn 1',
                'total_quantity' => 10,
                'available_quantity' => 10,
                'status' => 'ACTIVE',
            ],
            [
                'category_id' => $csdl->category_id,
                'resource_type' => 'BOOK',
                'title' => 'Designing Data-Intensive Applications',
                'author_or_brand' => 'Martin Kleppmann',
                'code' => 'BOOK-DB-002',
                'file_url' => null,
                'description' => 'Sách tham khảo về hệ thống dữ liệu, độ tin cậy và khả năng mở rộng.',
                'location' => 'Kệ A2 - Ngăn 2',
                'total_quantity' => 5,
                'available_quantity' => 5,
                'status' => 'ACTIVE',
            ],
            [
                'category_id' => $kinhte->category_id,
                'resource_type' => 'BOOK',
                'title' => 'Principles of Economics',
                'author_or_brand' => 'N. Gregory Mankiw',
                'code' => 'BOOK-ECO-001',
                'file_url' => null,
                'description' => 'Giáo trình nhập môn kinh tế học và các nguyên lý thị trường.',
                'location' => 'Kệ B1 - Ngăn 1',
                'total_quantity' => 14,
                'available_quantity' => 14,
                'status' => 'ACTIVE',
            ],
            [
                'category_id' => $kinhte->category_id,
                'resource_type' => 'BOOK',
                'title' => 'Financial Accounting',
                'author_or_brand' => 'Jerry J. Weygandt, Paul D. Kimmel, Donald E. Kieso',
                'code' => 'BOOK-ACC-001',
                'file_url' => null,
                'description' => 'Giáo trình nền tảng về báo cáo và nguyên tắc kế toán tài chính.',
                'location' => 'Kệ B2 - Ngăn 2',
                'total_quantity' => 9,
                'available_quantity' => 9,
                'status' => 'ACTIVE',
            ],
            [
                'category_id' => $kynang->category_id,
                'resource_type' => 'BOOK',
                'title' => 'The Craft of Research',
                'author_or_brand' => 'Wayne C. Booth, Gregory G. Colomb, Joseph M. Williams',
                'code' => 'BOOK-RES-001',
                'file_url' => null,
                'description' => 'Tài liệu tham khảo về đặt câu hỏi và xây dựng lập luận nghiên cứu.',
                'location' => 'Kệ C1 - Ngăn 1',
                'total_quantity' => 8,
                'available_quantity' => 8,
                'status' => 'ACTIVE',
            ],
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
                'status' => 'MAINTENANCE',
            ],
            [
                'category_id' => $laptop->category_id,
                'resource_type' => 'EQUIPMENT',
                'title' => 'Máy tính bảng Samsung Galaxy Tab S9 FE',
                'author_or_brand' => 'Samsung',
                'code' => 'DEV-TABLET-S9FE',
                'file_url' => null,
                'description' => 'Máy tính bảng hỗ trợ đọc tài liệu và ghi chú trong giờ học.',
                'location' => 'Kho Thiết bị Tầng 1 - Tủ 3',
                'total_quantity' => 6,
                'available_quantity' => 6,
                'status' => 'ACTIVE',
            ],
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
            [
                'category_id' => $phongnhom->category_id,
                'resource_type' => 'ROOM',
                'title' => 'Phòng học nhóm A1-205 (Sức chứa 4-6 người)',
                'author_or_brand' => 'Tòa nhà A1',
                'code' => 'ROOM-A1-205',
                'file_url' => null,
                'description' => 'Phòng học nhóm có màn hình trình chiếu, bảng viết và ổ cắm đa năng.',
                'location' => 'Tầng 2 - Tòa nhà A1',
                'total_quantity' => 1,
                'available_quantity' => 1,
                'status' => 'ACTIVE',
            ],
            [
                'category_id' => $phongnhom->category_id,
                'resource_type' => 'ROOM',
                'title' => 'Phòng học nhóm C1-302 (Sức chứa 6-8 người)',
                'author_or_brand' => 'Tòa nhà C1',
                'code' => 'ROOM-C1-302',
                'file_url' => null,
                'description' => 'Không gian thảo luận nhóm với màn hình lớn và bảng viết.',
                'location' => 'Tầng 3 - Tòa nhà C1',
                'total_quantity' => 1,
                'available_quantity' => 1,
                'status' => 'ACTIVE',
            ],
            [
                'category_id' => $phonghoithao->category_id,
                'resource_type' => 'ROOM',
                'title' => 'Phòng hội thảo B2-103 (Sức chứa 40 người)',
                'author_or_brand' => 'Tòa nhà B2',
                'code' => 'ROOM-B2-103',
                'file_url' => null,
                'description' => 'Phòng hội thảo có máy chiếu, micro, hệ thống âm thanh và bàn ghế linh hoạt.',
                'location' => 'Tầng 1 - Tòa nhà B2',
                'total_quantity' => 1,
                'available_quantity' => 1,
                'status' => 'ACTIVE',
            ],
        ];

        foreach ($resources as $item) {
            $readingContent = $item['reading_content'] ?? null;
            unset($item['reading_content']);

            $resource = Resource::firstOrCreate(['code' => $item['code']], $item);
            $pricing = match ($item['code']) {
                'DEV-EPSON-E01' => ['rental_fee_per_day' => 30000, 'replacement_cost' => 15000000],
                'DEV-DELL-5420-09' => ['rental_fee_per_day' => 50000, 'replacement_cost' => 20000000],
                'DEV-TABLET-S9FE' => ['rental_fee_per_day' => 30000, 'replacement_cost' => 10000000],
                'ROOM-A1-204', 'ROOM-A1-205', 'ROOM-C1-302' => ['booking_fee_per_hour' => 20000],
                'ROOM-B2-101', 'ROOM-B2-103' => ['booking_fee_per_hour' => 100000],
                default => $item['resource_type'] === 'BOOK' ? ['replacement_cost' => 200000] : [],
            };
            if ($pricing !== []) {
                $resource->update($pricing);
            }

            if ($readingContent !== null) {
                $relativePath = Str::after($item['file_url'], '/storage/');
                Storage::disk('public')->put(
                    $relativePath,
                    $this->makeReadingPdf($item['title'], $readingContent),
                );
            }
        }
    }

    private function makeReadingPdf(string $title, array $content): string
    {
        $lines = [
            Str::ascii($title),
            'Original introductory handout - Digital Library',
            '',
            ...array_map(fn (string $line) => Str::ascii($line), $content),
        ];
        $wrappedLines = [];
        foreach ($lines as $line) {
            array_push($wrappedLines, ...explode("\n", wordwrap($line, 88, "\n", true)));
        }
        $pages = array_chunk($wrappedLines, 44);
        $objects = [
            1 => '<< /Type /Catalog /Pages 2 0 R >>',
            3 => '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        ];
        $pageReferences = [];

        foreach ($pages as $index => $pageLines) {
            $pageObject = 4 + ($index * 2);
            $contentsObject = $pageObject + 1;
            $pageReferences[] = "{$pageObject} 0 R";

            $stream = "BT\n/F1 11 Tf\n50 750 Td\n15 TL\n";
            foreach ($pageLines as $line) {
                $escapedLine = str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $line);
                $stream .= "({$escapedLine}) Tj\nT*\n";
            }
            $stream .= "ET";

            $objects[$pageObject] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents {$contentsObject} 0 R >>";
            $objects[$contentsObject] = "<< /Length " . strlen($stream) . " >>\nstream\n{$stream}\nendstream";
        }

        $objects[2] = '<< /Type /Pages /Kids [' . implode(' ', $pageReferences) . '] /Count ' . count($pages) . ' >>';
        ksort($objects);

        $pdf = "%PDF-1.4\n";
        $offsets = [0];
        foreach ($objects as $number => $object) {
            $offsets[$number] = strlen($pdf);
            $pdf .= "{$number} 0 obj\n{$object}\nendobj\n";
        }

        $objectCount = max(array_keys($objects));
        $xrefOffset = strlen($pdf);
        $pdf .= "xref\n0 " . ($objectCount + 1) . "\n0000000000 65535 f \n";
        for ($number = 1; $number <= $objectCount; $number++) {
            $pdf .= sprintf("%010d 00000 n \n", $offsets[$number] ?? 0);
        }
        $pdf .= "trailer\n<< /Size " . ($objectCount + 1) . " /Root 1 0 R >>\nstartxref\n{$xrefOffset}\n%%EOF\n";

        return $pdf;
    }
}
