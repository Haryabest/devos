export const TaskStatus = {
  Backlog: 'BACKLOG',
  Todo: 'TODO',
  InProgress: 'IN_PROGRESS',
  Review: 'REVIEW',
  Testing: 'TESTING',
  Done: 'DONE',
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];
export const TASK_STATUSES = Object.values(TaskStatus);

export const TaskPriority = {
  Low: 'LOW',
  Medium: 'MEDIUM',
  High: 'HIGH',
  Critical: 'CRITICAL',
} as const;
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];
export const TASK_PRIORITIES = Object.values(TaskPriority);

export const ProjectStatus = {
  Planned: 'PLANNED',
  Active: 'ACTIVE',
  Paused: 'PAUSED',
  Completed: 'COMPLETED',
  Archived: 'ARCHIVED',
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const ProjectType = {
  SaaS: 'SAAS',
  Web: 'WEB',
  Mobile: 'MOBILE',
  Desktop: 'DESKTOP',
  Api: 'API',
  Game: 'GAME',
  Other: 'OTHER',
} as const;
export type ProjectType = (typeof ProjectType)[keyof typeof ProjectType];

export const WorkspaceRole = {
  Owner: 'OWNER',
  Admin: 'ADMIN',
  Manager: 'MANAGER',
  Developer: 'DEVELOPER',
  Viewer: 'VIEWER',
} as const;
export type WorkspaceRole = (typeof WorkspaceRole)[keyof typeof WorkspaceRole];

export const UserKind = {
  Guest: 'GUEST',
  User: 'USER',
} as const;
export type UserKind = (typeof UserKind)[keyof typeof UserKind];

export const IntegrationProvider = {
  GitHub: 'GITHUB',
  GitLab: 'GITLAB',
  Figma: 'FIGMA',
} as const;
export type IntegrationProvider = (typeof IntegrationProvider)[keyof typeof IntegrationProvider];

export const HealthScore = {
  Green: 'GREEN',
  Yellow: 'YELLOW',
  Red: 'RED',
} as const;
export type HealthScore = (typeof HealthScore)[keyof typeof HealthScore];

export const AiProvider = {
  OpenAI: 'OPENAI',
  Anthropic: 'ANTHROPIC',
  Gemini: 'GEMINI',
  Local: 'LOCAL',
} as const;
export type AiProvider = (typeof AiProvider)[keyof typeof AiProvider];

export const AiSourceKind = {
  Document: 'DOCUMENT',
  Task: 'TASK',
  Comment: 'COMMENT',
  Code: 'CODE',
  Design: 'DESIGN',
  Message: 'MESSAGE',
} as const;
export type AiSourceKind = (typeof AiSourceKind)[keyof typeof AiSourceKind];
