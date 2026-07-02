import type { Attachment, AttachmentKind, Priority, TaskColumn, TaskStatus } from '@/shared/types';

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
  statusKey?: TaskStatus;
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
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

export const TASK_STATUSES: TaskStatus[] = [
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'REVIEW',
  'TESTING',
  'DONE',
];

export const STATUS_LABEL: Record<TaskStatus, string> = {
  BACKLOG: 'Backlog',
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  TESTING: 'Testing',
  DONE: 'Done',
};

const DEFAULT_COLUMNS: { name: string; color: string; statusKey: TaskStatus }[] = [
  { name: 'Backlog', color: COLUMN_COLORS[0]!, statusKey: 'BACKLOG' },
  { name: 'To Do', color: COLUMN_COLORS[1]!, statusKey: 'TODO' },
  { name: 'In Progress', color: COLUMN_COLORS[2]!, statusKey: 'IN_PROGRESS' },
  { name: 'Review', color: COLUMN_COLORS[3]!, statusKey: 'REVIEW' },
  { name: 'Testing', color: COLUMN_COLORS[5]!, statusKey: 'TESTING' },
  { name: 'Done', color: COLUMN_COLORS[4]!, statusKey: 'DONE' },
];

const LEGACY_STATUS_MAP: Record<string, TaskStatus> = {
  Бэклог: 'BACKLOG',
  'To Do': 'TODO',
  'В работе': 'IN_PROGRESS',
  Готово: 'DONE',
};

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
    statusKey: c.statusKey,
  }));
}

export function createUid(): string {
  return uid();
}

export function statusFromColumn(col: TaskColumn | undefined): TaskStatus {
  if (col?.statusKey) return col.statusKey;
  if (col?.name && LEGACY_STATUS_MAP[col.name]) return LEGACY_STATUS_MAP[col.name]!;
  return 'TODO';
}

export function migrateTasksState(state: unknown): unknown {
  const s = (state ?? {}) as Record<string, unknown>;
  const rawTasks = (s.tasks ?? []) as Array<Record<string, unknown>>;
  s.tasks = rawTasks.map((t, i) => {
    const done = (t.done as boolean) ?? t.status === 'DONE';
    const status =
      (t.status as TaskStatus) ??
      (done ? 'DONE' : 'TODO');
    return {
      id: (t.id as string) ?? uid(),
      projectId: (t.projectId as string) ?? '',
      columnId: (t.columnId as string) ?? '',
      parentId: (t.parentId as string | null) ?? null,
      title: (t.title as string) ?? '',
      description: (t.description as string) ?? '',
      priority: (t.priority as Priority) ?? 'MEDIUM',
      status,
      order: (t.order as number) ?? i,
      attachments: (t.attachments as Attachment[]) ?? [],
      done,
      startAt: (t.startAt as string | null) ?? null,
      dueAt: (t.dueAt as string | null) ?? null,
      dependsOn: (t.dependsOn as string[]) ?? [],
      comments: (t.comments as unknown[]) ?? [],
      history: (t.history as unknown[]) ?? [],
      createdAt: (t.createdAt as string) ?? new Date().toISOString(),
    };
  });

  const rawCols = (s.columns ?? []) as Array<Record<string, unknown>>;
  s.columns = rawCols.map((c, i) => {
    const name = (c.name as string) ?? 'To Do';
    return {
      id: (c.id as string) ?? uid(),
      projectId: (c.projectId as string) ?? '',
      name,
      color: (c.color as string) ?? COLUMN_COLORS[i % COLUMN_COLORS.length]!,
      order: (c.order as number) ?? i,
      statusKey:
        (c.statusKey as TaskStatus) ??
        LEGACY_STATUS_MAP[name] ??
        DEFAULT_COLUMNS[i % DEFAULT_COLUMNS.length]?.statusKey ??
        'TODO',
    };
  });
  return s;
}
