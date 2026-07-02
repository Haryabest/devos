/** Re-export all shared types from domain modules. */
export type { Role, Priority, ProjectType, ProjectStatus, HealthScore } from './project';
export type { ProjectLinks, Project, ProjectGroup } from './project';
export type { AttachmentKind, Attachment } from './attachment';
export type { TaskColumn, Task } from './task';
export type { HttpMethod, ApiEndpoint } from './api';
export type { Doc } from './doc';
export type { User, AuthTokens, AuthResponse, ApiError, HealthResponse } from './auth';
export type {
  InviteStatus,
  ProjectMember,
  TeamInvite,
  ProjectInviteBundle,
} from './team';
export { ROLE_LABEL } from './team';
