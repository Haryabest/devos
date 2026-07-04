#!/usr/bin/env bash
# Install daily backup cron (03:00). Run as root or user with docker access.
# Usage: sudo bash setup-cron-backup.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT="${ROOT}/scripts/backup-all.sh"
LOG="/var/log/devos-backup.log"
CRON_LINE="0 3 * * * ${SCRIPT} >> ${LOG} 2>&1"

if crontab -l 2>/dev/null | grep -Fq "${SCRIPT}"; then
  echo "Cron entry already exists"
else
  (crontab -l 2>/dev/null; echo "${CRON_LINE}") | crontab -
  echo "Installed cron: ${CRON_LINE}"
fi

echo "Log file: ${LOG}"
