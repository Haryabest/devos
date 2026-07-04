# DevOS

**AI-first development workspace** — единая среда для команды: проекты, задачи, документация, клиенты, whiteboard, roadmap и AI-ассистент с доступом ко всему контексту workspace.

DevOS объединяет то, что обычно разбросано по Notion, Jira, Figma и GitHub, в одном интерфейсе. Backend хранит данные в PostgreSQL, индексирует их для семантического поиска (pgvector + RAG) и отдаёт REST/WebSocket API. Frontend — React-приложение, которое можно запускать в браузере или как desktop-приложение через Tauri.

---

## Что умеет DevOS

| Область | Возможности |
|--------|-------------|
| **Проекты** | Kanban-задачи, спринты, зависимости, комментарии, health-score |
| **Документы** | Markdown-редактор, папки, AI-помощник по тексту |
| **Клиенты** | CRM-lite: контакты, договоры, заметки |
| **Roadmap** | Milestones, версии, AI-предложения по плану |
| **Whiteboard** | Совместное рисование (Yjs), AI-подсказки по доске |
| **AI Center** | Чат, генерация задач, анализ проекта, контекст из workspace |
| **Интеграции** | OAuth GitHub / GitLab / Figma, GitHub webhooks для auto-sync |
| **Уведомления** | REST + push в реальном времени через WebSocket |
| **Команда** | Workspaces, роли (RBAC), приглашения |
| **Файлы** | LOCAL / MinIO / S3 / R2 / B2 |

**Режимы работы:** Cloud SaaS, Self-hosted (Docker / Kubernetes), Guest Mode (локально без регистрации).

---

## Стек

### Frontend

| Категория | Технологии |
|-----------|------------|
| UI | React 18, TypeScript, Vite 5 |
| Routing & data | React Router 6, TanStack Query |
| State | Zustand (persist), Yjs (collab) |
| Styling | Tailwind CSS, Radix UI, shadcn/ui, Framer Motion |
| Desktop | Tauri v2 (Rust shell) |
| Прочее | Recharts, MiniSearch, jsPDF, xlsx |

### Backend

| Категория | Технологии |
|-----------|------------|
| Runtime | Node.js 20+, TypeScript |
| Framework | NestJS 10 on Fastify |
| ORM | Prisma 5 |
| БД | PostgreSQL 16 + **pgvector** |
| Cache & queues | Redis 7, **BullMQ** (embeddings, email, GitHub sync) |
| Auth | JWT access + refresh (argon2) |
| Real-time | WebSocket (`/ws/collab`, `/ws/notifications`) |
| Storage | AWS SDK S3 (MinIO-совместимый) |
| AI | OpenAI (chat + embeddings), слой готов к другим провайдерам |
| API docs | Swagger UI |

### Инфраструктура

Docker Compose: **Postgres (pgvector)**, **Redis**, **MinIO**. Production: multi-stage Dockerfiles + Kubernetes manifest.

---

## Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│  Browser / Tauri desktop (:1420)                            │
│  React · Zustand · TanStack Query · Yjs                     │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST /api  ·  WS /ws/*
┌──────────────────────────▼──────────────────────────────────┐
│  NestJS API (:3333)                                         │
│  auth · projects · tasks · docs · ai · integrations · …     │
│  BullMQ workers: embeddings · notifications · github-sync   │
└──────┬──────────────┬──────────────┬────────────────────────┘
       │              │              │
  PostgreSQL       Redis          MinIO
  + pgvector       queues         files
  (:54329)         (:6380)        (:9002 / :9003)
```

Monorepo устроен как **два независимых pnpm-проекта**: корень (frontend + Tauri) и `backend/` (API + packages). Общего lockfile нет — каждая часть устанавливается отдельно.

---

## Структура репозитория

```
devos/
├── src/                      # React UI
├── src-tauri/                # Tauri v2 (desktop)
├── vite.config.ts
├── package.json              # frontend
│
└── backend/
    ├── api/                  # @devos/api — NestJS REST + WebSocket
    ├── packages/
    │   ├── db/               # Prisma schema, migrations, seed
    │   ├── shared/           # Zod-схемы, RBAC, типы
    │   └── config/           # tsconfig / eslint presets
    ├── infra/
    │   ├── docker-compose.yml       # dev: postgres, redis, minio
    │   ├── docker-compose.prod.yml  # production stack
    │   └── k8s/deployment.yaml
    └── package.json
```

---

## Требования

- **Node.js** ≥ 20.11 (см. `.nvmrc`)
- **pnpm** 9
- **Docker** (для Postgres, Redis, MinIO)
- **Rust** — только для `pnpm tauri:dev` / `pnpm tauri:build`

---

## Быстрый старт

### 1. Инфраструктура и backend

```bash
cd backend
pnpm install
pnpm infra:up
```

Создайте `backend/api/.env` (минимум для локальной разработки):

```env
NODE_ENV=development
PORT=3333
HOST=0.0.0.0
DATABASE_URL=postgresql://devos:devos@localhost:54329/devos
REDIS_URL=redis://localhost:6380
JWT_ACCESS_SECRET=change-me-access-min-16-chars
JWT_REFRESH_SECRET=change-me-refresh-min-16-chars
CORS_ORIGIN=http://localhost:1420,http://127.0.0.1:1420,http://localhost:5173,http://127.0.0.1:5173

# Опционально — AI и OAuth
OPENAI_API_KEY=sk-...
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

Полный список переменных — в [`backend/api/.env.example`](backend/api/.env.example).

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

| Сервис | URL |
|--------|-----|
| API | http://localhost:3333/api |
| Swagger | http://localhost:3333/api/docs |
| Health | http://localhost:3333/health |
| MinIO S3 | http://localhost:9002 |
| MinIO Console | http://localhost:9003 (`devos` / `devos12345`) |

### 2. Frontend (браузер)

```bash
# из корня репозитория
pnpm install
pnpm dev
```

Откройте **http://localhost:1420**.

Запросы к API идут через Vite proxy (`/api` → `:3333`). Если нужен прямой URL (например, для Tauri), задайте в корневом `.env`:

```env
VITE_API_URL=http://localhost:3333
```

### 3. Desktop (Tauri)

```bash
pnpm tauri:dev
```

Backend должен быть уже запущен (шаг 1).

---

## Демо-аккаунт

После `pnpm db:seed`:

| Поле | Значение |
|------|----------|
| Email | `owner@devos.local` |
| Пароль | `devos12345` |

Seed создаёт workspace с проектами, задачами, документами, клиентами, whiteboard, уведомлениями и интеграциями.

---

## AI и RAG

1. **Ingest** — документы и задачи разбиваются на чанки, embedding'и (`text-embedding-3-small`, 1536 dim) пишутся в таблицу `Embedding` (pgvector).
2. **Worker** — BullMQ-очередь `embeddings-index` обрабатывает индексацию асинхронно.
3. **Retrieve** — при вопросе AI выполняет семантический поиск: `ORDER BY embedding <=> query_vector`.
4. **Reason** — контекст workspace + RAG-чанки → OpenAI chat.

Запуск индексации workspace (нужен `OPENAI_API_KEY`):

```http
POST /api/ai/index-workspace?workspaceId=<id>
Authorization: Bearer <token>
```

---

## Real-time и интеграции

| Канал | Назначение |
|-------|------------|
| `WS /ws/collab` | Синхронизация stores, presence, Yjs whiteboard, voice signals |
| `WS /ws/notifications` | Push уведомлений при создании (JWT в query `?token=`) |
| `POST /api/integrations/github/webhook` | GitHub push events → BullMQ `github-sync` |

OAuth callback: `/api/integrations/{github\|gitlab\|figma}/callback`.

---

## Скрипты

**Корень (frontend):**

```bash
pnpm dev              # Vite dev server (:1420)
pnpm build            # production build
pnpm preview          # preview prod build
pnpm tauri:dev        # desktop dev
pnpm tauri:build      # native installer
pnpm lint             # ESLint
pnpm typecheck        # tsc --noEmit
```

**backend/:**

```bash
pnpm dev              # NestJS watch mode
pnpm build            # turbo build всех пackages
pnpm typecheck        # TypeScript check
pnpm db:migrate       # Prisma migrate
pnpm db:seed          # demo data
pnpm db:studio        # Prisma Studio
pnpm infra:up         # docker compose up
pnpm infra:down       # docker compose down
```

---

## Модули backend

`auth` · `users` · `workspaces` · `projects` · `tasks` · `clients` · `documents` · `files` · `whiteboards` · `roadmap` · `integrations` · `ai` · `search` · `notifications` · `sync`

Каждый модуль — отдельная папка в `backend/api/src/modules/` с controller, service и (где нужно) README.

---

## RBAC

Роли workspace (от высшей к низшей):

`OWNER` → `ADMIN` → `MANAGER` → `DEVELOPER` → `VIEWER` → `GUEST`

Определение прав: `backend/packages/shared/src/roles.ts`.

---

## Production

```bash
cp backend/infra/.env.prod.example backend/infra/.env.prod
# заполните секреты: JWT_*, POSTGRES_PASSWORD, MINIO_ROOT_PASSWORD, CORS_ORIGIN
docker compose -f backend/infra/docker-compose.prod.yml --env-file backend/infra/.env.prod up -d --build
```

- **Frontend:** http://localhost:8080  
- **API:** http://localhost:3333  
- **Metrics:** http://localhost:3333/metrics  
- **Worker:** отдельный контейнер (BullMQ)

Миграции выполняются автоматически при старте API/worker. Подробнее: [`backend/infra/README.md`](backend/infra/README.md).

### Staging

```bash
cp backend/infra/.env.staging.example backend/infra/.env.staging
docker compose -f backend/infra/docker-compose.staging.yml --env-file backend/infra/.env.staging up -d --build
bash backend/infra/scripts/staging-smoke.sh http://localhost:8081
# Windows: powershell -ExecutionPolicy Bypass -File backend/infra/scripts/staging-smoke.ps1 http://localhost:8081
```

### Готовность к production

| Сценарий | Готовность | Что сделано |
|----------|------------|-------------|
| **Docker Compose (1 VPS, команда)** | **92%** | Prod + staging compose, секреты, migrate, worker, backup/cron, TLS helper, smoke tests |
| **Kubernetes / multi-replica** | **88%** | Полный k8s stack, HPA, Ingress + sticky, Redis WS bridge, ServiceMonitor |
| **Публичный SaaS** | **78%** | Rate limit, webhook raw body, observability, CI с integration/e2e; нужен security audit + больше e2e |

| Компонент | Статус |
|-----------|--------|
| Тесты + CI | Unit + integration (auth, webhook) + e2e + load smoke; Postgres/Redis в CI |
| GitHub webhook | Raw body через Fastify `preParsing` hook |
| WebSocket scaling | Redis pub/sub bridge для notifications + collab |
| K8s | API, worker, frontend, Postgres, Redis, MinIO, Ingress, HPA, ServiceMonitor |
| Ops | Staging compose, cron backup, restore, TLS script, alerting docs |
| Секреты | `.env.prod` / `.env.staging` в `.gitignore` |

Перед go-live: заполнить секреты, прогнать staging smoke, настроить TLS + Sentry + cron backup.

- API Dockerfile: `backend/api/Dockerfile`  
- Frontend Dockerfile: корневой `Dockerfile` (Vite + nginx)  
- Kubernetes: `backend/infra/k8s/deployment.yaml`

---

## Troubleshooting

**401 Unauthorized на всех запросах** — истёк access token (TTL 15 мин). Выйдите и войдите снова или очистите `localStorage` → ключ `devos:auth`. Клиент автоматически обновляет токен через `/api/auth/refresh`.

**CORS** — убедитесь, что origin фронтенда (`http://127.0.0.1:1420`) есть в `CORS_ORIGIN` backend `.env`.

**Порт 3333 занят** — остановите предыдущий процесс API или смените `PORT` в `.env`.

**Устаревший workspaceId** — после re-seed выйдите из аккаунта и войдите заново; bootstrap подхватит актуальный workspace.

---

## Лицензия

Private project (`0.1.0`).
