import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createScopedPersistStorage } from '@/lib/scoped-storage';
import type { WhiteboardData } from '@/shared/types/whiteboard';
import { normalizeBoard } from '@/shared/types/whiteboard';

export interface WhiteboardVersion {
  id: string;
  projectId: string;
  label: string;
  snapshot: WhiteboardData;
  createdAt: string;
}

interface WhiteboardVersionsState {
  versions: WhiteboardVersion[];
  saveVersion: (projectId: string, board: WhiteboardData, label?: string) => WhiteboardVersion;
  restoreVersion: (versionId: string) => WhiteboardData | null;
  removeVersion: (versionId: string) => void;
  listForProject: (projectId: string) => WhiteboardVersion[];
}

function uid() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export const useWhiteboardVersionsStore = create<WhiteboardVersionsState>()(
  persist(
    (set, get) => ({
      versions: [],
      saveVersion: (projectId, board, label) => {
        const v: WhiteboardVersion = {
          id: uid(),
          projectId,
          label: label?.trim() || `v${get().listForProject(projectId).length + 1}`,
          snapshot: normalizeBoard(board),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ versions: [v, ...s.versions].slice(0, 100) }));
        return v;
      },
      restoreVersion: (versionId) => {
        const v = get().versions.find((x) => x.id === versionId);
        return v ? normalizeBoard(v.snapshot) : null;
      },
      removeVersion: (id) => set((s) => ({ versions: s.versions.filter((v) => v.id !== id) })),
      listForProject: (projectId) =>
        get().versions.filter((v) => v.projectId === projectId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    }),
    {
      name: 'devos:whiteboard-versions',
      skipHydration: true,
      storage: createJSONStorage(() => createScopedPersistStorage('devos:whiteboard-versions')),
      version: 1,
    },
  ),
);
