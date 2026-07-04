import type { ApiError, AuthResponse } from '@/shared/types';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Тонкий fetch-wrapper: base URL, Bearer, JSON, auto-refresh при 401.
 */
export const API_BASE = (import.meta.env.VITE_API_URL ?? '') + '/api';

export class ApiRequestError extends Error {
  constructor(public readonly error: ApiError) {
    super(error.message);
    this.name = 'ApiRequestError';
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshTokens(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const { refreshToken, setSession, clear } = useAuthStore.getState();
    if (!refreshToken) {
      clear();
      return false;
    }

    let res: Response;
    try {
      res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        clear();
        return false;
      }
      const data = (await res.json()) as AuthResponse;
      setSession(data);
      return true;
    } catch {
      clear();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function api<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = true, headers, ...rest } = init;
  const finalHeaders = new Headers(headers);
  if (!finalHeaders.has('content-type') && rest.body && !(rest.body instanceof FormData)) {
    finalHeaders.set('content-type', 'application/json');
  }
  if (auth) {
    const token = useAuthStore.getState().accessToken;
    if (token) finalHeaders.set('authorization', `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...rest, headers: finalHeaders });
  } catch {
    throw new ApiRequestError({
      statusCode: 0,
      code: 'NETWORK_ERROR',
      message: 'Не удалось подключиться к серверу. Запустите backend: cd backend && pnpm dev',
    });
  }
  const isJson = res.headers.get('content-type')?.includes('application/json');
  let body: unknown = isJson ? await res.json() : await res.text();

  if (res.status === 401 && auth && !path.startsWith('/auth/')) {
    const refreshed = await tryRefreshTokens();
    if (refreshed) {
      const token = useAuthStore.getState().accessToken;
      if (token) finalHeaders.set('authorization', `Bearer ${token}`);
      try {
        res = await fetch(`${API_BASE}${path}`, { ...rest, headers: finalHeaders });
      } catch {
        throw new ApiRequestError({
          statusCode: 0,
          code: 'NETWORK_ERROR',
          message: 'Не удалось подключиться к серверу. Запустите backend: cd backend && pnpm dev',
        });
      }
      body = res.headers.get('content-type')?.includes('application/json')
        ? await res.json()
        : await res.text();
    }
  }

  if (!res.ok) {
    const err: ApiError =
      typeof body === 'object' && body
        ? {
            statusCode: res.status,
            code: (body as ApiError).code ?? 'HTTP_ERROR',
            message: (body as ApiError).message ?? res.statusText,
            details: (body as ApiError).details,
          }
        : { statusCode: res.status, code: 'HTTP_ERROR', message: String(body || res.statusText) };
    throw new ApiRequestError(err);
  }

  return body as T;
}
