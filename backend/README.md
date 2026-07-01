# DevOS backend

Самостоятельный pnpm workspace: NestJS API + Prisma/pgvector + Redis + shared-пакеты.

Frontend (React + Tauri) живёт в корне репозитория (`../src`, `../src-tauri`) и
работает автономно — ходит в этот backend через HTTP (`/api`).

## Структура

```
backend/
├── api/                  # @devos/api — NestJS + Fastify
├── packages/
│   ├── shared/           # @devos/shared — Zod-схемы, типы, RBAC
│   ├── db/               # @devos/db — Prisma schema, миграции, seed
│   └── config/           # @devos/config — tsconfig/eslint пресеты
├── infra/
│   └── docker-compose.yml   # postgres+pgvector, redis, minio
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Быстрый старт

```bash
cd backend
pnpm install

# инфраструктура
pnpm infra:up

# БД
cp api/.env.example api/.env
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# запуск API
pnpm dev
```

- API:      http://localhost:3333/api
- Swagger:  http://localhost:3333/api/docs
- Health:   http://localhost:3333/health
- MinIO UI: http://localhost:9001 (`devos` / `devos12345`)

## Полезные скрипты

```bash
pnpm dev              # nest dev
pnpm build            # turbo build всех пакетов
pnpm lint             # eslint
pnpm typecheck        # tsc --noEmit
pnpm db:migrate       # prisma migrate deploy/dev
pnpm db:studio        # Prisma Studio
pnpm infra:up|down    # docker compose ↑ / ↓
```
