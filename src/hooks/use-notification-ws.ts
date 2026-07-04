import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useNotificationsStore, type AppNotification } from '@/stores/notifications-store';

function wsBaseUrl() {
  const http = import.meta.env.VITE_API_URL ?? '';
  if (http) return http.replace(/^http/, 'ws');
  const { protocol, host } = window.location;
  return `${protocol === 'https:' ? 'wss' : 'ws'}://${host}`;
}

export function useNotificationWs() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isGuest = useAuthStore((s) => s.isGuest);
  const upsertFromServer = useNotificationsStore((s) => s.upsertFromServer);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (isGuest || !accessToken) return;

    const url = `${wsBaseUrl()}/ws/notifications?token=${encodeURIComponent(accessToken)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(String(ev.data)) as { event?: string; data?: AppNotification };
        if (msg.event === 'notification' && msg.data) upsertFromServer(msg.data);
      } catch {
        /* ignore malformed frames */
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [accessToken, isGuest, upsertFromServer]);
}
