export type Role = 'OWNER' | 'ADMIN' | 'MANAGER' | 'DEVELOPER' | 'VIEWER' | 'GUEST';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ProjectType = 'SAAS' | 'WEB' | 'MOBILE' | 'DESKTOP' | 'API' | 'GAME' | 'OTHER';
export type ProjectStatus = 'ACTIVE' | 'PAUSED' | 'DONE' | 'ARCHIVED';
export type HealthScore = 'GREEN' | 'YELLOW' | 'RED';

export interface ProjectLinks {
  figma?: string;
  git?: string;
}

export interface ProjectGroup {
  id: string;
  name: string;
  color: string;
  order: number;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  health: HealthScore;
  links: ProjectLinks;
  groupId: string | null;
  clientId: string | null;
  startAt: string | null;
  dueAt: string | null;
  createdAt: string;
}
