import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Attachment, Task, TaskComment, TaskHistoryEntry } from '@/shared/types';
import { createScopedPersistStorage } from '@/lib/scoped-storage';
import { formatStorageLimitMessage, isDataUrlTooLarge } from '@/lib/storage-limits';
import { useAuthStore } from '@/stores/auth-store';
import { useSaveStore } from '@/stores/save-store';
import { getAutosaveDelayMs } from '@/stores/settings-store';
import {
  COLUMN_COLORS,
  createUid,
  migrateTasksState,
  statusFromColumn,
  type NewAttachment,
  type NewColumn,
  type NewTask,
} from '@/stores/tasks/constants';

function currentAuthor(): string {
  return useAuthStore.getState().user?.name ?? 'Система';
}

function historyEntry(field: string, oldValue: string, newValue: string): TaskHistoryEntry {
  return {
    id: createUid(),
    field,
    oldValue,
    newValue,
    author: currentAuthor(),
    createdAt: new Date().toISOString(),
  };
}

function appendHistory(task: Task, entries: TaskHistoryEntry[]): Task {
  if (entries.length === 0) return task;
  return { ...task, history: [...entries, ...task.history].slice(0, 100) };
}

interface TasksState {
  columns: import('@/shared/types').TaskColumn[];
  tasks: Task[];

  addColumn: (input: NewColumn) => import('@/shared/types').TaskColumn;
  renameColumn: (id: string, name: string) => void;
  recolorColumn: (id: string, color: string) => void;
  removeColumn: (id: string) => void;
  reorderColumns: (ids: string[]) => void;

  add: (input: NewTask) => Task;
  update: (id: string, patch: Partial<Task>, logHistory?: boolean) => void;
  scheduleUpdate: (id: string, patch: Partial<Task>) => void;
  flushTaskSave: () => void;
  remove: (id: string) => void;
  removeByProject: (projectId: string) => void;
  moveTask: (id: string, columnId: string, newIndex: number) => void;
  reorderTasks: (columnId: string, ids: string[]) => void;

  addAttachment: (taskId: string, input: NewAttachment) => void;
  removeAttachment: (taskId: string, attachmentId: string) => void;
  addComment: (taskId: string, text: string) => void;
  addDependency: (taskId: string, dependsOnId: string) => void;
  removeDependency: (taskId: string, dependsOnId: string) => void;
}

let taskSaveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingTaskId: string | null = null;
let pendingTaskPatch: Partial<Task> = {};

function markSaved() {
  useSaveStore.getState().markSaved();
}

export const useTasksStore = create<TasksState>()(
  persist(
    (set, get) => ({
      columns: [],
      tasks: [],

      addColumn: (input) => {
        const order =
          get()
            .columns.filter((c) => c.projectId === input.projectId)
            .reduce((max, c) => Math.max(max, c.order), -1) + 1;
        const col = {
          id: createUid(),
          projectId: input.projectId,
          name: input.name.trim() || 'Новая колонка',
          color: input.color ?? COLUMN_COLORS[get().columns.length % COLUMN_COLORS.length]!,
          order,
          statusKey: input.statusKey ?? 'TODO',
        };
        set((s) => ({ columns: [...s.columns, col] }));
        markSaved();
        return col;
      },
      renameColumn: (id, name) => {
        set((s) => ({
          columns: s.columns.map((c) => (c.id === id ? { ...c, name } : c)),
        }));
        markSaved();
      },
      recolorColumn: (id, color) => {
        set((s) => ({
          columns: s.columns.map((c) => (c.id === id ? { ...c, color } : c)),
        }));
        markSaved();
      },
      removeColumn: (id) => {
        set((s) => ({
          columns: s.columns.filter((c) => c.id !== id),
          tasks: s.tasks.filter((t) => t.columnId !== id),
        }));
        markSaved();
      },
      reorderColumns: (ids) => {
        set((s) => ({
          columns: s.columns.map((c) => {
            const idx = ids.indexOf(c.id);
            return idx === -1 ? c : { ...c, order: idx };
          }),
        }));
        markSaved();
      },

      add: (input) => {
        const col = get().columns.find((c) => c.id === input.columnId);
        const status = statusFromColumn(col);
        const tasksInCol = get().tasks.filter(
          (t) => t.columnId === input.columnId && t.parentId === (input.parentId ?? null),
        );
        const order = tasksInCol.reduce((max, t) => Math.max(max, t.order), -1) + 1;
        const task: Task = {
          id: createUid(),
          projectId: input.projectId,
          columnId: input.columnId,
          parentId: input.parentId ?? null,
          title: input.title.trim(),
          description: '',
          priority: input.priority ?? 'MEDIUM',
          status,
          order,
          attachments: [],
          done: status === 'DONE',
          startAt: null,
          dueAt: null,
          dependsOn: [],
          comments: [],
          history: [],
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ tasks: [...s.tasks, task] }));
        markSaved();
        return task;
      },
      update: (id, patch, logHistory = true) => {
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== id) return t;
            const entries: TaskHistoryEntry[] = [];
            if (logHistory) {
              (Object.keys(patch) as (keyof Task)[]).forEach((key) => {
                if (key === 'history' || key === 'comments' || key === 'attachments') return;
                const oldVal = String(t[key] ?? '');
                const newVal = String(patch[key] ?? '');
                if (oldVal !== newVal) entries.push(historyEntry(String(key), oldVal, newVal));
              });
            }
            let next = { ...t, ...patch };
            if (patch.columnId) {
              const col = s.columns.find((c) => c.id === patch.columnId);
              const status = statusFromColumn(col);
              next = { ...next, status, done: status === 'DONE' };
            }
            return appendHistory(next, entries);
          }),
        }));
        markSaved();
      },
      scheduleUpdate: (id, patch) => {
        if (pendingTaskId && pendingTaskId !== id) {
          get().update(pendingTaskId, pendingTaskPatch);
        }
        pendingTaskId = id;
        pendingTaskPatch = { ...pendingTaskPatch, ...patch };
        useSaveStore.getState().markPending();
        if (taskSaveTimer) clearTimeout(taskSaveTimer);
        taskSaveTimer = setTimeout(() => {
          useSaveStore.getState().markSaving();
          if (pendingTaskId) {
            get().update(pendingTaskId, pendingTaskPatch);
          }
          pendingTaskId = null;
          pendingTaskPatch = {};
          taskSaveTimer = null;
        }, getAutosaveDelayMs());
      },
      flushTaskSave: () => {
        if (taskSaveTimer) {
          clearTimeout(taskSaveTimer);
          taskSaveTimer = null;
        }
        if (pendingTaskId) {
          useSaveStore.getState().markSaving();
          get().update(pendingTaskId, pendingTaskPatch);
          pendingTaskId = null;
          pendingTaskPatch = {};
        }
      },
      remove: (id) => {
        set((s) => ({
          tasks: s.tasks
            .filter((t) => t.id !== id && t.parentId !== id)
            .map((t) => ({
              ...t,
              dependsOn: t.dependsOn.filter((d) => d !== id),
            })),
        }));
        markSaved();
      },
      removeByProject: (projectId) => {
        set((s) => ({
          tasks: s.tasks.filter((t) => t.projectId !== projectId),
          columns: s.columns.filter((c) => c.projectId !== projectId),
        }));
        markSaved();
      },
      moveTask: (id, columnId, newIndex) => {
        set((s) => {
          const target = s.tasks.find((t) => t.id === id);
          if (!target) return {};
          const col = s.columns.find((c) => c.id === columnId);
          const status = statusFromColumn(col);
          const parentId = target.parentId;
          const others = s.tasks
            .filter((t) => t.columnId === columnId && t.parentId === parentId && t.id !== id)
            .sort((a, b) => a.order - b.order);
          const newOthers = [...others];
          newOthers.splice(
            Math.min(newIndex, newOthers.length),
            0,
            { ...target, columnId, status, done: status === 'DONE' },
          );
          const reindexed = newOthers.map((t, i) => ({ ...t, order: i }));
          const map = new Map(reindexed.map((t) => [t.id, t]));
          return {
            tasks: s.tasks.map((t) => {
              if (map.get(t.id)) return map.get(t.id) as Task;
              if (t.id !== id) return t;
              return appendHistory(
                { ...t, columnId, status, done: status === 'DONE' },
                [historyEntry('columnId', target.columnId, columnId)],
              );
            }),
          };
        });
        markSaved();
      },
      reorderTasks: (columnId, ids) => {
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.columnId !== columnId) return t;
            const idx = ids.indexOf(t.id);
            return idx === -1 ? t : { ...t, order: idx };
          }),
        }));
        markSaved();
      },

      addAttachment: (taskId, input) => {
        if (
          (input.kind === 'file' || input.kind === 'image') &&
          isDataUrlTooLarge(input.value)
        ) {
          window.alert(formatStorageLimitMessage());
          return;
        }
        const att: Attachment = {
          id: createUid(),
          kind: input.kind,
          label: input.label.trim() || input.value.slice(0, 60),
          value: input.value,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? appendHistory(
                  { ...t, attachments: [...t.attachments, att] },
                  [historyEntry('attachment', '', att.label)],
                )
              : t,
          ),
        }));
        markSaved();
      },
      removeAttachment: (taskId, attachmentId) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, attachments: t.attachments.filter((a) => a.id !== attachmentId) }
              : t,
          ),
        }));
        markSaved();
      },
      addComment: (taskId, text) => {
        const comment: TaskComment = {
          id: createUid(),
          author: currentAuthor(),
          text: text.trim(),
          createdAt: new Date().toISOString(),
        };
        if (!comment.text) return;
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, comments: [...t.comments, comment] } : t,
          ),
        }));
        markSaved();
      },
      addDependency: (taskId, dependsOnId) => {
        if (taskId === dependsOnId) return;
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId && !t.dependsOn.includes(dependsOnId)
              ? appendHistory(
                  { ...t, dependsOn: [...t.dependsOn, dependsOnId] },
                  [historyEntry('dependsOn', '', dependsOnId)],
                )
              : t,
          ),
        }));
        markSaved();
      },
      removeDependency: (taskId, dependsOnId) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, dependsOn: t.dependsOn.filter((d) => d !== dependsOnId) }
              : t,
          ),
        }));
        markSaved();
      },
    }),
    {
      name: 'devos:tasks',
      skipHydration: true,
      version: 3,
      migrate: migrateTasksState,
      storage: createJSONStorage(() =>
        createScopedPersistStorage('devos:tasks', {
          quotaMessage:
            'Недостаточно места в локальном хранилище. Удалите старые вложения или большие файлы в задачах.',
        }),
      ),
    },
  ),
);
