import type { Attachment, AttachmentKind, Priority, TaskColumn } from '@/shared/types';

export const TASK_AUTOSAVE_DELAY = 3000;

export interface NewTask {
  projectId: string;
  columnId: string;
  title: string;
  priority?: Priority;
  parentId?: string | null;
}

export interface NewColumn {
  projectId: string;
  name: string;
  color?: string;
}

export interface NewAttachment {
  kind: AttachmentKind;
  label: string;
  value: string;
}

export const COLUMN_COLORS = [
  '#64748b',
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#a855f7',
  '#ec4899',
  '#14b8a6',
];

export const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const PRIORITY_LABEL: Record<Priority, string> = {
  LOW: 'Низкий',
  MEDIUM: 'Средний',
  HIGH: 'Высокий',
  CRITICAL: 'Критичный',
};

const DEFAULT_COLUMNS: { name: string; color: string }[] = [
  { name: 'Бэклог', color: COLUMN_COLORS[0]! },
  { name: 'To Do', color: COLUMN_COLORS[1]! },
  { name: 'В работе', color: COLUMN_COLORS[2]! },
  { name: 'Готово', color: COLUMN_COLORS[4]! },
];

function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export function seedColumns(projectId: string): TaskColumn[] {
  return DEFAULT_COLUMNS.map((c, i) => ({
    id: uid(),
    projectId,
    name: c.name,
    color: c.color,
    order: i,
  }));
}

export function createUid(): string {
  return uid();
}

export function migrateTasksState(state: unknown): unknown {
  const s = (state ?? {}) as Record<string, unknown>;
  const rawTasks = (s.tasks ?? []) as Array<Record<string, unknown>>;
  s.tasks = rawTasks.map((t, i) => ({
    id: (t.id as string) ?? uid(),
    projectId: (t.projectId as string) ?? '',
    columnId: (t.columnId as string) ?? '',
    parentId: (t.parentId as string | null) ?? null,
    title: (t.title as string) ?? '',
    description: (t.description as string) ?? '',
    priority: (t.priority as Priority) ?? 'MEDIUM',
    order: (t.order as number) ?? i,
    attachments: (t.attachments as Attachment[]) ?? [],
    done: (t.done as boolean) ?? t.status === 'DONE',
    createdAt: (t.createdAt as string) ?? new Date().toISOString(),
  }));
  if (!s.columns) s.columns = [];
  return s;
}
