import { z } from 'zod';
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  ProjectType,
  ProjectStatus,
  WorkspaceRole,
} from '../enums/index.js';

export const idSchema = z.string().uuid();
export const cuidSchema = z.string().min(1);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});
export type Pagination = z.infer<typeof paginationSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10),
});

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/),
});
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

export const createProjectSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  type: z.nativeEnum(ProjectType).default(ProjectType.Other),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.Planned),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const createTaskSchema = z.object({
  projectId: cuidSchema,
  title: z.string().min(1).max(200),
  description: z.string().max(10_000).optional(),
  status: z.enum(TASK_STATUSES as [string, ...string[]]).default('BACKLOG'),
  priority: z.enum(TASK_PRIORITIES as [string, ...string[]]).default('MEDIUM'),
  assigneeId: cuidSchema.optional(),
  dueAt: z.coerce.date().optional(),
  parentId: cuidSchema.optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema.partial().omit({ projectId: true });
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(WorkspaceRole).default(WorkspaceRole.Developer),
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const aiAskSchema = z.object({
  projectId: cuidSchema.optional(),
  workspaceId: cuidSchema,
  question: z.string().min(1).max(4000),
  conversationId: cuidSchema.optional(),
});
export type AiAskInput = z.infer<typeof aiAskSchema>;
