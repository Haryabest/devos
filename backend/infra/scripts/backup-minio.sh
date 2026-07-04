#!/usr/bin/env bash
# Backup MinIO bucket via mc. Запускайте на хосте с доступом к MinIO.
set -euo pipefail

MINIO_ALIAS="${MINIO_ALIAS:-local}"
MINIO_ENDPOINT="${MINIO_ENDPOINT:-http://localhost:9002}"
MINIO_USER="${MINIO_USER:-devos}"
MINIO_PASS="${MINIO_PASS:-devos12345}"
BUCKET="${MINIO_BUCKET:-devos}"
OUT_DIR="${BACKUP_DIR:-./backups/minio}"

mkdir -p "${OUT_DIR}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE="${OUT_DIR}/minio_${BUCKET}_${TIMESTAMP}.tar.gz"

mc alias set "${MINIO_ALIAS}" "${MINIO_ENDPOINT}" "${MINIO_USER}" "${MINIO_PASS}" 2>/dev/null || true
mc mirror "${MINIO_ALIAS}/${BUCKET}" "${OUT_DIR}/mirror_${TIMESTAMP}"
tar -czf "${ARCHIVE}" -C "${OUT_DIR}" "mirror_${TIMESTAMP}"
rm -rf "${OUT_DIR}/mirror_${TIMESTAMP}"

echo "MinIO backup: ${ARCHIVE}"
