<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class Resource extends Model
{
    use HasFactory;

    protected $table = 'resources';
    protected $primaryKey = 'resource_id';

    protected $fillable = [
        'category_id',
        'resource_type',
        'title',
        'author_or_brand',
        'code',
        'file_url',
        'description',
        'location',
        'total_quantity',
        'available_quantity',
        'status',
    ];

    protected $casts = [
        'total_quantity' => 'integer',
        'available_quantity' => 'integer',
    ];

    protected $appends = [
        'status_badge',
        'status_color',
        'status_label',
    ];

    /**
     * Nhãn trạng thái chuẩn hóa màu sắc theo UI Design (W2, W6):
     * - AVAILABLE (Xanh lá): Còn trống, sẵn sàng cho mượn hoặc đọc
     * - BORROWED (Đỏ): Đang mượn hết / kín lịch
     * - MAINTENANCE (Xám): Đang bảo trì
     * - INACTIVE (Xám): Đã ẩn / Xóa mềm
     */
    public function getStatusBadgeAttribute(): string
    {
        if ($this->status === 'MAINTENANCE') {
            return 'MAINTENANCE';
        }

        if ($this->status === 'INACTIVE') {
            return 'INACTIVE';
        }

        if ($this->available_quantity > 0) {
            return 'AVAILABLE';
        }

        return 'BORROWED';
    }

    public function getStatusColorAttribute(): string
    {
        return match ($this->status_badge) {
            'AVAILABLE' => 'green',
            'BORROWED' => 'red',
            'MAINTENANCE', 'INACTIVE' => 'gray',
            default => 'gray',
        };
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status_badge) {
            'AVAILABLE' => 'Sẵn sàng / Còn trống',
            'BORROWED' => 'Đang mượn hết / Kín lịch',
            'MAINTENANCE' => 'Đang bảo trì',
            'INACTIVE' => 'Tạm ngưng phục vụ',
            default => 'Không xác định',
        };
    }

    /**
     * Danh mục phân loại
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id', 'category_id');
    }

    /**
     * Các phiếu mượn liên quan
     */
    public function loans(): HasMany
    {
        return $this->hasMany(Loan::class, 'resource_id', 'resource_id');
    }

    /**
     * Scope tìm kiếm toàn văn tối ưu bằng GIN Index (< 2 giây)
     */
    public function scopeSearchKeyword(Builder $query, ?string $keyword): Builder
    {
        if (blank($keyword)) {
            return $query;
        }

        $keyword = trim($keyword);

        if (DB::getDriverName() === 'pgsql') {
            return $query->whereRaw(
                "to_tsvector('simple', title || ' ' || coalesce(author_or_brand, '') || ' ' || code) @@ plainto_tsquery('simple', ?)",
                [$keyword]
            )->orWhere(function ($q) use ($keyword) {
                $q->where('title', 'ILIKE', "%{$keyword}%")
                  ->orWhere('author_or_brand', 'ILIKE', "%{$keyword}%")
                  ->orWhere('code', 'ILIKE', "%{$keyword}%");
            });
        }

        return $query->where(function ($q) use ($keyword) {
            $q->where('title', 'LIKE', "%{$keyword}%")
              ->orWhere('author_or_brand', 'LIKE', "%{$keyword}%")
              ->orWhere('code', 'LIKE', "%{$keyword}%");
        });
    }

    /**
     * Scope lọc theo loại tài nguyên: DIGITAL, BOOK, EQUIPMENT, ROOM
     */
    public function scopeFilterType(Builder $query, ?string $type): Builder
    {
        if (filled($type) && $type !== 'ALL') {
            return $query->where('resource_type', strtoupper($type));
        }

        return $query;
    }

    /**
     * Scope lọc theo danh mục (kèm danh mục con nếu có)
     */
    public function scopeFilterCategory(Builder $query, ?int $categoryId): Builder
    {
        if (filled($categoryId)) {
            $childIds = Category::where('parent_id', $categoryId)->pluck('category_id')->toArray();
            $allIds = array_merge([$categoryId], $childIds);
            return $query->whereIn('category_id', $allIds);
        }

        return $query;
    }
}
