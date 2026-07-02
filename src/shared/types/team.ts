import type { Role } from './project';
import type { ApiEndpoint } from './api';
import type { Doc } from './doc';
import type { Task, TaskColumn } from './task';
import type { Project } from './project';

export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  email: string;
  name: string;
  role: Role;
  joinedAt: string;
}

export interface TeamInvite {
  id: string;
  projectId: string;
  projectName: string;
  email: string;
  role: Role;
  token: string;
  status: InviteStatus;
  invitedBy: string;
  invitedByName: string;
  createdAt: string;
  expiresAt: string;
  bundle?: ProjectInviteBundle;
}

export interface ProjectInviteBundle {
  project: Project;
  columns: TaskColumn[];
  tasks: Task[];
  docs: Doc[];
  endpoints: ApiEndpoint[];
}

export const ROLE_LABEL: Record<Role, string> = {
  OWNER: 'Владелец',
  ADMIN: 'Админ',
  MANAGER: 'Менеджер',
  DEVELOPER: 'Разработчик',
  VIEWER: 'Наблюдатель',
  GUEST: 'Гость',
};
