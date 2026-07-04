#!/usr/bin/env bash
# Restore Postgres from gzipped dump inside devos-backups volume.
# Usage:
#   bash restore-postgres.sh /backups/postgres_20260704_030000.sql.gz
# Or via compose:
#   docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm \
#     -v devos-backups:/backups backup sh -c 'gunzip -c /backups/postgres_XXX.sql.gz | psql ...'

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DUMP="${1:?Usage: restore-postgres.sh /path/to/dump.sql.gz}"

if [[ ! -f "${DUMP}" ]]; then
  echo "File not found: ${DUMP}" >&2
  exit 1
fi

echo "Restoring ${DUMP} to Postgres..."
docker compose -f "${ROOT}/docker-compose.prod.yml" --env-file "${ROOT}/.env.prod" exec -T postgres \
  sh -c 'gunzip -c -' < "${DUMP}" | \
  docker compose -f "${ROOT}/docker-compose.prod.yml" --env-file "${ROOT}/.env.prod" exec -T postgres \
  psql -U "${POSTGRES_USER:-devos}" -d "${POSTGRES_DB:-devos}"

echo "Restore complete. Verify with: curl http://localhost:8080/health"
