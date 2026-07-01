# @devos/api

DevOS backend — NestJS on top of Fastify, Prisma + pgvector, Redis (BullMQ),
провайдер-агностичный AI слой.

## Быстрый старт

```bash
cp .env.example .env
pnpm --filter @devos/api dev
```

Требуется поднятый Postgres + Redis: `pnpm infra:up` из корня.

- API: http://localhost:3333/api
- Health: http://localhost:3333/health
- Swagger UI: http://localhost:3333/api/docs

## Модули

- `auth` — JWT access+refresh, guards, RBAC
- `users` — CRUD пользователей
- `workspaces` — рабочие пространства + members
- `projects` — проекты, roadmap, milestones, sprints
- `tasks` — задачи, зависимости, комментарии
- `clients` — заказчики workspace
- `files` — LOCAL/S3/MinIO/R2/B2 через `StorageDriver`
- `documents` — markdown wiki + импорт PDF/DOCX/…
- `github` / `gitlab` / `figma` — интеграции
- `ai` — RAG + провайдер-агностичный chat / task-gen / CTO / health-score
- `search` — global search (fts + pgvector rerank)
- `notifications` — in-app + email

Каждый модуль сейчас — заглушка `@Module({})`; см. README внутри модуля.
