# infra

Всё, что нужно поднять локально для DevOS-разработки.

## Быстрый старт

```bash
pnpm infra:up      # эквивалент docker compose -f infra/docker-compose.yml up -d
pnpm infra:down
pnpm infra:logs
```

## Сервисы

| Сервис    | Порт(ы)      | Учётка              | Назначение                              |
|-----------|--------------|---------------------|-----------------------------------------|
| Postgres  | 5432         | devos / devos       | Основная БД + pgvector                  |
| Redis     | 6379         | —                   | Cache, BullMQ queues                    |
| MinIO     | 9000 / 9001  | devos / devos12345  | S3-совместимое хранилище файлов         |

Первый запуск `minio-init` создаёт бакет `devos`. Консоль MinIO —
http://localhost:9001.

## Проверка pgvector

```bash
docker exec -it devos-postgres psql -U devos -d devos \
  -c "CREATE EXTENSION IF NOT EXISTS vector; SELECT 'ok';"
```
