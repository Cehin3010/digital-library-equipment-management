<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\AppConstants;

/**
 * Thực thể biểu diễn Hồ sơ Mượn Trả Tài sản Vật lý (BorrowRecord).
 * Đặt tên PascalCase danh từ theo đúng Quy ước Coding.
 */
final class BorrowRecord
{
    private int $transactionId;
    private string $transactionCode;
    private int $userId;
    private int $assetId;
    private string $qrCodeToken;
    private string $borrowDate;
    private string $dueDate;
    private ?string $receivedAt;
    private ?string $returnedAt;
    private string $status;
    private ?string $returnCondition;
    private float $fineAmount;

    /**
     * @param array<string, mixed> $row Bản ghi từ bảng borrow_transactions
     */
    public function __construct(array $row)
    {
        $this->transactionId = (int) ($row['transaction_id'] ?? 0);
        $this->transactionCode = (string) ($row['transaction_code'] ?? '');
        $this->userId = (int) ($row['user_id'] ?? 0);
        $this->assetId = (int) ($row['asset_id'] ?? 0);
        $this->qrCodeToken = (string) ($row['qr_code_token'] ?? '');
        $this->borrowDate = (string) ($row['borrow_date'] ?? '');
        $this->dueDate = (string) ($row['due_date'] ?? '');
        $this->receivedAt = isset($row['received_at']) ? (string) $row['received_at'] : null;
        $this->returnedAt = isset($row['returned_at']) ? (string) $row['returned_at'] : null;
        $this->status = (string) ($row['status'] ?? AppConstants::LOAN_STATUS_PENDING_PICKUP);
        $this->returnCondition = isset($row['return_condition']) ? (string) $row['return_condition'] : null;
        $this->fineAmount = (float) ($row['fine_amount'] ?? 0.0);
    }

    public function getTransactionId(): int
    {
        return $this->transactionId;
    }

    public function getTransactionCode(): string
    {
        return $this->transactionCode;
    }

    public function getUserId(): int
    {
        return $this->userId;
    }

    public function getAssetId(): int
    {
        return $this->assetId;
    }

    public function getQrCodeToken(): string
    {
        return $this->qrCodeToken;
    }

    public function getDueDate(): string
    {
        return $this->dueDate;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function isOverdue(string $referenceDate): bool
    {
        return strtotime($referenceDate) > strtotime($this->dueDate);
    }

    /**
     * Trả về bản sao độc lập của hồ sơ mượn (Defensive Copying).
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'transaction_id' => $this->transactionId,
            'transaction_code' => $this->transactionCode,
            'user_id' => $this->userId,
            'asset_id' => $this->assetId,
            'qr_code_token' => $this->qrCodeToken,
            'borrow_date' => $this->borrowDate,
            'due_date' => $this->dueDate,
            'received_at' => $this->receivedAt,
            'returned_at' => $this->returnedAt,
            'status' => $this->status,
            'return_condition' => $this->returnCondition,
            'fine_amount' => $this->fineAmount,
        ];
    }
}

