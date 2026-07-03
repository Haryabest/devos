import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { Project } from '@/shared/types';

export const projectKeys = {
  all: ['projects'] as const,
  list: () => [...projectKeys.all, 'list'] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
};

async function fetchProjects(): Promise<Project[]> {
  try {
    return await api<Project[]>('/projects', { auth: true });
  } catch {
    return [];
  }
}

/** Серверный список проектов; локальный Zustand остаётся для offline/sync. */
export function useProjectsQuery(enabled = true) {
  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: fetchProjects,
    enabled,
    staleTime: 30_000,
  });
}
