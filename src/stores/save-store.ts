import { create } from 'zustand';

/**
 * Глобальный индикатор сохранения для titlebar.
 * Любой стор (docs, tasks, api…) вызывает markPending → markSaving → markSaved.
 */

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved';

interface SaveState {
  status: SaveStatus;
  lastSavedAt: string | null;
  /** Есть несохранённые изменения (debounce ещё не отработал). */
  markPending: () => void;
  markSaving: () => void;
  markSaved: () => void;
}

export const useSaveStore = create<SaveState>((set) => ({
  status: 'idle',
  lastSavedAt: null,
  markPending: () => set({ status: 'pending' }),
  markSaving: () => set({ status: 'saving' }),
  markSaved: () =>
    set({ status: 'saved', lastSavedAt: new Date().toISOString() }),
}));
