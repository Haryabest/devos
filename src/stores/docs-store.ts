import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Attachment, AttachmentKind, Doc } from '@/shared/types';
import { useSaveStore } from '@/stores/save-store';
import { getAutosaveDelayMs } from '@/stores/settings-store';

/**
 * Локальный стор документации — страницы (Notion-like) привязаны к проекту.
 * Автосохранение с задержкой 3с неактивности. Статус сохранения — глобальный save-store.
 */

export const AUTOSAVE_DELAY = 3000;

export interface NewAttachment {
  kind: AttachmentKind;
  label: string;
  value: string;
}

interface DocsState {
  docs: Doc[];
  create: (projectId: string, title?: string) => Doc;
  update: (id: string, patch: Partial<Pick<Doc, 'title' | 'content'>>) => void;
  scheduleSave: (id: string, patch: Partial<Pick<Doc, 'title' | 'content'>>) => void;
  flushSave: () => void;
  addAttachment: (docId: string, input: NewAttachment) => void;
  removeAttachment: (docId: string, attachmentId: string) => void;
  remove: (id: string) => void;
  removeByProject: (projectId: string) => void;
}

function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingId: string | null = null;
let pendingPatch: Partial<Pick<Doc, 'title' | 'content'>> = {};

export const useDocsStore = create<DocsState>()(
  persist(
    (set, get) => ({
      docs: [],

      create: (projectId, title = 'Без названия') => {
        const doc: Doc = {
          id: uid(),
          projectId,
          title,
          content: '',
          attachments: [],
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ docs: [doc, ...s.docs] }));
        useSaveStore.getState().markSaved();
        return doc;
      },

      update: (id, patch) => {
        const updatedAt = new Date().toISOString();
        set((s) => ({
          docs: s.docs.map((d) => (d.id === id ? { ...d, ...patch, updatedAt } : d)),
        }));
        useSaveStore.getState().markSaved();
      },

      scheduleSave: (id, patch) => {
        if (pendingId && pendingId !== id) {
          get().update(pendingId, pendingPatch);
        }
        pendingId = id;
        pendingPatch = { ...pendingPatch, ...patch };
        // Только лёгкий флаг — без записи в docs (нет лага при печати).
        useSaveStore.getState().markPending();
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
          useSaveStore.getState().markSaving();
          if (pendingId) {
            get().update(pendingId, pendingPatch);
          }
          pendingId = null;
          pendingPatch = {};
          saveTimer = null;
        }, getAutosaveDelayMs());
      },

      flushSave: () => {
        if (saveTimer) {
          clearTimeout(saveTimer);
          saveTimer = null;
        }
        if (pendingId) {
          useSaveStore.getState().markSaving();
          get().update(pendingId, pendingPatch);
          pendingId = null;
          pendingPatch = {};
        }
      },

      remove: (id) => {
        if (pendingId === id) {
          if (saveTimer) clearTimeout(saveTimer);
          saveTimer = null;
          pendingId = null;
          pendingPatch = {};
        }
        set((s) => ({ docs: s.docs.filter((d) => d.id !== id) }));
        useSaveStore.getState().markSaved();
      },

      removeByProject: (projectId) => {
        if (pendingId) {
          const doc = get().docs.find((d) => d.id === pendingId);
          if (doc?.projectId === projectId) {
            if (saveTimer) clearTimeout(saveTimer);
            saveTimer = null;
            pendingId = null;
            pendingPatch = {};
          }
        }
        set((s) => ({ docs: s.docs.filter((d) => d.projectId !== projectId) }));
        useSaveStore.getState().markSaved();
      },

      addAttachment: (docId, input) => {
        const att: Attachment = {
          id: uid(),
          kind: input.kind,
          label: input.label.trim() || input.value.slice(0, 60),
          value: input.value,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          docs: s.docs.map((d) =>
            d.id === docId ? { ...d, attachments: [...d.attachments, att] } : d,
          ),
        }));
        useSaveStore.getState().markSaved();
      },

      removeAttachment: (docId, attachmentId) => {
        set((s) => ({
          docs: s.docs.map((d) =>
            d.id === docId
              ? { ...d, attachments: d.attachments.filter((a) => a.id !== attachmentId) }
              : d,
          ),
        }));
        useSaveStore.getState().markSaved();
      },
    }),
    {
      name: 'devos:docs',
      version: 2,
      migrate: (state) => {
        const s = (state ?? {}) as unknown as { docs?: Doc[] };
        if (s.docs) {
          s.docs = s.docs.map((d) => ({ ...d, attachments: d.attachments ?? [] }));
        }
        return s as unknown as DocsState;
      },
    },
  ),
);
