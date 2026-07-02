import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createScopedPersistStorage } from '@/lib/scoped-storage';
import type { ProjectGroup } from '@/shared/types';
import { useSaveStore } from '@/stores/save-store';

interface GroupsState {
  groups: ProjectGroup[];
  add: (name: string, color?: string) => ProjectGroup;
  rename: (id: string, name: string) => void;
  recolor: (id: string, color: string) => void;
  remove: (id: string) => void;
}

function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export const GROUP_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#a855f7',
  '#ec4899',
  '#14b8a6',
  '#64748b',
];

export const useGroupsStore = create<GroupsState>()(
  persist(
    (set, get) => ({
      groups: [],

      add: (name, color) => {
        const order = get().groups.reduce((max, g) => Math.max(max, g.order), -1) + 1;
        const group: ProjectGroup = {
          id: uid(),
          name: name.trim() || 'Новая группа',
          color: color ?? GROUP_COLORS[get().groups.length % GROUP_COLORS.length],
          order,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ groups: [...s.groups, group] }));
        useSaveStore.getState().markSaved();
        return group;
      },

      rename: (id, name) => {
        set((s) => ({
          groups: s.groups.map((g) => (g.id === id ? { ...g, name: name.trim() || g.name } : g)),
        }));
        useSaveStore.getState().markSaved();
      },

      recolor: (id, color) => {
        set((s) => ({
          groups: s.groups.map((g) => (g.id === id ? { ...g, color } : g)),
        }));
        useSaveStore.getState().markSaved();
      },

      remove: (id) => {
        set((s) => ({ groups: s.groups.filter((g) => g.id !== id) }));
        useSaveStore.getState().markSaved();
      },
    }),
    {
      name: 'devos:groups',
      skipHydration: true,
      storage: createJSONStorage(() => createScopedPersistStorage('devos:groups')),
      version: 1,
    },
  ),
);
