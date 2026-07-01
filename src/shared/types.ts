/**
 * Тонкая копия shared-типов для фронта — чтобы UI не зависел от backend/packages.
 * Полные Zod-схемы + доменные модели живут в backend/packages/shared;
 * здесь только то, что реально дёргает React.
 */

export type Role = 'OWNER' | 'ADMIN' | 'MANAGER' | 'DEVELOPER' | 'VIEWER' | 'GUEST';

export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'TESTING' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ProjectType = 'SAAS' | 'WEB' | 'MOBILE' | 'DESKTOP' | 'API' | 'GAME' | 'OTHER';
export type HealthScore = 'GREEN' | 'YELLOW' | 'RED';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface ApiError {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  uptime: number;
  version: string;
  checks: Record<string, { ok: boolean; message?: string }>;
}
