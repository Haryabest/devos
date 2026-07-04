# Alerting setup (Grafana + Sentry)

## Sentry (errors)

1. Create project at [sentry.io](https://sentry.io)
2. Set `SENTRY_DSN` in `.env.prod` / `.env.staging`
3. API initializes Sentry on boot when DSN is present

Recommended alerts:
- New issue in production
- Error rate spike (>10 events / 5 min)

## Prometheus + Grafana (metrics)

1. Scrape `GET /metrics` from API (or nginx proxy `/metrics`)
2. Key metrics: `devos_*` process metrics from prom-client
3. Example alert rules:
   - `up{job="devos-api"} == 0` for 2m → PagerDuty/Slack
   - Health endpoint returns `degraded` (custom check via blackbox exporter)

## Health checks

- Liveness: `GET /health` → `status: ok`
- Staging smoke: `bash scripts/staging-smoke.sh http://localhost:8081`
- Cron backup log: `/var/log/devos-backup.log`

## Kubernetes

Apply `k8s/servicemonitor.yaml` if kube-prometheus-stack is installed.
Grafana dashboard can import Prometheus datasource and graph `devos_*` metrics.
