import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createScopedPersistStorage } from '@/lib/scoped-storage';
import type { ApiEndpoint, HttpMethod } from '@/shared/types';
import { useSaveStore } from '@/stores/save-store';

/**
 * Локальный стор API-эндпоинтов проекта. Тестирование выполняется в рантайме
 * (fetch), сюда сохраняется только описание запроса.
 */

export interface NewEndpoint {
  projectId: string;
  name?: string;
  method?: HttpMethod;
  url: string;
}

interface ApiState {
  endpoints: ApiEndpoint[];
  add: (input: NewEndpoint) => ApiEndpoint;
  update: (id: string, patch: Partial<ApiEndpoint>) => void;
  remove: (id: string) => void;
  removeByProject: (projectId: string) => void;
}

function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export const useApiStore = create<ApiState>()(
  persist(
    (set) => ({
      endpoints: [],
      add: (input) => {
        const ep: ApiEndpoint = {
          id: uid(),
          projectId: input.projectId,
          name: input.name?.trim() || 'Новый запрос',
          method: input.method ?? 'GET',
          url: input.url.trim(),
          headers: '',
          body: '',
        };
        set((s) => ({ endpoints: [ep, ...s.endpoints] }));
        useSaveStore.getState().markSaved();
        return ep;
      },
      update: (id, patch) => {
        set((s) => ({
          endpoints: s.endpoints.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        }));
        useSaveStore.getState().markSaved();
      },
      remove: (id) => {
        set((s) => ({ endpoints: s.endpoints.filter((e) => e.id !== id) }));
        useSaveStore.getState().markSaved();
      },
      removeByProject: (projectId) => {
        set((s) => ({ endpoints: s.endpoints.filter((e) => e.projectId !== projectId) }));
        useSaveStore.getState().markSaved();
      },
    }),
    {
      name: 'devos:api',
      skipHydration: true,
      storage: createJSONStorage(() => createScopedPersistStorage('devos:api')),
    },
  ),
);

export const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export const METHOD_COLOR: Record<HttpMethod, string> = {
  GET: 'text-emerald-500',
  POST: 'text-sky-500',
  PUT: 'text-amber-500',
  PATCH: 'text-violet-500',
  DELETE: 'text-red-500',
};
