import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createScopedPersistStorage } from '@/lib/scoped-storage';
import type { Project, ProjectLinks, ProjectStatus, ProjectType } from '@/shared/types';
import { useSaveStore } from '@/stores/save-store';
import { useTasksStore } from '@/stores/tasks-store';
import { useDocsStore } from '@/stores/docs-store';
import { useApiStore } from '@/stores/api-store';
import { useRoadmapStore } from '@/stores/roadmap-store';

/**
 * Локальный стор проектов — работает без backend (данные в localStorage).
 * В гостевом/офлайн-режиме это единственный источник правды.
 * Когда появится backend-модуль projects — синхронизацию вешаем сверху.
 */

export interface NewProject {
  name: string;
  description?: string;
  type?: ProjectType;
  links?: ProjectLinks;
  groupId?: string | null;
  clientId?: string | null;
  startAt?: string | null;
  dueAt?: string | null;
}

function cleanLinks(links?: ProjectLinks): ProjectLinks {
  if (!links) return {};
  const out: ProjectLinks = {};
  (Object.keys(links) as (keyof ProjectLinks)[]).forEach((k) => {
    const v = links[k]?.trim();
    if (v) out[k] = v;
  });
  return out;
}

interface ProjectsState {
  projects: Project[];
  add: (input: NewProject) => Project;
  update: (id: string, patch: Partial<Project>) => void;
  remove: (id: string) => void;
  getById: (id: string) => Project | undefined;
  setFromServer: (projects: Project[]) => void;
}

function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export const useProjectsStore = create<ProjectsState>()(
  persist(
    (set, get) => ({
      projects: [],
      add: (input) => {
        const project: Project = {
          id: uid(),
          name: input.name.trim(),
          description: input.description?.trim() ?? '',
          type: input.type ?? 'WEB',
          status: 'ACTIVE',
          health: 'GREEN',
          links: cleanLinks(input.links),
          groupId: input.groupId ?? null,
          clientId: input.clientId ?? null,
          startAt: input.startAt ?? null,
          dueAt: input.dueAt ?? null,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ projects: [project, ...s.projects] }));
        useSaveStore.getState().markSaved();
        return project;
      },
      update: (id, patch) => {
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        }));
        useSaveStore.getState().markSaved();
      },
      remove: (id) => {
        set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
        useTasksStore.getState().removeByProject(id);
        useDocsStore.getState().removeByProject(id);
        useApiStore.getState().removeByProject(id);
        useRoadmapStore.getState().removeByProject(id);
        useSaveStore.getState().markSaved();
      },
      getById: (id) => get().projects.find((p) => p.id === id),
      setFromServer: (projects) => {
        set({ projects });
        useSaveStore.getState().markSaved();
      },
    }),
    {
      name: 'devos:projects',
      skipHydration: true,
      storage: createJSONStorage(() => createScopedPersistStorage('devos:projects')),
      version: 4,
      migrate: (state) => {
        const s = state as ProjectsState | undefined;
        if (s?.projects) {
          s.projects = s.projects.map((p) => ({
            ...p,
            links: p.links ?? {},
            groupId: p.groupId ?? null,
            clientId: (p as Project & { clientId?: string | null }).clientId ?? null,
            startAt: (p as Project & { startAt?: string | null }).startAt ?? null,
            dueAt: (p as Project & { dueAt?: string | null }).dueAt ?? null,
          }));
        }
        return s as ProjectsState;
      },
    },
  ),
);

export const PROJECT_TYPES: ProjectType[] = ['SAAS', 'WEB', 'MOBILE', 'DESKTOP', 'API', 'GAME', 'OTHER'];
export const PROJECT_STATUSES: ProjectStatus[] = ['ACTIVE', 'PAUSED', 'DONE', 'ARCHIVED'];

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  ACTIVE: 'Активен',
  PAUSED: 'На паузе',
  DONE: 'Завершён',
  ARCHIVED: 'Архив',
};

/** Цветовой индикатор статуса проекта (точка/бейдж). */
export const STATUS_COLOR: Record<ProjectStatus, string> = {
  ACTIVE: '#22c55e', // green
  PAUSED: '#f59e0b', // amber
  DONE: '#3b82f6', // blue
  ARCHIVED: '#64748b', // slate
};

export const HEALTH_LABEL: Record<Project['health'], string> = {
  GREEN: 'В норме',
  YELLOW: 'Риски',
  RED: 'Проблемы',
};

export const HEALTH_COLOR: Record<Project['health'], string> = {
  GREEN: '#22c55e',
  YELLOW: '#eab308',
  RED: '#ef4444',
};
