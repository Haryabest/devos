#!/usr/bin/env bash
# Smoke test against staging/prod URL.
# Usage: bash staging-smoke.sh http://localhost:8081

set -euo pipefail
BASE="${1:-http://localhost:8081}"

fail() {
  echo ""
  echo "ERROR: $1" >&2
  echo ""
  echo "Staging not reachable? Run:"
  echo "  docker compose -f backend/infra/docker-compose.staging.yml --env-file backend/infra/.env.staging up -d --build"
  exit 1
}

echo "Smoke test: ${BASE}"

health_body="$(curl -fsS "${BASE}/health" 2>/dev/null)" || fail "Cannot connect to ${BASE}/health — is Docker running and staging stack up?"
echo "${health_body}" | grep -q '"status"' || fail "Foreign API on ${BASE}/health (not DevOS): ${health_body}"
echo "✓ /health"

curl -fsS "${BASE}/metrics" | grep -q 'devos_'
echo "✓ /metrics"

code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "${BASE}/api/auth/login" \
  -H 'content-type: application/json' \
  -d '{"email":"missing@devos.local","password":"wrong"}')
test "$code" = "401"
echo "✓ /api/auth/login rejects bad credentials"

echo "All smoke checks passed."
