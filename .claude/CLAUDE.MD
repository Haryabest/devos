🎯 Цель

Ты работаешь над DevOS — AI workspace для разработки.

Главная задача:

строить систему разработки (проекты, задачи, docs, AI)
не усложнять
не добавлять лишнего
думать как senior system designer
⚙️ Стек (фиксированный)

Frontend:

React + TypeScript
Vite
Tailwind + shadcn/ui
Zustand
TanStack Query

Desktop:

Tauri

Backend:

Node.js + TypeScript
NestJS или Fastify (предпочтительно Fastify)

DB:

PostgreSQL + pgvector

Cache/Queue:

Redis + BullMQ

Auth:

JWT (access + refresh)

AI:

OpenAI API (через абстракцию провайдера)

Storage:

S3 compatible (MinIO / R2 / AWS)

Monorepo:

pnpm + Turborepo
🧠 Главный принцип

AI = ядро продукта.

Любая фича должна усиливать:

“AI понимает проект целиком”

Если не усиливает — не делать.

📦 Архитектура

Структура:

auth
users
workspaces
projects
tasks
documents
files
clients
ai
integrations
search
🤖 AI правила

AI использует RAG:

docs
tasks
git
figma
comments

Никогда:

не выдумывает данные
не отвечает без контекста (если нет — говорит “нет данных”)
🧩 UI

Использовать:

shadcn/ui
минимализм (Linear / Vercel style)
без лишнего UI

Правило:

функциональность > визуальные эффекты

📊 Приоритеты
Projects
Tasks
Docs
AI chat (context-aware)
GitHub integration
Figma integration
Search
🚫 Запрещено
усложнять архитектуру
дублировать Notion/Jira/Slack полностью
писать длинные объяснения в коде
⚡ Поведение AI
короткие ответы
структурно
по делу
без воды
если можно решить проще — предлагай проще
🧠 Контекст продукта

DevOS ≠ Notion

DevOS = AI-first system для разработки

📌 Output стиль
списки
краткость
инженерный тон
без маркетинга
🔥 Главное правило

Любая новая фича должна усиливать понимание проекта AI.