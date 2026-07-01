# DevOS

**AI Development Workspace** — единый контекст проекта: документация, задачи,
код, дизайн, клиенты и команда в одном интерфейсе. AI понимает проект целиком
благодаря RAG-индексации GitHub, GitLab, Figma, задач, комментариев и
документации.

## Структура

```
devos/
├── src/                  # React UI (Vite)
├── src-tauri/            # Tauri v2 desktop shell (Rust)
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── package.json          # фронт + Tauri
│
└── backend/              # самостоятельный pnpm workspace
    ├── api/              # @devos/api — NestJS + Fastify
    ├── packages/
    │   ├── shared/       # @devos/shared — Zod, RBAC, типы
    │   ├── db/           # @devos/db — Prisma + pgvector
    │   └── config/       # @devos/config — tsconfig/eslint пресеты
    ├── infra/
    │   └── docker-compose.yml   # postgres+pgvector, redis, minio
    ├── package.json
    ├── pnpm-workspace.yaml
    └── turbo.json
```

Фронт и backend разрабатываются независимо. Общего lockfile'а нет — у backend
свой pnpm-workspace, у фронта свой корневой `package.json`. Общение — по HTTP
через `/api` (в dev-режиме Vite проксирует на backend).

## Стек

- **Frontend:** React 18, TypeScript, Vite, React Router, TanStack Query,
  Zustand, TailwindCSS, shadcn/ui (встроен в `src/components/ui`), Lucide,
  Framer Motion
- **Desktop:** Tauri v2
- **Backend:** NestJS on Fastify, TypeScript, REST + WebSocket
- **DB:** PostgreSQL 16 + `pgvector`
- **Cache/Queues:** Redis + BullMQ
- **Auth:** JWT access + refresh
- **Storage:** LOCAL | S3 | MinIO | Backblaze B2 | Cloudflare R2
- **AI:** OpenAI (по умолчанию), слой готов под Claude / Gemini / локальные модели

## Быстрый старт

**Требования:** Node 20 (см. `.nvmrc`), pnpm 9, Docker, Rust (для Tauri).

### 1. Backend

```bash
cd backend
pnpm install
pnpm infra:up                    # postgres + redis + minio
cp api/.env.example api/.env
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev                         # NestJS на :3333
```

- API:      http://localhost:3333/api
- Swagger:  http://localhost:3333/api/docs
- MinIO UI: http://localhost:9001 (`devos` / `devos12345`)

### 2. Frontend (браузер)

```bash
# из корня
cp .env.example .env
pnpm install
pnpm dev                         # Vite на :1420
```

Открыть http://localhost:1420. Все `/api/*` и `/health` проксируются на
backend (`VITE_API_URL` в `.env`).

### 3. Desktop (Tauri)

```bash
pnpm tauri:dev
```

Соберёт нативное окно с тем же React-приложением. Backend должен быть запущен
отдельно (см. пункт 1).

## Скрипты

**Корень (фронт + Tauri):**

```bash
pnpm dev              # Vite
pnpm build            # tsc + vite build
pnpm preview          # предпросмотр prod-сборки
pnpm tauri:dev        # запустить в Tauri
pnpm tauri:build      # собрать нативный installer
pnpm lint             # eslint src
pnpm typecheck        # tsc --noEmit
```

**backend/:**

```bash
pnpm dev              # NestJS
pnpm build            # turbo build всех пакетов
pnpm lint             # eslint
pnpm typecheck        # tsc --noEmit
pnpm db:migrate       # Prisma
pnpm db:studio        # Prisma Studio
pnpm infra:up|down    # docker compose ↑ / ↓
```

## Модули backend

`auth`, `users`, `workspaces`, `projects`, `tasks`, `clients`, `files`,
`documents`, `github`, `gitlab`, `figma`, `ai`, `search`, `notifications`.

Каждый — самостоятельный NestJS-модуль под `backend/api/src/modules/*` со своим
`README.md` (описание ответственности и API-контракта).

## AI слой

Абстракция `AiProvider` (OpenAI сейчас; Claude / Gemini / локальные — план).
RAG-пайплайн:

1. **Ingest:** документы, задачи, комментарии, GitHub-код, Figma-описания
   разбиваются на чанки → embedding'и `text-embedding-3-small` (1536) →
   таблица `Embedding` c `vector(1536)` (pgvector, ivfflat).
2. **Retrieve:** `SELECT ... ORDER BY embedding <=> $1 LIMIT topK` с фильтрами
   по `workspaceId` / `projectId` / `sourceType`.
3. **Reason:** system prompt под роль (chat / task-generator / analyst / CTO /
   health-score) + собранный контекст → провайдер → стрим клиенту.

Отдельно AI Memory — постоянные архитектурные решения, всегда подмешиваются
в контекст.

## Роли (RBAC)

`OWNER > ADMIN > MANAGER > DEVELOPER > VIEWER > GUEST`. См.
`backend/packages/shared/src/roles.ts`.

## Режимы работы

- **Guest Mode** — временные проекты без регистрации, лимиты запросов, автоочистка.
- **Cloud SaaS** — основной режим (managed).
- **Self Hosted** — тот же образ, разворачивается через `backend/infra/docker-compose.yml`.

## Разработка

См. [.claude/CLAUDE.md](.claude/CLAUDE.md) — операционные правила для Claude
Code в этом репо.
