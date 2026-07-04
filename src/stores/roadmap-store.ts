import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createScopedPersistStorage } from '@/lib/scoped-storage';
import type { RoadmapCard, RoadmapColumn } from '@/shared/types';
import { useSaveStore } from '@/stores/save-store';
import { COLUMN_COLORS, createUid } from '@/stores/tasks/constants';
import {
  isServerSyncEnabled,
  persistRoadmapCardCreate,
  persistRoadmapCardRemove,
  persistRoadmapCardUpdate,
  type ApiMilestone,
} from '@/lib/server-persist';

const DEFAULT_ROADMAP_COLUMNS = [
  { name: 'Planned', color: COLUMN_COLORS[0]! },
  { name: 'In Progress', color: COLUMN_COLORS[2]! },
  { name: 'Done', color: COLUMN_COLORS[4]! },
];

interface RoadmapState {
  columns: RoadmapColumn[];
  cards: RoadmapCard[];
  seedProject: (projectId: string) => void;
  addColumn: (projectId: string, name: string) => RoadmapColumn;
  removeColumn: (id: string) => void;
  addCard: (input: { projectId: string; columnId: string; title: string; description?: string }) => RoadmapCard;
  updateCard: (id: string, patch: Partial<RoadmapCard>) => void;
  removeCard: (id: string) => void;
  moveCard: (id: string, columnId: string, newIndex: number) => void;
  removeByProject: (projectId: string) => void;
  setFromServer: (projectId: string, milestones: ApiMilestone[]) => void;
}

function doneColumnId(columns: RoadmapColumn[], projectId: string) {
  return (
    columns.find((c) => c.projectId === projectId && c.name === 'Done')?.id ??
    columns.find((c) => c.projectId === projectId)?.id ??
    ''
  );
}

function plannedColumnId(columns: RoadmapColumn[], projectId: string) {
  return (
    columns.find((c) => c.projectId === projectId && c.name === 'Planned')?.id ??
    columns.find((c) => c.projectId === projectId)?.id ??
    ''
  );
}

export const useRoadmapStore = create<RoadmapState>()(
  persist(
    (set, get) => ({
      columns: [],
      cards: [],

      seedProject: (projectId) => {
        if (get().columns.some((c) => c.projectId === projectId)) return;
        const cols = DEFAULT_ROADMAP_COLUMNS.map((c, i) => ({
          id: createUid(),
          projectId,
          name: c.name,
          color: c.color,
          order: i,
        }));
        set((s) => ({ columns: [...s.columns, ...cols] }));
        useSaveStore.getState().markSaved();
      },

      addColumn: (projectId, name) => {
        const order =
          get()
            .columns.filter((c) => c.projectId === projectId)
            .reduce((max, c) => Math.max(max, c.order), -1) + 1;
        const col: RoadmapColumn = {
          id: createUid(),
          projectId,
          name: name.trim() || 'Новая колонка',
          color: COLUMN_COLORS[get().columns.length % COLUMN_COLORS.length]!,
          order,
        };
        set((s) => ({ columns: [...s.columns, col] }));
        useSaveStore.getState().markSaved();
        return col;
      },

      removeColumn: (id) => {
        set((s) => ({
          columns: s.columns.filter((c) => c.id !== id),
          cards: s.cards.filter((c) => c.columnId !== id),
        }));
        useSaveStore.getState().markSaved();
      },

      addCard: (input) => {
        const inCol = get().cards.filter((c) => c.columnId === input.columnId);
        const order = inCol.reduce((max, c) => Math.max(max, c.order), -1) + 1;
        const card: RoadmapCard = {
          id: createUid(),
          projectId: input.projectId,
          columnId: input.columnId,
          title: input.title.trim(),
          description: input.description?.trim() ?? '',
          order,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ cards: [...s.cards, card] }));
        useSaveStore.getState().markSaved();
        if (isServerSyncEnabled()) {
          void persistRoadmapCardCreate(input.projectId, card)
            .then((saved) => {
              if (saved && saved.id !== card.id) {
                useRoadmapStore.setState((s) => ({
                  cards: s.cards.map((c) => (c.id === card.id ? { ...c, id: saved.id } : c)),
                }));
              }
            })
            .catch(() => undefined);
        }
        return card;
      },

      updateCard: (id, patch) => {
        set((s) => ({
          cards: s.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        }));
        useSaveStore.getState().markSaved();
        if (isServerSyncEnabled()) {
          const prev = get().cards.find((c) => c.id === id);
          if (!prev) return;
          const next = { ...prev, ...patch };
          const doneId = doneColumnId(get().columns, next.projectId);
          void persistRoadmapCardUpdate(next, next.columnId === doneId).catch(() => undefined);
        }
      },

      removeCard: (id) => {
        const card = get().cards.find((c) => c.id === id);
        set((s) => ({ cards: s.cards.filter((c) => c.id !== id) }));
        useSaveStore.getState().markSaved();
        if (isServerSyncEnabled() && card) {
          void persistRoadmapCardRemove(card.projectId, id).catch(() => undefined);
        }
      },

      moveCard: (id, columnId, newIndex) => {
        set((s) => {
          const target = s.cards.find((c) => c.id === id);
          if (!target) return {};
          const others = s.cards
            .filter((c) => c.columnId === columnId && c.id !== id)
            .sort((a, b) => a.order - b.order);
          const next = [...others];
          next.splice(Math.min(newIndex, next.length), 0, { ...target, columnId });
          const reindexed = next.map((c, i) => ({ ...c, order: i }));
          const map = new Map(reindexed.map((c) => [c.id, c]));
          return {
            cards: s.cards.map((c) => (map.get(c.id) ? (map.get(c.id) as RoadmapCard) : c)),
          };
        });
        useSaveStore.getState().markSaved();
        if (isServerSyncEnabled()) {
          const card = get().cards.find((c) => c.id === id);
          if (!card) return;
          const doneId = doneColumnId(get().columns, card.projectId);
          void persistRoadmapCardUpdate(card, card.columnId === doneId).catch(() => undefined);
        }
      },

      removeByProject: (projectId) => {
        set((s) => ({
          columns: s.columns.filter((c) => c.projectId !== projectId),
          cards: s.cards.filter((c) => c.projectId !== projectId),
        }));
      },

      setFromServer: (projectId, milestones) => {
        get().seedProject(projectId);
        const cols = get().columns.filter((c) => c.projectId === projectId);
        const plannedId = plannedColumnId(cols, projectId);
        const doneId = doneColumnId(cols, projectId);
        const cards: RoadmapCard[] = milestones.map((m, i) => ({
          id: m.id,
          projectId,
          columnId: m.releasedAt ? doneId : plannedId,
          title: m.name,
          description: m.version ?? '',
          order: i,
          createdAt: m.dueAt ?? m.releasedAt ?? new Date().toISOString(),
        }));
        set((s) => ({
          columns: [...s.columns.filter((c) => c.projectId !== projectId), ...cols],
          cards: [...s.cards.filter((c) => c.projectId !== projectId), ...cards],
        }));
        useSaveStore.getState().markSaved();
      },
    }),
    {
      name: 'devos:roadmap',
      skipHydration: true,
      storage: createJSONStorage(() => createScopedPersistStorage('devos:roadmap')),
      version: 1,
    },
  ),
);
