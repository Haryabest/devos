import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createScopedPersistStorage } from '@/lib/scoped-storage';

export type AuditKind = 'project' | 'task' | 'doc' | 'client' | 'team' | 'whiteboard' | 'system';

export interface AuditEntry {
  id: string;
  kind: AuditKind;
  action: string;
  title: string;
  meta?: string;
  projectId?: string;
  at: string;
}

interface AuditState {
  entries: AuditEntry[];
  log: (entry: Omit<AuditEntry, 'id' | 'at'>) => void;
  recent: (limit?: number) => AuditEntry[];
}

function uid() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export const useAuditStore = create<AuditState>()(
  persist(
    (set, get) => ({
      entries: [],
      log: (entry) => {
        const next: AuditEntry = { ...entry, id: uid(), at: new Date().toISOString() };
        set((s) => ({ entries: [next, ...s.entries].slice(0, 200) }));
      },
      recent: (limit = 12) => get().entries.slice(0, limit),
    }),
    {
      name: 'devos:audit',
      skipHydration: true,
      storage: createJSONStorage(() => createScopedPersistStorage('devos:audit')),
      version: 1,
    },
  ),
);

export function auditLog(entry: Omit<AuditEntry, 'id' | 'at'>) {
  useAuditStore.getState().log(entry);
}
