<?php

declare(strict_types=1);

namespace App\Models;

/**
 * Thực thể biểu diễn Tài liệu Số hoặc Tài sản trong kho học liệu.
 * Áp dụng nguyên lý Defensive Copying khi trả về danh sách thuộc tính hoặc thẻ phân loại.
 */
final class DigitalAsset
{
    private int $documentId;
    private string $isbn;
    private string $title;
    private string $author;
    private string $category;
    private string $deweyCode;
    private int $publishYear;
    private string $fileFormat;
    private string $fileUrl;
    private int $totalPages;
    private int $maxPrintPages;
    private int $viewCount;
    /** @var array<int, string> */
    private array $tags;

    /**
     * @param array<string, mixed> $attributes Dữ liệu khởi tạo từ cơ sở dữ liệu
     */
    public function __construct(array $attributes)
    {
        $this->documentId = (int) ($attributes['document_id'] ?? 0);
        $this->isbn = (string) ($attributes['isbn'] ?? '');
        $this->title = (string) ($attributes['title'] ?? '');
        $this->author = (string) ($attributes['author'] ?? '');
        $this->category = (string) ($attributes['category'] ?? '');
        $this->deweyCode = (string) ($attributes['dewey_code'] ?? '000.0');
        $this->publishYear = (int) ($attributes['publish_year'] ?? (int) date('Y'));
        $this->fileFormat = (string) ($attributes['file_format'] ?? 'PDF');
        $this->fileUrl = (string) ($attributes['file_url'] ?? '');
        $this->totalPages = (int) ($attributes['total_pages'] ?? 100);
        $this->maxPrintPages = (int) ($attributes['max_print_pages'] ?? 15);
        $this->viewCount = (int) ($attributes['view_count'] ?? 0);
        $this->tags = isset($attributes['tags']) && is_array($attributes['tags'])
            ? array_values($attributes['tags'])
            : [$this->category, 'Dewey ' . $this->deweyCode];
    }

    public function getDocumentId(): int
    {
        return $this->documentId;
    }

    public function getIsbn(): string
    {
        return $this->isbn;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function getAuthor(): string
    {
        return $this->author;
    }

    public function getCategory(): string
    {
        return $this->category;
    }

    public function getDeweyCode(): string
    {
        return $this->deweyCode;
    }

    public function getPublishYear(): int
    {
        return $this->publishYear;
    }

    public function getMaxPrintPages(): int
    {
        return $this->maxPrintPages;
    }

    /**
     * Trả về bản sao danh sách nhãn (Defensive Copying) để tránh sửa đổi tham chiếu gốc.
     *
     * @return array<int, string>
     */
    public function getTags(): array
    {
        return [...$this->tags];
    }

    /**
     * Trả về bản sao mảng dữ liệu của tài liệu số.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'document_id' => $this->documentId,
            'isbn' => $this->isbn,
            'title' => $this->title,
            'author' => $this->author,
            'category' => $this->category,
            'dewey_code' => $this->deweyCode,
            'publish_year' => $this->publishYear,
            'file_format' => $this->fileFormat,
            'file_url' => $this->fileUrl,
            'total_pages' => $this->totalPages,
            'max_print_pages' => $this->maxPrintPages,
            'view_count' => $this->viewCount,
            'tags' => $this->getTags(),
        ];
    }
}

