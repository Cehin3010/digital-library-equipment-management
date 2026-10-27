<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Config\AppConstants;
use PDO;

/**
 * Truy xuất dữ liệu Kho Tài liệu Số (Digital Repository - Phân hệ 1: F-01, F-02).
 * Tuân thủ PSR-12, Type Hinting và PDO Prepared Statements chống SQL Injection.
 */
class BookRepository
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * Tìm kiếm tài liệu số theo ID khi đang ở trạng thái hoạt động.
     *
     * @param int $id Mã định danh tài liệu
     * @return array<string, mixed>|null
     */
    public function findBookById(int $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM digital_documents WHERE document_id = :id AND status = :status'
        );
        $stmt->execute([
            'id' => $id,
            'status' => AppConstants::DOCUMENT_STATUS_ACTIVE,
        ]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    /**
     * Kiểm tra mã ISBN đã tồn tại trong kho tài liệu hay chưa (F-01).
     *
     * @param string $isbn Mã chuẩn quốc tế ISBN
     * @return bool True nếu ISBN đã tồn tại
     */
    public function existsByIsbn(string $isbn): bool
    {
        $stmt = $this->db->prepare(
            'SELECT COUNT(*) FROM digital_documents WHERE isbn = :isbn'
        );
        $stmt->execute(['isbn' => trim($isbn)]);

        return ((int) $stmt->fetchColumn()) > 0;
    }

    /**
     * Tìm kiếm tài liệu số theo bộ lọc đa tiêu chí (F-01).
     * Sử dụng Prepared Statements tuyệt đối không nối chuỗi SQL để phòng chống SQL Injection.
     *
     * @param string $keyword Từ khóa tên sách, tác giả hoặc ISBN
     * @param string $category Thể loại tài liệu
     * @param int|null $publishYear Năm xuất bản
     * @return array<int, array<string, mixed>> Danh sách bản sao kết quả tìm kiếm
     */
    public function searchDocuments(
        string $keyword = '',
        string $category = '',
        ?int $publishYear = null
    ): array {
        $sql = 'SELECT * FROM digital_documents WHERE status = :status';
        $params = ['status' => AppConstants::DOCUMENT_STATUS_ACTIVE];

        if ($keyword !== '') {
            $sql .= ' AND (title LIKE :kw OR author LIKE :kw OR isbn LIKE :kw OR dewey_code LIKE :kw)';
            $params['kw'] = '%' . trim($keyword) . '%';
        }

        if ($category !== '') {
            $sql .= ' AND category = :category';
            $params['category'] = $category;
        }

        if ($publishYear !== null && $publishYear > 0) {
            $sql .= ' AND publish_year = :publish_year';
            $params['publish_year'] = $publishYear;
        }

        $sql .= ' ORDER BY view_count DESC, publish_year DESC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [...$rows];
    }

    /**
     * Thêm mới tài liệu số vào kho lưu trữ (F-01).
     *
     * @param array<string, mixed> $data Thông tin tài liệu số
     * @return int ID của tài liệu vừa tạo
     */
    public function createDocument(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO digital_documents
                (isbn, title, author, category, dewey_code, publish_year, file_format, file_url, total_pages, max_print_pages, status)
             VALUES
                (:isbn, :title, :author, :category, :dewey_code, :publish_year, :file_format, :file_url, :total_pages, :max_print_pages, :status)'
        );

        $stmt->execute([
            'isbn' => $data['isbn'],
            'title' => $data['title'],
            'author' => $data['author'],
            'category' => $data['category'],
            'dewey_code' => $data['dewey_code'],
            'publish_year' => (int) $data['publish_year'],
            'file_format' => $data['file_format'] ?? 'PDF',
            'file_url' => $data['file_url'],
            'total_pages' => (int) ($data['total_pages'] ?? 100),
            'max_print_pages' => (int) ($data['max_print_pages'] ?? AppConstants::MAX_PRINT_PAGES_DEFAULT),
            'status' => AppConstants::DOCUMENT_STATUS_ACTIVE,
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Ghi nhận tiến độ đọc trực tuyến, thời gian đọc và số trang đã in của người dùng (F-02).
     *
     * @param int $userId ID người dùng
     * @param int $documentId ID tài liệu số
     * @param int $currentPage Trang hiện tại
     * @param float $progressPercent Phần trăm hoàn thành
     * @param int $printedPages Tổng số trang đã in
     * @param int $readingSeconds Thời lượng đọc cộng thêm (giây)
     * @return void
     */
    public function saveReadingProgress(
        int $userId,
        int $documentId,
        int $currentPage,
        float $progressPercent,
        int $printedPages,
        int $readingSeconds
    ): void {
        $existingStmt = $this->db->prepare(
            'SELECT history_id, reading_seconds FROM reading_histories
             WHERE user_id = :user_id AND document_id = :document_id'
        );
        $existingStmt->execute([
            'user_id' => $userId,
            'document_id' => $documentId,
        ]);
        $existing = $existingStmt->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            $updateStmt = $this->db->prepare(
                'UPDATE reading_histories
                 SET current_page = :current_page,
                     progress_percent = :progress_percent,
                     printed_pages = :printed_pages,
                     reading_seconds = :reading_seconds,
                     last_read_at = CURRENT_TIMESTAMP
                 WHERE history_id = :history_id'
            );
            $updateStmt->execute([
                'current_page' => $currentPage,
                'progress_percent' => $progressPercent,
                'printed_pages' => $printedPages,
                'reading_seconds' => ((int) $existing['reading_seconds']) + $readingSeconds,
                'history_id' => (int) $existing['history_id'],
            ]);
        } else {
            $insertStmt = $this->db->prepare(
                'INSERT INTO reading_histories
                    (user_id, document_id, current_page, progress_percent, printed_pages, reading_seconds)
                 VALUES
                    (:user_id, :document_id, :current_page, :progress_percent, :printed_pages, :reading_seconds)'
            );
            $insertStmt->execute([
                'user_id' => $userId,
                'document_id' => $documentId,
                'current_page' => $currentPage,
                'progress_percent' => $progressPercent,
                'printed_pages' => $printedPages,
                'reading_seconds' => $readingSeconds,
            ]);

            $viewStmt = $this->db->prepare(
                'UPDATE digital_documents SET view_count = view_count + 1 WHERE document_id = :id'
            );
            $viewStmt->execute(['id' => $documentId]);
        }
    }

    /**
     * Lấy tiến độ đọc hiện tại của người dùng đối với một tài liệu (F-02).
     *
     * @param int $userId ID người dùng
     * @param int $documentId ID tài liệu
     * @return array<string, mixed>|null
     */
    public function findReadingProgress(int $userId, int $documentId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM reading_histories WHERE user_id = :user_id AND document_id = :document_id'
        );
        $stmt->execute([
            'user_id' => $userId,
            'document_id' => $documentId,
        ]);

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }
}

