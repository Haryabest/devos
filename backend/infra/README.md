# Production and production-like infrastructure for DevOS.

## Dev (локально)

```bash
pnpm infra:up
pnpm infra:down
pnpm infra:logs
```

| Сервис   | Порт(ы)           | Учётка (dev)        |
|----------|-------------------|---------------------|
| Postgres | **54329** → 5432  | devos / devos         |
| Redis    | **6380** → 6379   | —                     |
| MinIO    | **9002** / **9003** | devos / devos12345  |

## Production

```bash
cp .env.prod.example .env.prod
# заполните секреты (JWT, POSTGRES_PASSWORD, MINIO_ROOT_PASSWORD, CORS_ORIGIN)
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
bash scripts/staging-smoke.sh http://localhost:8080
# Windows (PowerShell):
# powershell -ExecutionPolicy Bypass -File scripts/staging-smoke.ps1 http://localhost:8080
```

Сервисы:
- **api** — HTTP + WebSocket, auto-migrate при старте
- **worker** — BullMQ (embeddings, email, github-sync), 1 replica
- **frontend** — nginx с proxy `/api`, `/ws`, `/metrics`
- **postgres**, **redis**, **minio**

## Staging

```bash
cp .env.staging.example .env.staging
docker compose -f docker-compose.staging.yml --env-file .env.staging up -d --build
bash scripts/staging-smoke.sh http://localhost:8081
# Windows: powershell -ExecutionPolicy Bypass -File backend/infra/scripts/staging-smoke.ps1 http://localhost:8081
```

Порты staging: frontend **8081**, API **3334**.

### Секреты

В `.env.prod` / `.env.staging` **обязательны** (compose упадёт без них):

- `POSTGRES_PASSWORD`, `MINIO_ROOT_PASSWORD`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (≥ 16 символов)
- `CORS_ORIGIN`

Файлы `.env.prod` и `.env.staging` в `.gitignore` — не коммитьте.

Примеры: [`.env.prod.example`](.env.prod.example), [`.env.staging.example`](.env.staging.example)

### TLS

```bash
sudo bash scripts/setup-tls.sh devos.example.com
```

HTTP-only конфиг в корневом `nginx.conf`. Для HTTPS: [`nginx.ssl.conf.example`](../../nginx.ssl.conf.example).

### Backup & restore

```bash
# Установить cron (ежедневно 03:00)
sudo bash scripts/setup-cron-backup.sh

# Postgres one-shot
docker compose -f docker-compose.prod.yml --env-file .env.prod --profile backup run --rm backup

# Restore
bash scripts/restore-postgres.sh /path/to/postgres_YYYYMMDD.sql.gz
```

### Alerting

См. [`alerting/README.md`](alerting/README.md) — Sentry, Prometheus/Grafana, health checks.

### Observability

- **Health:** `GET /health`
- **Prometheus:** `GET /metrics` (skip rate limit)
- **Sentry:** `SENTRY_DSN` в `.env.prod`
- **Email:** `SMTP_*` — иначе worker логирует письма в stdout

### WebSocket scaling

API публикует WS-события через **Redis pub/sub** (`WsRedisBridgeService`). Несколько реплик API получают уведомления и collab-сообщения без sticky sessions. Ingress всё равно настроен с cookie affinity как дополнительная оптимизация.

### Kubernetes

```bash
kubectl apply -f k8s/namespace.yaml
cp k8s/secrets.example.yaml k8s/secrets.yaml  # заполните
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres.yaml -f k8s/redis.yaml -f k8s/minio.yaml
kubectl apply -f k8s/deployment.yaml -f k8s/worker.yaml -f k8s/frontend.yaml
kubectl apply -f k8s/ingress.yaml -f k8s/hpa.yaml
kubectl apply -f k8s/servicemonitor.yaml  # kube-prometheus-stack
```

Манифесты: API (2 repl) + worker + frontend + Postgres + Redis + MinIO + Ingress + HPA + ServiceMonitor.

### Tests

```bash
cd ../api && pnpm test
```

CI поднимает Postgres + Redis, применяет миграции и гоняет unit + integration + e2e + load smoke.
