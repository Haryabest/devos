#!/usr/bin/env bash
# Cron-friendly wrapper: postgres + minio backups.
# Example crontab (daily at 03:00):
#   0 3 * * * /path/to/devos/backend/infra/scripts/backup-all.sh >> /var/log/devos-backup.log 2>&1

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

docker compose -f "${ROOT}/docker-compose.prod.yml" --profile backup run --rm backup

if command -v mc >/dev/null 2>&1; then
  bash "${ROOT}/scripts/backup-minio.sh"
else
  echo "mc not installed — skip MinIO backup (install minio client)"
fi
