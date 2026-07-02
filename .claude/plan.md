What to add next (aligned with TZ)
Priority — AI core

AI chat with project context — RAG over docs, tasks, Git, Figma (settings toggles are already in place)
Project health analysis — real scoring from open tasks, missing docs, stale Git
Global search (⌘K) — projects, tasks, docs in one index
Integrations

GitHub — commits, PRs, diff context for AI (not just a link in the card)
Figma — frame/component sync for AI
Backend WebSocket — real-time sync between devices (currently only tabs in one browser)
Product

Clients module — CRM tied to projects (schema already in backend)
Notifications — mentions, invites, task deadlines
Comments on tasks and docs
Activity log — audit trail on the dashboard
Role permissions — restrict edit/delete by role (roles exist, enforcement does not)
Offline → cloud sync when backend is connected
UX

Command palette (⌘K) — navigation and quick actions
Drag-and-drop files anywhere on the page
Markdown export for docs
Dark/light theme from settings applied on startup
Technical

Connect frontend to NestJS/Fastify API instead of localStorage
pgvector for semantic search in AI
BullMQ for background indexing (Git, docs)