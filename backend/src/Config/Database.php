<?php

declare(strict_types=1);

namespace App\Config;

use PDO;
use PDOException;
use RuntimeException;

/**
 * Quản lý kết nối Cơ sở dữ liệu qua PDO.
 * Tắt chế độ giả lập Prepared Statements để chống SQL Injection tuyệt đối.
 */
final class Database
{
    private static ?PDO $connection = null;

    /**
     * Khởi tạo hoặc trả về kết nối PDO hiện hành.
     * Hỗ trợ cả MySQL/MariaDB và SQLite để đảm bảo khả năng chạy kiểm thử độc lập.
     *
     * @return PDO Đối tượng kết nối cơ sở dữ liệu
     */
    public static function getConnection(): PDO
    {
        if (self::$connection !== null) {
            return self::$connection;
        }

        $driver = getenv('DB_DRIVER') ?: 'mysql';

        try {
            if ($driver === 'sqlite') {
                $sqlitePath = getenv('DB_SQLITE_PATH') ?: (__DIR__ . '/../../database/library.sqlite');
                $dsn = 'sqlite:' . $sqlitePath;
                self::$connection = new PDO($dsn);
                self::$connection->exec('PRAGMA foreign_keys = ON;');
            } else {
                $host = getenv('DB_HOST') ?: '127.0.0.1';
                $port = getenv('DB_PORT') ?: '3306';
                $dbName = getenv('DB_NAME') ?: 'digital_library_db';
                $username = getenv('DB_USER') ?: 'root';
                $password = getenv('DB_PASS') ?: '';

                $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $dbName);
                self::$connection = new PDO($dsn, $username, $password);
            }

            self::$connection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            self::$connection->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            self::$connection->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);

            return self::$connection;
        } catch (PDOException $exception) {
            error_log('[Database Error] Không thể kết nối CSDL: ' . $exception->getMessage());
            throw new RuntimeException('Hệ thống lưu trữ đang bảo trì. Vui lòng thử lại sau.');
        }
    }

    /**
     * Cho phép tiêm kết nối PDO phục vụ kiểm thử tích hợp (Integration Testing).
     *
     * @param PDO $pdo Kết nối PDO giả lập hoặc SQLite in-memory
     * @return void
     */
    public static function setConnection(PDO $pdo): void
    {
        self::$connection = $pdo;
    }
}

