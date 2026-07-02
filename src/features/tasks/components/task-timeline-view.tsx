import { useMemo } from 'react';
import { parseISO, isValid, differenceInCalendarDays, min, max } from 'date-fns';
import type { Task, TaskColumn } from '@/shared/types';
import { STATUS_LABEL } from '@/stores/tasks/constants';
import { PRIORITY_DOT } from '@/features/tasks/constants';
import { cn } from '@/lib/utils';

interface TaskTimelineViewProps {
  tasks: Task[];
  columns: TaskColumn[];
  onOpen: (task: Task) => void;
}

export function TaskTimelineView({ tasks, columns, onOpen }: TaskTimelineViewProps) {
  const items = useMemo(() => {
    return tasks
      .map((t) => {
        const start = t.startAt ? parseISO(t.startAt) : parseISO(t.createdAt);
        const end = t.dueAt ? parseISO(t.dueAt) : start;
        if (!isValid(start) || !isValid(end)) return null;
        return { task: t, start, end: end < start ? start : end };
      })
      .filter(Boolean) as { task: Task; start: Date; end: Date }[];
  }, [tasks]);

  const range = useMemo(() => {
    if (items.length === 0) return null;
    const starts = items.map((i) => i.start);
    const ends = items.map((i) => i.end);
    return { start: min(starts), end: max(ends) };
  }, [items]);

  if (!range || items.length === 0) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Нет задач с датами для таймлайна. Укажите «Начало» и «Срок» на странице задачи.
      </div>
    );
  }

  const totalDays = Math.max(1, differenceInCalendarDays(range.end, range.start) + 1);

  function barStyle(start: Date, end: Date) {
    const left = (differenceInCalendarDays(start, range!.start) / totalDays) * 100;
    const width = ((differenceInCalendarDays(end, start) + 1) / totalDays) * 100;
    return { left: `${left}%`, width: `${Math.max(width, 2)}%` };
  }

  return (
    <div className="space-y-2 p-6">
      <div className="mb-4 flex justify-between text-xs text-muted-foreground">
        <span>{range.start.toLocaleDateString('ru-RU')}</span>
        <span>{range.end.toLocaleDateString('ru-RU')}</span>
      </div>
      {items.map(({ task, start, end }) => {
        const col = columns.find((c) => c.id === task.columnId);
        return (
          <button
            key={task.id}
            type="button"
            onClick={() => onOpen(task)}
            className="group flex w-full items-center gap-3 rounded-md border border-border/40 px-3 py-2 text-left hover:bg-muted/40"
          >
            <div className="w-40 shrink-0 truncate text-sm font-medium">{task.title || 'Без названия'}</div>
            <div className="relative h-6 flex-1 rounded bg-muted/50">
              <div
                className="absolute top-1 h-4 rounded"
                style={{
                  ...barStyle(start, end),
                  backgroundColor: col?.color ?? '#64748b',
                }}
              />
            </div>
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <span className={cn('h-2 w-2 rounded-full', PRIORITY_DOT[task.priority])} />
              <span className="text-xs text-muted-foreground">{STATUS_LABEL[task.status]}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
