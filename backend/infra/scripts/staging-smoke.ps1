# Smoke test against staging/prod URL (Windows / PowerShell).
# Usage: powershell -ExecutionPolicy Bypass -File backend/infra/scripts/staging-smoke.ps1 http://localhost:8081

param(
  [string]$Base = 'http://localhost:8081'
)

$ErrorActionPreference = 'Stop'

function Fail([string]$Message) {
  Write-Host ""
  Write-Host $Message -ForegroundColor Red
  Write-Host ""
  Write-Host "Staging not reachable? Run:" -ForegroundColor Yellow
  Write-Host "  docker compose -f backend/infra/docker-compose.staging.yml --env-file backend/infra/.env.staging up -d --build"
  Write-Host ""
  Write-Host "If port 8081 is occupied by another app, stop it or change frontend ports in docker-compose.staging.yml"
  exit 1
}

Write-Host "Smoke test: $Base"

try {
  $healthRaw = Invoke-WebRequest -Uri "$Base/health" -Method Get -UseBasicParsing
} catch {
  if ($_.Exception.Response) {
    $body = $_.ErrorDetails.Message
    if ($body -match 'error_code') {
      Fail "/health returned foreign API (not DevOS). Port $Base is used by another service.`nResponse: $body"
    }
  }
  Fail "Cannot connect to $Base/health — is Docker Desktop running and staging stack up?"
}

$health = $healthRaw.Content | ConvertFrom-Json
if ($health.error_code) {
  Fail "/health returned foreign API (not DevOS). Response: $($healthRaw.Content)"
}
if ($health.status -notin @('ok', 'degraded')) {
  Fail "/health: expected status ok/degraded, got: $($healthRaw.Content)"
}
Write-Host 'OK /health'

$metrics = Invoke-WebRequest -Uri "$Base/metrics" -Method Get -UseBasicParsing
if ($metrics.Content -notmatch 'devos_') {
  Fail '/metrics: devos_ metrics not found — nginx may not proxy to DevOS API'
}
Write-Host 'OK /metrics'

try {
  Invoke-WebRequest -Uri "$Base/api/auth/login" -Method Post `
    -ContentType 'application/json' `
    -Body '{"email":"missing@devos.local","password":"wrong"}' `
    -UseBasicParsing | Out-Null
  Fail '/api/auth/login: expected 401 for bad credentials'
} catch {
  $status = $_.Exception.Response.StatusCode.value__
  if ($status -ne 401) {
    Fail "/api/auth/login: expected 401, got $status"
  }
}
Write-Host 'OK /api/auth/login rejects bad credentials'

Write-Host ''
Write-Host 'All smoke checks passed.' -ForegroundColor Green
