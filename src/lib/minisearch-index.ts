import MiniSearch from 'minisearch';
import { useDocsStore } from '@/stores/docs-store';
import { useProjectsStore } from '@/stores/projects-store';
import { useTasksStore } from '@/stores/tasks-store';

export type SearchResultKind = 'project' | 'task' | 'doc';

export interface SearchHit {
  id: string;
  kind: SearchResultKind;
  title: string;
  subtitle?: string;
  href: string;
}

let index: MiniSearch<SearchHit> | null = null;
let builtAt = 0;

function buildIndex(): MiniSearch<SearchHit> {
  const docs: SearchHit[] = [];
  for (const p of useProjectsStore.getState().projects) {
    docs.push({
      id: p.id,
      kind: 'project',
      title: p.name,
      subtitle: p.description,
      href: `/projects/${p.id}`,
    });
  }
  for (const t of useTasksStore.getState().tasks) {
    if (t.parentId) continue;
    docs.push({
      id: t.id,
      kind: 'task',
      title: t.title || 'Без названия',
      subtitle: t.description.slice(0, 120),
      href: `/projects/${t.projectId}/tasks/${t.id}`,
    });
  }
  for (const d of useDocsStore.getState().docs) {
    docs.push({
      id: d.id,
      kind: 'doc',
      title: d.title,
      subtitle: d.content.slice(0, 120),
      href: `/projects/${d.projectId}/docs/${d.id}`,
    });
  }
  const ms = new MiniSearch({
    fields: ['title', 'subtitle'],
    storeFields: ['kind', 'title', 'subtitle', 'href'],
    searchOptions: { boost: { title: 2 }, fuzzy: 0.2, prefix: true },
  });
  ms.addAll(docs);
  return ms;
}

export function searchWorkspace(query: string, limit = 12): SearchHit[] {
  const q = query.trim();
  if (!q) return [];
  const now = Date.now();
  if (!index || now - builtAt > 30_000) {
    index = buildIndex();
    builtAt = now;
  }
  return (index.search(q) as unknown as SearchHit[]).slice(0, limit);
}

export function invalidateSearchIndex() {
  index = null;
}
