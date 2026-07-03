/**
 * URL collab WebSocket. В dev — Vite plugin на том же host, не backend :3333.
 */
export function buildCollabWsUrl(
  clientId: string,
  token: string | null,
  opts?: { dev?: boolean; apiBase?: string; host?: string; protocol?: string },
): string {
  const params = new URLSearchParams({ clientId });
  if (token) params.set('token', token);

  const isDev = opts?.dev ?? import.meta.env.DEV;

  if (isDev) {
    const proto =
      opts?.protocol ??
      (typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:');
    const host = opts?.host ?? (typeof window !== 'undefined' ? window.location.host : '127.0.0.1:1420');
    return `${proto}//${host}/ws/collab?${params.toString()}`;
  }

  const apiBase = opts?.apiBase ?? (import.meta.env.VITE_API_URL as string | undefined);
  if (apiBase) {
    const httpUrl = new URL(apiBase);
    httpUrl.protocol = httpUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    httpUrl.pathname = '/ws/collab';
    httpUrl.search = params.toString();
    return httpUrl.toString();
  }

  const proto =
    typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = typeof window !== 'undefined' ? window.location.host : 'localhost';
  return `${proto}//${host}/ws/collab?${params.toString()}`;
}
