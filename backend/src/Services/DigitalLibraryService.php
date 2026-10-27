<?php

declare(strict_types=1);

namespace App\Services;

use App\Config\AppConstants;
use App\Models\DigitalAsset;
use App\Repositories\AuditAndStatsRepository;
use App\Repositories\BookRepository;
use InvalidArgumentException;
use RuntimeException;

/**
 * Dịch vụ Quản lý Kho Tài liệu Số & Trình đọc Trực tuyến (Phân hệ 1: F-01, F-02).
 */
class DigitalLibraryService
{
    private BookRepository $bookRepository;
    private AuditAndStatsRepository $auditRepository;

    public function __construct(
        BookRepository $bookRepository,
        AuditAndStatsRepository $auditRepository
    ) {
        $this->bookRepository = $bookRepository;
        $this->auditRepository = $auditRepository;
    }

    /**
     * Tự động xác định mã phân loại thập phân Dewey dựa trên thể loại tài liệu (F-01).
     *
     * @param string $category Tên thể loại học liệu
     * @return string Mã phân loại Dewey (ví dụ: 005.1)
     */
    public function classifyDeweyCode(string $category): string
    {
        $trimmedCategory = trim($category);
        return AppConstants::DEWEY_CATEGORIES[$trimmedCategory] ?? '000.0';
    }

    /**
     * Thêm tài liệu số mới vào kho lưu trữ sau khi kiểm tra trùng ISBN và phân loại Dewey (F-01).
     *
     * @param int $actorUserId ID người thực hiện (Cán bộ Thư viện / Admin / Giảng viên đề xuất)
     * @param array<string, mixed> $payload Thông tin tài liệu đầu vào
     * @return array<string, mixed> Bản sao thông tin tài liệu vừa lưu
     */
    public function registerDigitalDocument(int $actorUserId, array $payload): array
    {
        $isbn = trim((string) ($payload['isbn'] ?? ''));
        $title = trim((string) ($payload['title'] ?? ''));
        $author = trim((string) ($payload['author'] ?? ''));
        $category = trim((string) ($payload['category'] ?? 'CNTT & Khoa học Máy tính'));
        $publishYear = (int) ($payload['publish_year'] ?? (int) date('Y'));

        if ($isbn === '' || $title === '' || $author === '') {
            throw new InvalidArgumentException('Vui lòng nhập đầy đủ Tên tài liệu, Tác giả và Mã ISBN.');
        }

        if ($this->bookRepository->existsByIsbn($isbn)) {
            throw new RuntimeException(sprintf('Mã ISBN "%s" đã tồn tại trong kho tài liệu số.', $isbn));
        }

        $deweyCode = $this->classifyDeweyCode($category);
        $documentData = [
            'isbn' => $isbn,
            'title' => $title,
            'author' => $author,
            'category' => $category,
            'dewey_code' => $deweyCode,
            'publish_year' => $publishYear,
            'file_format' => strtoupper((string) ($payload['file_format'] ?? 'PDF')),
            'file_url' => (string) ($payload['file_url'] ?? '/uploads/documents/' . $isbn . '.pdf'),
            'total_pages' => max(1, (int) ($payload['total_pages'] ?? 120)),
            'max_print_pages' => max(1, (int) ($payload['max_print_pages'] ?? AppConstants::MAX_PRINT_PAGES_DEFAULT)),
        ];

        $documentId = $this->bookRepository->createDocument($documentData);
        $documentData['document_id'] = $documentId;

        $this->auditRepository->insertAuditLog(
            $actorUserId,
            'CREATE_DIGITAL_DOCUMENT',
            'digital_documents',
            (string) $documentId,
            sprintf('Thêm tài liệu số "%s" (ISBN: %s, Dewey: %s)', $title, $isbn, $deweyCode)
        );

        $asset = new DigitalAsset($documentData);
        return $asset->toArray();
    }

    /**
     * Ghi nhận tiến độ đọc tài liệu trực tuyến và kiểm soát giới hạn số trang in (F-02).
     *
     * @param int $userId ID người đọc đã xác thực
     * @param int $documentId ID tài liệu số
     * @param int $currentPage Trang đang đọc
     * @param int $requestedPrintPages Số trang yêu cầu in thêm trong phiên
     * @param int $readingSeconds Thời gian đọc trong phiên (giây)
     * @return array<string, mixed> Trạng thái tiến độ đọc và số trang in còn lại
     */
    public function recordOnlineReadingSession(
        int $userId,
        int $documentId,
        int $currentPage,
        int $requestedPrintPages = 0,
        int $readingSeconds = 30
    ): array {
        $document = $this->bookRepository->findBookById($documentId);
        if ($document === null) {
            throw new RuntimeException('Không tìm thấy tài liệu số hoặc tài liệu đã ngừng phục vụ.');
        }

        $totalPages = max(1, (int) $document['total_pages']);
        $maxPrintPages = (int) $document['max_print_pages'];
        $safeCurrentPage = max(1, min($currentPage, $totalPages));

        $existingProgress = $this->bookRepository->findReadingProgress($userId, $documentId);
        $alreadyPrinted = $existingProgress !== null ? (int) $existingProgress['printed_pages'] : 0;
        $newTotalPrinted = $alreadyPrinted + max(0, $requestedPrintPages);

        if ($newTotalPrinted > $maxPrintPages) {
            throw new RuntimeException(sprintf(
                'Vượt quá giới hạn in cho phép (%d/%d trang). Bản quyền học liệu số không cho phép in thêm.',
                $newTotalPrinted,
                $maxPrintPages
            ));
        }

        $progressPercent = round(($safeCurrentPage / $totalPages) * 100, 2);

        $this->bookRepository->saveReadingProgress(
            $userId,
            $documentId,
            $safeCurrentPage,
            $progressPercent,
            $newTotalPrinted,
            max(0, $readingSeconds)
        );

        return [
            'document_id' => $documentId,
            'title' => $document['title'],
            'current_page' => $safeCurrentPage,
            'total_pages' => $totalPages,
            'progress_percent' => $progressPercent,
            'printed_pages' => $newTotalPrinted,
            'remaining_print_pages' => $maxPrintPages - $newTotalPrinted,
        ];
    }
}

