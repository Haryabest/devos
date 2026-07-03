import type { ApiEndpoint } from '@/shared/types';
import type { Doc } from '@/shared/types';
import type { Project } from '@/shared/types';
import type { Task, TaskColumn } from '@/shared/types';
import { useTeamStore } from '@/stores/team-store';

export function getActiveSyncProjectIds(): string[] {
  const rooms = useTeamStore.getState().syncRooms;
  return rooms;
}

export function shouldScopeSync(): boolean {
  return useTeamStore.getState().syncRooms.length > 0;
}

export function scopeProjects(projects: Project[]): Project[] {
  const ids = new Set(getActiveSyncProjectIds());
  if (ids.size === 0) return projects;
  return projects.filter((p) => ids.has(p.id));
}

export function scopeTasksPayload(payload: { tasks: Task[]; columns: TaskColumn[] }) {
  const ids = new Set(getActiveSyncProjectIds());
  if (ids.size === 0) return payload;
  return {
    tasks: payload.tasks.filter((t) => ids.has(t.projectId)),
    columns: payload.columns.filter((c) => ids.has(c.projectId)),
  };
}

export function scopeDocs(docs: Doc[]): Doc[] {
  const ids = new Set(getActiveSyncProjectIds());
  if (ids.size === 0) return docs;
  return docs.filter((d) => ids.has(d.projectId));
}

export function scopeEndpoints(endpoints: ApiEndpoint[]): ApiEndpoint[] {
  const ids = new Set(getActiveSyncProjectIds());
  if (ids.size === 0) return endpoints;
  return endpoints.filter((e) => ids.has(e.projectId));
}

export function mergeProjects(existing: Project[], incoming: Project[]): Project[] {
  const ids = new Set(incoming.map((p) => p.id));
  return [...existing.filter((p) => !ids.has(p.id)), ...incoming];
}

export function mergeTasksPayload(
  existing: { tasks: Task[]; columns: TaskColumn[] },
  incoming: { tasks: Task[]; columns: TaskColumn[] },
) {
  const ids = new Set([
    ...incoming.tasks.map((t) => t.projectId),
    ...incoming.columns.map((c) => c.projectId),
  ]);
  return {
    tasks: [...existing.tasks.filter((t) => !ids.has(t.projectId)), ...incoming.tasks],
    columns: [...existing.columns.filter((c) => !ids.has(c.projectId)), ...incoming.columns],
  };
}

export function mergeDocs(existing: Doc[], incoming: Doc[]): Doc[] {
  const ids = new Set(incoming.map((d) => d.id));
  const projectIds = new Set(incoming.map((d) => d.projectId));
  return [
    ...existing.filter((d) => !ids.has(d.id) && !projectIds.has(d.projectId)),
    ...incoming,
  ];
}

export function mergeEndpoints(existing: ApiEndpoint[], incoming: ApiEndpoint[]): ApiEndpoint[] {
  const projectIds = new Set(incoming.map((e) => e.projectId));
  return [
    ...existing.filter((e) => !projectIds.has(e.projectId)),
    ...incoming,
  ];
}
