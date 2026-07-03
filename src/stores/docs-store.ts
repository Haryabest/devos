import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Attachment, AttachmentKind, Doc, DocFolder, DocRevision } from '@/shared/types';
import { detectDocFormat, docTitleFromFileName } from '@/lib/doc-formats';
import { createScopedIdbStorage } from '@/lib/idb-scoped-storage';
import {
  formatDocFileLimitMessage,
  formatStorageLimitMessage,
  isDataUrlTooLarge,
  isDocFileTooLarge,
} from '@/lib/storage-limits';
import { useSaveStore } from '@/stores/save-store';
import { getAutosaveDelayMs } from '@/stores/settings-store';
import {
  isServerSyncEnabled,
  persistDocCreate,
  persistDocUpdate,
  persistDocRemove,
  persistFolderCreate,
  persistFolderUpdate,
  persistFolderRemove,
} from '@/lib/server-persist';

export const AUTOSAVE_DELAY = 3000;

export interface NewAttachment {
  kind: AttachmentKind;
  label: string;
  value: string;
}

interface DocsState {
  docs: Doc[];
  folders: DocFolder[];
  create: (projectId: string, title?: string, folderId?: string | null) => Doc;
  createFromFile: (projectId: string, file: File, folderId?: string | null) => Promise<Doc | null>;
  update: (id: string, patch: Partial<Pick<Doc, 'title' | 'content'>>, summary?: string) => void;
  scheduleSave: (id: string, patch: Partial<Pick<Doc, 'title' | 'content'>>, summary?: string) => void;
  flushSave: () => void;
  restoreVersion: (docId: string, revisionId: string) => void;
  setTags: (docId: string, tags: string[]) => void;
  addTag: (docId: string, tag: string) => void;
  removeTag: (docId: string, tag: string) => void;
  createFolder: (projectId: string, name: string, parentId?: string | null) => DocFolder;
  renameFolder: (id: string, name: string) => void;
  removeFolder: (id: string) => void;
  moveDoc: (docId: string, folderId: string | null) => void;
  moveFolder: (folderId: string, parentId: string | null) => void;
  addAttachment: (docId: string, input: NewAttachment) => void;
  removeAttachment: (docId: string, attachmentId: string) => void;
  remove: (id: string) => void;
  removeByProject: (projectId: string) => void;
  setFromServer: (docs: Doc[], folders: DocFolder[]) => void;
}

function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.readAsDataURL(file);
  });
}

function snapshotRevision(doc: Doc, summary?: string): DocRevision {
  return {
    id: uid(),
    version: doc.version,
    title: doc.title,
    content: doc.content,
    createdAt: new Date().toISOString(),
    summary,
  };
}

function applyRevision(doc: Doc, patch: Partial<Pick<Doc, 'title' | 'content'>>, summary?: string): Doc {
  const hasContentChange = patch.content !== undefined && patch.content !== doc.content;
  const hasTitleChange = patch.title !== undefined && patch.title !== doc.title;
  if (!hasContentChange && !hasTitleChange) {
    return { ...doc, ...patch, updatedAt: new Date().toISOString() };
  }

  const history = [snapshotRevision(doc, summary), ...doc.history].slice(0, 50);
  return {
    ...doc,
    ...patch,
    version: doc.version + 1,
    history,
    updatedAt: new Date().toISOString(),
  };
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingId: string | null = null;
let pendingPatch: Partial<Pick<Doc, 'title' | 'content'>> = {};
let pendingSummary: string | undefined;

function collectFolderDescendants(folderId: string, folders: DocFolder[]): Set<string> {
  const ids = new Set<string>([folderId]);
  let added = true;
  while (added) {
    added = false;
    for (const f of folders) {
      if (f.parentId && ids.has(f.parentId) && !ids.has(f.id)) {
        ids.add(f.id);
        added = true;
      }
    }
  }
  return ids;
}

function syncDocById(get: () => DocsState, id: string) {
  if (!isServerSyncEnabled()) return;
  const doc = get().docs.find((d) => d.id === id);
  if (doc) void persistDocUpdate(doc).catch(() => undefined);
}

function syncFolderById(get: () => DocsState, id: string) {
  if (!isServerSyncEnabled()) return;
  const folder = get().folders.find((f) => f.id === id);
  if (folder) void persistFolderUpdate(folder).catch(() => undefined);
}

export const useDocsStore = create<DocsState>()(
  persist(
    (set, get) => ({
      docs: [],
      folders: [],

      create: (projectId, title = 'Без названия', folderId = null) => {
        const now = new Date().toISOString();
        const doc: Doc = {
          id: uid(),
          projectId,
          folderId,
          title,
          format: 'page',
          content: '',
          fileData: null,
          fileName: null,
          mimeType: null,
          tags: [],
          version: 1,
          history: [],
          attachments: [],
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ docs: [doc, ...s.docs] }));
        useSaveStore.getState().markSaved();
        if (isServerSyncEnabled()) {
          void persistDocCreate(doc)
            .then((saved) => {
              if (saved && saved.id !== doc.id) {
                useDocsStore.setState((s) => ({
                  docs: s.docs.map((d) => (d.id === doc.id ? saved : d)),
                }));
              }
            })
            .catch(() => undefined);
        }
        return doc;
      },

      createFromFile: async (projectId, file, folderId = null) => {
        const format = detectDocFormat(file);
        if (!format) {
          window.alert('Неподдерживаемый формат. Используйте PDF, DOCX, TXT, MD, CSV, XLSX или изображение.');
          return null;
        }
        if (isDocFileTooLarge(file.size)) {
          window.alert(formatDocFileLimitMessage());
          return null;
        }

        let fileData: string;
        try {
          fileData = await readFileAsDataUrl(file);
        } catch {
          window.alert('Не удалось загрузить файл.');
          return null;
        }

        const now = new Date().toISOString();
        const doc: Doc = {
          id: uid(),
          projectId,
          folderId,
          title: docTitleFromFileName(file.name),
          format,
          content: '',
          fileData,
          fileName: file.name,
          mimeType: file.type || null,
          tags: [],
          version: 1,
          history: [],
          attachments: [],
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ docs: [doc, ...s.docs] }));
        useSaveStore.getState().markSaved();
        if (isServerSyncEnabled()) {
          void persistDocCreate(doc)
            .then((saved) => {
              if (saved && saved.id !== doc.id) {
                useDocsStore.setState((s) => ({
                  docs: s.docs.map((d) => (d.id === doc.id ? saved : d)),
                }));
              }
            })
            .catch(() => undefined);
        }
        return doc;
      },

      update: (id, patch, summary) => {
        set((s) => ({
          docs: s.docs.map((d) => (d.id === id ? applyRevision(d, patch, summary) : d)),
        }));
        useSaveStore.getState().markSaved();
        syncDocById(get, id);
      },

      scheduleSave: (id, patch, summary) => {
        if (pendingId && pendingId !== id) {
          get().update(pendingId, pendingPatch, pendingSummary);
        }
        pendingId = id;
        pendingPatch = { ...pendingPatch, ...patch };
        pendingSummary = summary;
        useSaveStore.getState().markPending();
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
          useSaveStore.getState().markSaving();
          if (pendingId) {
            get().update(pendingId, pendingPatch, pendingSummary);
          }
          pendingId = null;
          pendingPatch = {};
          pendingSummary = undefined;
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
          get().update(pendingId, pendingPatch, pendingSummary);
          pendingId = null;
          pendingPatch = {};
          pendingSummary = undefined;
        }
      },

      restoreVersion: (docId, revisionId) => {
        set((s) => ({
          docs: s.docs.map((d) => {
            if (d.id !== docId) return d;
            const rev = d.history.find((h) => h.id === revisionId);
            if (!rev) return d;
            return applyRevision(
              d,
              { title: rev.title, content: rev.content },
              `Восстановлена версия ${rev.version}`,
            );
          }),
        }));
        useSaveStore.getState().markSaved();
        syncDocById(get, docId);
      },

      setTags: (docId, tags) => {
        set((s) => ({
          docs: s.docs.map((d) =>
            d.id === docId ? { ...d, tags: [...new Set(tags.map((t) => t.trim()).filter(Boolean))], updatedAt: new Date().toISOString() } : d,
          ),
        }));
        useSaveStore.getState().markSaved();
        syncDocById(get, docId);
      },

      addTag: (docId, tag) => {
        const t = tag.trim();
        if (!t) return;
        set((s) => ({
          docs: s.docs.map((d) =>
            d.id === docId && !d.tags.includes(t)
              ? { ...d, tags: [...d.tags, t], updatedAt: new Date().toISOString() }
              : d,
          ),
        }));
        useSaveStore.getState().markSaved();
        syncDocById(get, docId);
      },

      removeTag: (docId, tag) => {
        set((s) => ({
          docs: s.docs.map((d) =>
            d.id === docId
              ? { ...d, tags: d.tags.filter((t) => t !== tag), updatedAt: new Date().toISOString() }
              : d,
          ),
        }));
        useSaveStore.getState().markSaved();
        syncDocById(get, docId);
      },

      createFolder: (projectId, name, parentId = null) => {
        const folder: DocFolder = {
          id: uid(),
          projectId,
          parentId,
          name: name.trim() || 'Новая папка',
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ folders: [...s.folders, folder] }));
        useSaveStore.getState().markSaved();
        if (isServerSyncEnabled()) {
          void persistFolderCreate(folder)
            .then((saved) => {
              if (saved && saved.id !== folder.id) {
                useDocsStore.setState((s) => ({
                  folders: s.folders.map((f) => (f.id === folder.id ? saved : f)),
                }));
              }
            })
            .catch(() => undefined);
        }
        return folder;
      },

      renameFolder: (id, name) => {
        set((s) => ({
          folders: s.folders.map((f) => (f.id === id ? { ...f, name: name.trim() || f.name } : f)),
        }));
        useSaveStore.getState().markSaved();
        syncFolderById(get, id);
      },

      removeFolder: (id) => {
        const { folders, docs } = get();
        const toRemove = collectFolderDescendants(id, folders);
        set({
          folders: folders.filter((f) => !toRemove.has(f.id)),
          docs: docs.filter((d) => !d.folderId || !toRemove.has(d.folderId)),
        });
        useSaveStore.getState().markSaved();
        if (isServerSyncEnabled()) void persistFolderRemove(id).catch(() => undefined);
      },

      moveDoc: (docId, folderId) => {
        set((s) => ({
          docs: s.docs.map((d) =>
            d.id === docId ? { ...d, folderId, updatedAt: new Date().toISOString() } : d,
          ),
        }));
        useSaveStore.getState().markSaved();
        syncDocById(get, docId);
      },

      moveFolder: (folderId, parentId) => {
        if (folderId === parentId) return;
        const { folders } = get();
        if (parentId) {
          const descendants = collectFolderDescendants(folderId, folders);
          if (descendants.has(parentId)) return;
        }
        set((s) => ({
          folders: s.folders.map((f) => (f.id === folderId ? { ...f, parentId } : f)),
        }));
        useSaveStore.getState().markSaved();
        syncFolderById(get, folderId);
      },

      remove: (id) => {
        if (pendingId === id) {
          if (saveTimer) clearTimeout(saveTimer);
          saveTimer = null;
          pendingId = null;
          pendingPatch = {};
          pendingSummary = undefined;
        }
        set((s) => ({ docs: s.docs.filter((d) => d.id !== id) }));
        useSaveStore.getState().markSaved();
        if (isServerSyncEnabled()) void persistDocRemove(id).catch(() => undefined);
      },

      removeByProject: (projectId) => {
        if (pendingId) {
          const doc = get().docs.find((d) => d.id === pendingId);
          if (doc?.projectId === projectId) {
            if (saveTimer) clearTimeout(saveTimer);
            saveTimer = null;
            pendingId = null;
            pendingPatch = {};
            pendingSummary = undefined;
          }
        }
        set((s) => ({
          docs: s.docs.filter((d) => d.projectId !== projectId),
          folders: s.folders.filter((f) => f.projectId !== projectId),
        }));
        useSaveStore.getState().markSaved();
      },

      addAttachment: (docId, input) => {
        if (
          (input.kind === 'file' || input.kind === 'image') &&
          isDataUrlTooLarge(input.value)
        ) {
          window.alert(formatStorageLimitMessage());
          return;
        }
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
        syncDocById(get, docId);
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
        syncDocById(get, docId);
      },

      setFromServer: (docs, folders) => {
        set({ docs, folders });
        useSaveStore.getState().markSaved();
      },
    }),
    {
      name: 'devos:docs',
      skipHydration: true,
      version: 3,
      migrate: (state, fromVersion) => {
        const s = (state ?? {}) as unknown as { docs?: Doc[]; folders?: DocFolder[] };
        const now = new Date().toISOString();
        if (s.docs) {
          s.docs = s.docs.map((d) => ({
            ...d,
            folderId: d.folderId ?? null,
            format: d.format ?? 'page',
            fileData: d.fileData ?? null,
            fileName: d.fileName ?? null,
            mimeType: d.mimeType ?? null,
            tags: d.tags ?? [],
            version: d.version ?? 1,
            history: d.history ?? [],
            attachments: d.attachments ?? [],
            createdAt: d.createdAt ?? d.updatedAt ?? now,
          }));
        }
        if (!s.folders) s.folders = [];
        if (fromVersion < 3 && !s.folders) s.folders = [];
        return s as unknown as DocsState;
      },
      storage: createJSONStorage(() =>
        createScopedIdbStorage('devos:docs', {
          quotaMessage:
            'Недостаточно места в локальном хранилище. Удалите старые файлы в документации.',
        }),
      ),
    },
  ),
);
