import type { Priority, Project, ProjectStatus, ProjectType, Task, TaskComment, TaskStatus } from '@/shared/types';

export interface ApiTaskComment {
  id: string;
  body: string;
  authorId: string;
  createdAt: string;
  author: { id: string; name: string; avatarUrl: string | null };
}

export interface ApiTask {
  id: string;
  projectId: string;
  parentId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  order: number;
  assigneeId: string | null;
  dueAt: string | null;
  createdAt: string;
  comments?: ApiTaskComment[];
  dependencies?: { toId: string }[];
}

function mapApiComment(c: ApiTaskComment): TaskComment {
  return {
    id: c.id,
    author: c.author.name,
    authorId: c.author.id,
    text: c.body,
    createdAt: c.createdAt,
    parentCommentId: null,
    threadId: null,
    reactions: [],
    assigneeIds: [],
  };
}

export function mapApiTask(t: ApiTask, columnId: string): Task {
  return {
    id: t.id,
    projectId: t.projectId,
    columnId,
    parentId: t.parentId,
    title: t.title,
    description: t.description ?? '',
    priority: t.priority,
    status: t.status,
    order: t.order,
    attachments: [],
    done: t.status === 'DONE',
    startAt: null,
    dueAt: t.dueAt,
    dependsOn: t.dependencies?.map((d) => d.toId) ?? [],
    comments: t.comments?.map(mapApiComment) ?? [],
    history: [],
    assigneeId: t.assigneeId,
    estimateMinutes: null,
    spentMinutes: null,
    createdAt: t.createdAt,
  };
}

export interface ApiWorkspace {
  id: string;
  name: string;
  slug: string;
}

export interface ApiProject {
  id: string;
  workspaceId: string;
  clientId: string | null;
  name: string;
  description: string | null;
  type: ProjectType;
  status: string;
  startAt: string | null;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_MAP: Record<string, ProjectStatus> = {
  PLANNED: 'ACTIVE',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'DONE',
  ARCHIVED: 'ARCHIVED',
};

export function mapApiProject(p: ApiProject, links: Project['links'] = {}): Project {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? '',
    type: p.type,
    status: STATUS_MAP[p.status] ?? 'ACTIVE',
    health: 'GREEN',
    links,
    groupId: null,
    clientId: p.clientId,
    startAt: p.startAt,
    dueAt: p.dueAt,
    createdAt: p.createdAt,
  };
}

export function mapProjectToApi(input: {
  name: string;
  description?: string;
  type?: ProjectType;
  status?: ProjectStatus;
  clientId?: string | null;
  startAt?: string | null;
  dueAt?: string | null;
}) {
  const statusReverse: Record<ProjectStatus, string> = {
    ACTIVE: 'ACTIVE',
    PAUSED: 'PAUSED',
    DONE: 'COMPLETED',
    ARCHIVED: 'ARCHIVED',
  };
  return {
    name: input.name,
    description: input.description,
    type: input.type,
    status: input.status ? statusReverse[input.status] : undefined,
    clientId: input.clientId ?? undefined,
    startAt: input.startAt ?? undefined,
    dueAt: input.dueAt ?? undefined,
  };
}

export function mapTaskToApi(task: Task) {
  return {
    title: task.title,
    description: task.description || undefined,
    status: task.status,
    priority: task.priority,
    assigneeId: task.assigneeId ?? undefined,
    parentId: task.parentId ?? undefined,
    dueAt: task.dueAt ?? undefined,
  };
}
