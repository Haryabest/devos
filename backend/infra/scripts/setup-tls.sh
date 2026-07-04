#!/usr/bin/env bash
# TLS setup helper with certbot (nginx on host or separate reverse proxy).
# Usage: sudo bash setup-tls.sh devos.example.com

set -euo pipefail
DOMAIN="${1:?Usage: setup-tls.sh example.com}"
EMAIL="${2:-admin@${DOMAIN}}"

if ! command -v certbot >/dev/null 2>&1; then
  echo "Install certbot first (apt install certbot / brew install certbot)" >&2
  exit 1
fi

certbot certonly --standalone -d "${DOMAIN}" --email "${EMAIL}" --agree-tos --non-interactive

echo ""
echo "Certificates:"
echo "  /etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
echo "  /etc/letsencrypt/live/${DOMAIN}/privkey.pem"
echo ""
echo "Mount them into frontend nginx using nginx.ssl.conf.example"
echo "Renewal cron is usually installed by certbot package."
