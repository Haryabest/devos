import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Attachment, Task } from '@/shared/types';
import { useSaveStore } from '@/stores/save-store';
import { getAutosaveDelayMs } from '@/stores/settings-store';
import {
  COLUMN_COLORS,
  createUid,
  migrateTasksState,
  type NewAttachment,
  type NewColumn,
  type NewTask,
} from '@/stores/tasks/constants';

interface TasksState {
  columns: import('@/shared/types').TaskColumn[];
  tasks: Task[];

  addColumn: (input: NewColumn) => import('@/shared/types').TaskColumn;
  renameColumn: (id: string, name: string) => void;
  recolorColumn: (id: string, color: string) => void;
  removeColumn: (id: string) => void;
  reorderColumns: (ids: string[]) => void;

  add: (input: NewTask) => Task;
  update: (id: string, patch: Partial<Task>) => void;
  scheduleUpdate: (id: string, patch: Partial<Task>) => void;
  flushTaskSave: () => void;
  remove: (id: string) => void;
  removeByProject: (projectId: string) => void;
  moveTask: (id: string, columnId: string, newIndex: number) => void;
  reorderTasks: (columnId: string, ids: string[]) => void;

  addAttachment: (taskId: string, input: NewAttachment) => void;
  removeAttachment: (taskId: string, attachmentId: string) => void;
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
          order,
          attachments: [],
          done: false,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ tasks: [...s.tasks, task] }));
        markSaved();
        return task;
      },
      update: (id, patch) => {
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
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
            set((s) => ({
              tasks: s.tasks.map((t) =>
                t.id === pendingTaskId ? { ...t, ...pendingTaskPatch } : t,
              ),
            }));
            markSaved();
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
          set((s) => ({
            tasks: s.tasks.map((t) =>
              t.id === pendingTaskId ? { ...t, ...pendingTaskPatch } : t,
            ),
          }));
          pendingTaskId = null;
          pendingTaskPatch = {};
          markSaved();
        }
      },
      remove: (id) => {
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== id && t.parentId !== id),
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
          const parentId = target.parentId;
          const others = s.tasks
            .filter((t) => t.columnId === columnId && t.parentId === parentId && t.id !== id)
            .sort((a, b) => a.order - b.order);
          const newOthers = [...others];
          newOthers.splice(Math.min(newIndex, newOthers.length), 0, { ...target, columnId });
          const reindexed = newOthers.map((t, i) => ({ ...t, order: i }));
          const map = new Map(reindexed.map((t) => [t.id, t]));
          return {
            tasks: s.tasks.map((t) => (map.get(t.id) ? (map.get(t.id) as Task) : t)),
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
        const att: Attachment = {
          id: createUid(),
          kind: input.kind,
          label: input.label.trim() || input.value.slice(0, 60),
          value: input.value,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, attachments: [...t.attachments, att] } : t,
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
    }),
    {
      name: 'devos:tasks',
      version: 2,
      migrate: migrateTasksState,
    },
  ),
);
