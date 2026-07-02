import type { Project, ProjectStatus, ProjectType } from '@/shared/types';

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
