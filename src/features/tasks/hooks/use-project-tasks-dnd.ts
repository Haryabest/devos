import { useCallback } from 'react';
import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useTasksStore } from '@/stores/tasks-store';
import type { Task, TaskColumn } from '@/shared/types';

export function useProjectTasksDnd(
  projectColumns: TaskColumn[],
  tasks: Task[],
  setActiveTask: (t: Task | null) => void,
) {
  const moveTask = useTasksStore((s) => s.moveTask);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const findColumnByTask = useCallback(
    (taskId: string): TaskColumn | undefined => {
      const t = tasks.find((x) => x.id === taskId);
      return t ? projectColumns.find((c) => c.id === t.columnId) : undefined;
    },
    [tasks, projectColumns],
  );

  const onDragStart = useCallback(
    (e: DragStartEvent) => {
      const id = String(e.active.id);
      setActiveTask(tasks.find((t) => t.id === id) ?? null);
    },
    [tasks, setActiveTask],
  );

  const onDragOver = useCallback(
    (e: DragOverEvent) => {
      const { active, over } = e;
      if (!over) return;
      const activeCol = findColumnByTask(String(active.id));
      const overCol = projectColumns.find((c) => c.id === String(over.id));
      if (activeCol && overCol && activeCol.id !== overCol.id) {
        moveTask(String(active.id), overCol.id, Number.MAX_SAFE_INTEGER);
      }
    },
    [findColumnByTask, projectColumns, moveTask],
  );

  const onDragEnd = useCallback(
    (e: DragEndEvent) => {
      const { active, over } = e;
      setActiveTask(null);
      if (!over) return;
      const col = findColumnByTask(String(active.id));
      if (!col) return;
      const list = tasks
        .filter((t) => t.columnId === col.id && t.parentId === null && t.id !== active.id)
        .sort((a, b) => a.order - b.order);
      const overTask = tasks.find((t) => t.id === String(over.id));
      const newIndex =
        overTask && overTask.columnId === col.id
          ? list.findIndex((t) => t.id === overTask.id)
          : list.length;
      moveTask(String(active.id), col.id, Math.max(0, newIndex));
    },
    [findColumnByTask, tasks, moveTask, setActiveTask],
  );

  return { sensors, onDragStart, onDragOver, onDragEnd };
}
