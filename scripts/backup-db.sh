#!/bin/sh
# ==============================================================================
# Script tự động sao lưu Cơ sở dữ liệu PostgreSQL 16 lúc 02:00 sáng
# Phụ trách: Nguyễn Anh Khoa (52400051)
# Crontab: 0 2 * * * /scripts/backup-db.sh >> /var/log/pg_backup.log 2>&1
# ==============================================================================

set -e

BACKUP_DIR="${BACKUP_DIR:-/backups}"
POSTGRES_HOST="${DB_HOST:-db}"
POSTGRES_PORT="${DB_PORT:-5432}"
POSTGRES_DB="${DB_DATABASE:-digital_library}"
POSTGRES_USER="${DB_USERNAME:-library_user}"
export PGPASSWORD="${DB_PASSWORD:-library_secret}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/digital_library_backup_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Bắt đầu sao lưu cơ sở dữ liệu ${POSTGRES_DB}..."

pg_dump -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" --no-owner --clean | gzip > "${BACKUP_FILE}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Sao lưu hoàn tất thành công: ${BACKUP_FILE}"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Kích thước tệp sao lưu: $(du -h "${BACKUP_FILE}" | cut -f1)"

# Tự động dọn dẹp các bản sao lưu cũ hơn 30 ngày
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Dọn dẹp bản sao lưu cũ hơn 30 ngày..."
find "${BACKUP_DIR}" -type f -name "digital_library_backup_*.sql.gz" -mtime +30 -exec rm -f {} \;

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Quy trình sao lưu kết thúc."

