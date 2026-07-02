import type { Priority } from '@/shared/types';

export type TaskView = 'board' | 'list' | 'table' | 'calendar' | 'timeline';
export type TaskFilter = 'all' | 'active' | 'done';

export const PRIORITY_DOT: Record<Priority, string> = {
  LOW: 'bg-muted-foreground',
  MEDIUM: 'bg-sky-500',
  HIGH: 'bg-amber-500',
  CRITICAL: 'bg-red-500',
};

export function applyTaskFilter<T extends { done: boolean }>(
  tasks: T[],
  filter: TaskFilter,
): T[] {
  if (filter === 'active') return tasks.filter((t) => !t.done);
  if (filter === 'done') return tasks.filter((t) => t.done);
  return tasks;
}

export const TASK_FILTER_LABELS: { key: TaskFilter; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'active', label: 'Активные' },
  { key: 'done', label: 'Выполненные' },
];
