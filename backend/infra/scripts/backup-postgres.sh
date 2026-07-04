#!/bin/sh
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUT="/backups/postgres_${TIMESTAMP}.sql.gz"

mkdir -p /backups
echo "Backing up Postgres to ${OUT}..."
pg_dump -h postgres -U "${POSTGRES_USER}" "${POSTGRES_DB}" | gzip > "${OUT}"
echo "Done: ${OUT}"
ls -lh /backups | tail -5
