<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    use HasFactory;

    public const ROLE_STUDENT = 'STUDENT';
    public const ROLE_LECTURER = 'LECTURER';
    public const ROLE_LIBRARIAN = 'LIBRARIAN';
    public const ROLE_ADMIN = 'ADMIN';

    public const VALID_ROLES = [
        self::ROLE_STUDENT,
        self::ROLE_LECTURER,
        self::ROLE_LIBRARIAN,
        self::ROLE_ADMIN,
    ];

    protected $table = 'roles';
    protected $primaryKey = 'role_id';
    public $timestamps = false;

    protected $fillable = [
        'role_name',
        'description',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'role_id', 'role_id');
    }
}
