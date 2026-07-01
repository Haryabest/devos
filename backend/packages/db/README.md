# @devos/db

Prisma schema + client + pgvector миграция.

## Основные модели

- User, RefreshToken
- Workspace, WorkspaceMember
- Client
- Project, Sprint, Milestone
- Task, TaskDependency
- Document, DocumentFolder, DocumentRevision
- File
- Comment
- Integration (GitHub/GitLab/Figma)
- AiConversation, AiMessage
- Embedding (pgvector vector(1536)) — источник для RAG
- AiMemory — постоянные решения/архитектурные заметки
- Notification, AuditEvent

## Команды

```bash
# из корня repo
pnpm db:generate       # сгенерировать клиент
pnpm db:migrate        # применить миграции (dev)
pnpm db:seed           # засеять минимальный набор
pnpm db:studio         # открыть Prisma Studio
```

## pgvector

Расширение включается через `previewFeatures = ["postgresqlExtensions"]` +
дополнительная SQL-миграция `0001_pgvector` создаёт ivfflat-индекс.

Требуется Postgres с установленным `pgvector` (см. `infra/docker-compose.yml`,
образ `pgvector/pgvector:pg16`).
