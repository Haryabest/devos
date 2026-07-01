# AI Module

Провайдер-агностик (`AiProvider` абстракция: OpenAI сейчас,
Anthropic/Gemini/локальные позже) + RAG-пайплайн:

1. `Embedder.embed(text) → vector(1536)` через pgvector
2. `Retriever.search(workspaceId, query, topK)` — cosine + фильтры по проекту
3. `ChatService.ask({workspaceId, question, projectId?})`:
   - собирает контекст: docs, tasks, comments, code, design, ai memory
   - формирует system prompt (role: AI CTO / analyst / task generator — в зависимости от endpoint)
   - стримит ответ клиенту через WebSocket

Endpoints:
- `POST /ai/ask` — свободный чат
- `POST /ai/tasks/generate` — генерация задач из документа
- `POST /ai/analyze` — AI project analyst
- `POST /ai/cto/audit` — AI CTO
- `GET /ai/health-score` — Green/Yellow/Red
- `POST /ai/memory` — сохранение архитектурного решения
