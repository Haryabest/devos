/**
 * Стабильные API-контракты и общие типы ответов backend ↔ frontend.
 */

export interface ApiError {
  statusCode: number;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
  tokens: AuthTokens;
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  version: string;
  uptime: number;
  services: {
    db: 'up' | 'down';
    redis: 'up' | 'down';
  };
}

/** Прикладной размер контекста RAG-поиска. */
export const RAG_TOP_K = 12;

/** Единая точка API-путей (используется на клиенте). */
export const API_ROUTES = {
  health: '/health',
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  workspaces: {
    list: '/workspaces',
    create: '/workspaces',
    detail: (id: string) => `/workspaces/${id}`,
  },
  projects: {
    list: (ws: string) => `/workspaces/${ws}/projects`,
    create: (ws: string) => `/workspaces/${ws}/projects`,
    detail: (id: string) => `/projects/${id}`,
  },
  tasks: {
    list: (project: string) => `/projects/${project}/tasks`,
    create: (project: string) => `/projects/${project}/tasks`,
    detail: (id: string) => `/tasks/${id}`,
  },
  ai: {
    ask: '/ai/ask',
    conversations: '/ai/conversations',
  },
} as const;
