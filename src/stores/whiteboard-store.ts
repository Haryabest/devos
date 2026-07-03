import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createScopedIdbStorage } from '@/lib/idb-scoped-storage';
import { persistWhiteboardDebounced } from '@/lib/server-persist';
import {
  buildTemplate,
  type WhiteboardTemplateId,
} from '@/features/whiteboard/lib/whiteboard-templates';
import type {
  WhiteboardConnector,
  WhiteboardData,
  WhiteboardGroup,
  WhiteboardNote,
  WhiteboardShape,
  WhiteboardStroke,
  WhiteboardViewport,
} from '@/shared/types/whiteboard';
import { emptyBoard, normalizeBoard } from '@/shared/types/whiteboard';
import { pickNoteColor, pickShapeColor } from '@/features/whiteboard/lib/whiteboard-canvas-utils';
import { useSaveStore } from '@/stores/save-store';
import { createUid } from '@/stores/tasks/constants';

const MAX_HISTORY = 50;
const historyPast = new Map<string, WhiteboardData[]>();
const historyFuture = new Map<string, WhiteboardData[]>();

function cloneBoard(board: WhiteboardData): WhiteboardData {
  return structuredClone(board);
}

function recordHistory(projectId: string, before: WhiteboardData) {
  const stack = historyPast.get(projectId) ?? [];
  stack.push(cloneBoard(before));
  if (stack.length > MAX_HISTORY) stack.shift();
  historyPast.set(projectId, stack);
  historyFuture.set(projectId, []);
}

interface WhiteboardState {
  boards: WhiteboardData[];
  getBoard: (projectId: string) => WhiteboardData;
  canUndo: (projectId: string) => boolean;
  canRedo: (projectId: string) => boolean;
  undo: (projectId: string) => void;
  redo: (projectId: string) => void;
  replaceBoard: (board: WhiteboardData) => void;
  mergeRemoteBoards: (incoming: WhiteboardData[]) => void;
  setFromServer: (boards: WhiteboardData[]) => void;
  applyTemplate: (projectId: string, templateId: WhiteboardTemplateId) => void;
  createGroup: (projectId: string, elementIds: string[], name?: string) => WhiteboardGroup | null;
  addStroke: (projectId: string, stroke: Omit<WhiteboardStroke, 'id'>) => void;
  addNote: (projectId: string, x: number, y: number, text?: string) => WhiteboardNote;
  addShape: (projectId: string, shape: Omit<WhiteboardShape, 'id'>) => WhiteboardShape;
  updateNote: (projectId: string, noteId: string, patch: Partial<WhiteboardNote>) => void;
  updateShape: (projectId: string, shapeId: string, patch: Partial<WhiteboardShape>) => void;
  removeNote: (projectId: string, noteId: string) => void;
  removeShape: (projectId: string, shapeId: string) => void;
  addConnector: (projectId: string, fromId: string, toId: string) => WhiteboardConnector | null;
  removeConnector: (projectId: string, connectorId: string) => void;
  removeLastStroke: (projectId: string) => void;
  clearStrokes: (projectId: string) => void;
  setViewport: (projectId: string, viewport: Partial<WhiteboardViewport>) => void;
  removeByProject: (projectId: string) => void;
}

function markSaved() {
  useSaveStore.getState().markSaved();
}

function upsertBoard(
  boards: WhiteboardData[],
  projectId: string,
  updater: (board: WhiteboardData) => WhiteboardData,
): WhiteboardData[] {
  const existing = boards.find((b) => b.projectId === projectId);
  if (existing) {
    return boards.map((b) => (b.projectId === projectId ? updater(b) : b));
  }
  return [...boards, updater(emptyBoard(projectId))];
}

function touch(board: WhiteboardData) {
  markSaved();
  persistWhiteboardDebounced(board);
}

export const useWhiteboardStore = create<WhiteboardState>()(
  persist(
    (set, get) => ({
      boards: [],

      getBoard: (projectId) => {
        return get().boards.find((b) => b.projectId === projectId) ?? emptyBoard(projectId);
      },

      canUndo: (projectId) => (historyPast.get(projectId)?.length ?? 0) > 0,
      canRedo: (projectId) => (historyFuture.get(projectId)?.length ?? 0) > 0,

      undo: (projectId) => {
        const stack = historyPast.get(projectId);
        if (!stack?.length) return;
        const current = get().getBoard(projectId);
        const prev = stack.pop()!;
        historyPast.set(projectId, stack);
        const fut = historyFuture.get(projectId) ?? [];
        fut.push(cloneBoard(current));
        historyFuture.set(projectId, fut);
        set((s) => ({
          boards: upsertBoard(s.boards, projectId, () => prev),
        }));
        touch(prev);
      },

      redo: (projectId) => {
        const stack = historyFuture.get(projectId);
        if (!stack?.length) return;
        const current = get().getBoard(projectId);
        const next = stack.pop()!;
        historyFuture.set(projectId, stack);
        const past = historyPast.get(projectId) ?? [];
        past.push(cloneBoard(current));
        historyPast.set(projectId, past);
        set((s) => ({
          boards: upsertBoard(s.boards, projectId, () => next),
        }));
        touch(next);
      },

      replaceBoard: (board) => {
        const normalized = normalizeBoard(board);
        set((s) => ({
          boards: upsertBoard(s.boards, board.projectId, () => normalized),
        }));
        touch(normalized);
      },

      mergeRemoteBoards: (incoming) => {
        if (incoming.length === 0) return;
        set((s) => {
          const map = new Map(s.boards.map((b) => [b.projectId, b]));
          for (const board of incoming) {
            map.set(board.projectId, normalizeBoard(board));
          }
          return { boards: [...map.values()] };
        });
      },

      setFromServer: (boards) => {
        set({ boards: boards.map((b) => normalizeBoard(b)) });
      },

      applyTemplate: (projectId, templateId) => {
        const before = get().getBoard(projectId);
        recordHistory(projectId, before);
        const tpl = buildTemplate(projectId, templateId);
        const merged = normalizeBoard({
          ...before,
          notes: [...before.notes, ...(tpl.notes ?? [])],
          shapes: [...before.shapes, ...(tpl.shapes ?? [])],
          connectors: [...before.connectors, ...(tpl.connectors ?? [])],
        });
        set((s) => ({
          boards: upsertBoard(s.boards, projectId, () => merged),
        }));
        touch(merged);
      },

      createGroup: (projectId, elementIds, name) => {
        if (elementIds.length < 2) return null;
        const before = get().getBoard(projectId);
        recordHistory(projectId, before);
        const group: WhiteboardGroup = {
          id: createUid(),
          name: name?.trim() || 'Группа',
          color: '#6366f1',
        };
        const ids = new Set(elementIds);
        set((s) => ({
          boards: upsertBoard(s.boards, projectId, (board) => ({
            ...board,
            groups: [...board.groups, group],
            notes: board.notes.map((n) => (ids.has(n.id) ? { ...n, groupId: group.id } : n)),
            shapes: board.shapes.map((sh) => (ids.has(sh.id) ? { ...sh, groupId: group.id } : sh)),
          })),
        }));
        touch(get().getBoard(projectId));
        return group;
      },

      addStroke: (projectId, stroke) => {
        recordHistory(projectId, get().getBoard(projectId));
        const next: WhiteboardStroke = { ...stroke, id: createUid() };
        set((s) => ({
          boards: upsertBoard(s.boards, projectId, (board) => ({
            ...board,
            strokes: [...board.strokes, next],
          })),
        }));
        touch(get().getBoard(projectId));
      },

      addNote: (projectId, x, y, text = '') => {
        recordHistory(projectId, get().getBoard(projectId));
        const note: WhiteboardNote = {
          id: createUid(),
          x,
          y,
          width: 200,
          height: 160,
          color: pickNoteColor(get().getBoard(projectId).notes.length),
          text,
        };
        set((s) => ({
          boards: upsertBoard(s.boards, projectId, (board) => ({
            ...board,
            notes: [...board.notes, note],
          })),
        }));
        touch(get().getBoard(projectId));
        return note;
      },

      addShape: (projectId, shape) => {
        recordHistory(projectId, get().getBoard(projectId));
        const next: WhiteboardShape = {
          ...shape,
          id: createUid(),
          color: shape.color || pickShapeColor(get().getBoard(projectId).shapes.length),
        };
        set((s) => ({
          boards: upsertBoard(s.boards, projectId, (board) => ({
            ...board,
            shapes: [...board.shapes, next],
          })),
        }));
        touch(get().getBoard(projectId));
        return next;
      },

      updateNote: (projectId, noteId, patch) => {
        if (Object.keys(patch).some((k) => k !== 'text')) {
          recordHistory(projectId, get().getBoard(projectId));
        }
        set((s) => ({
          boards: s.boards.map((board) =>
            board.projectId === projectId
              ? {
                  ...board,
                  notes: board.notes.map((n) => (n.id === noteId ? { ...n, ...patch } : n)),
                }
              : board,
          ),
        }));
        touch(get().getBoard(projectId));
      },

      updateShape: (projectId, shapeId, patch) => {
        recordHistory(projectId, get().getBoard(projectId));
        set((s) => ({
          boards: s.boards.map((board) =>
            board.projectId === projectId
              ? {
                  ...board,
                  shapes: board.shapes.map((sh) => (sh.id === shapeId ? { ...sh, ...patch } : sh)),
                }
              : board,
          ),
        }));
        touch(get().getBoard(projectId));
      },

      removeNote: (projectId, noteId) => {
        recordHistory(projectId, get().getBoard(projectId));
        set((s) => ({
          boards: s.boards.map((board) =>
            board.projectId === projectId
              ? {
                  ...board,
                  notes: board.notes.filter((n) => n.id !== noteId),
                  connectors: board.connectors.filter((c) => c.fromId !== noteId && c.toId !== noteId),
                }
              : board,
          ),
        }));
        touch(get().getBoard(projectId));
      },

      removeShape: (projectId, shapeId) => {
        recordHistory(projectId, get().getBoard(projectId));
        set((s) => ({
          boards: s.boards.map((board) =>
            board.projectId === projectId
              ? {
                  ...board,
                  shapes: board.shapes.filter((sh) => sh.id !== shapeId),
                  connectors: board.connectors.filter((c) => c.fromId !== shapeId && c.toId !== shapeId),
                }
              : board,
          ),
        }));
        touch(get().getBoard(projectId));
      },

      addConnector: (projectId, fromId, toId) => {
        if (fromId === toId) return null;
        recordHistory(projectId, get().getBoard(projectId));
        const connector: WhiteboardConnector = {
          id: createUid(),
          fromId,
          toId,
          color: '#64748b',
        };
        set((s) => ({
          boards: upsertBoard(s.boards, projectId, (board) => ({
            ...board,
            connectors: [...board.connectors.filter((c) => !(c.fromId === fromId && c.toId === toId)), connector],
          })),
        }));
        touch(get().getBoard(projectId));
        return connector;
      },

      removeConnector: (projectId, connectorId) => {
        recordHistory(projectId, get().getBoard(projectId));
        set((s) => ({
          boards: s.boards.map((board) =>
            board.projectId === projectId
              ? { ...board, connectors: board.connectors.filter((c) => c.id !== connectorId) }
              : board,
          ),
        }));
        touch(get().getBoard(projectId));
      },

      removeLastStroke: (projectId) => {
        recordHistory(projectId, get().getBoard(projectId));
        set((s) => ({
          boards: upsertBoard(s.boards, projectId, (board) => ({
            ...board,
            strokes: board.strokes.slice(0, -1),
          })),
        }));
        touch(get().getBoard(projectId));
      },

      clearStrokes: (projectId) => {
        recordHistory(projectId, get().getBoard(projectId));
        set((s) => ({
          boards: upsertBoard(s.boards, projectId, (board) => ({ ...board, strokes: [] })),
        }));
        touch(get().getBoard(projectId));
      },

      setViewport: (projectId, viewport) => {
        set((s) => ({
          boards: upsertBoard(s.boards, projectId, (board) => ({
            ...board,
            viewport: { ...board.viewport, ...viewport },
          })),
        }));
      },

      removeByProject: (projectId) => {
        historyPast.delete(projectId);
        historyFuture.delete(projectId);
        set((s) => ({ boards: s.boards.filter((b) => b.projectId !== projectId) }));
      },
    }),
    {
      name: 'devos:whiteboard',
      skipHydration: true,
      storage: createJSONStorage(() => createScopedIdbStorage('devos:whiteboard')),
      version: 3,
      migrate: (state) => {
        const s = state as { boards?: Partial<WhiteboardData>[] } | undefined;
        if (s?.boards) {
          s.boards = s.boards.map((b) => normalizeBoard({ projectId: b.projectId!, ...b }));
        }
        return s as WhiteboardState;
      },
    },
  ),
);
