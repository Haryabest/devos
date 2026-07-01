import type { ApiError } from '@/shared/types';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Тонкий fetch-wrapper: base URL, Bearer, JSON, кидает ApiRequestError.
 * Refresh токенов — отдельным mutation'ом (не автомагически).
 */
export const API_BASE = (import.meta.env.VITE_API_URL ?? '') + '/api';

export class ApiRequestError extends Error {
  constructor(public readonly error: ApiError) {
    super(error.message);
    this.name = 'ApiRequestError';
  }
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

  const res = await fetch(`${API_BASE}${path}`, { ...rest, headers: finalHeaders });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const err: ApiError =
      typeof body === 'object' && body
        ? {
            statusCode: res.status,
            code: body.code ?? 'HTTP_ERROR',
            message: body.message ?? res.statusText,
            details: body.details,
          }
        : { statusCode: res.status, code: 'HTTP_ERROR', message: String(body || res.statusText) };
    throw new ApiRequestError(err);
  }

  return body as T;
}
