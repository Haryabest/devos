/** Re-export all shared types from domain modules. */
export type { Role, Priority, ProjectType, ProjectStatus, HealthScore } from './project';
export type { ProjectLinks, Project, ProjectGroup } from './project';
export type { AttachmentKind, Attachment } from './attachment';
export type { TaskColumn, Task, TaskStatus, TaskComment, TaskHistoryEntry, CommentReaction } from './task';
export type { RoadmapColumn, RoadmapCard } from './roadmap';
export type { HttpMethod, ApiEndpoint } from './api';
export type { Doc, DocFolder, DocFormat, DocRevision } from './doc';
export type { Client, ClientContact, ClientContract } from './client';
export type { User, AuthTokens, AuthResponse, ApiError, HealthResponse } from './auth';
export type {
  InviteStatus,
  ProjectMember,
  TeamInvite,
  ProjectInviteBundle,
} from './team';
export { ROLE_LABEL } from './team';
