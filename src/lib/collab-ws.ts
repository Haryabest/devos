import type { SyncMessage } from '@/lib/sync-types';
import { useAuthStore } from '@/stores/auth-store';

const RECONNECT_MS = 2500;
const MAX_RECONNECT_MS = 15000;

type StatusListener = (connected: boolean) => void;
type MessageListener = (msg: SyncMessage) => void;
type SyncRequestListener = () => void;

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectDelay = RECONNECT_MS;
let clientIdRef = '';
let statusListeners: StatusListener[] = [];
let messageListener: MessageListener | null = null;
let syncRequestListener: SyncRequestListener | null = null;
let wsConnected = false;

function buildWsUrl(clientId: string, token: string | null): string {
  const apiBase = import.meta.env.VITE_API_URL as string | undefined;
  if (apiBase) {
    const httpUrl = new URL(apiBase);
    httpUrl.protocol = httpUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    httpUrl.pathname = '/ws/collab';
    httpUrl.search = new URLSearchParams({
      clientId,
      ...(token ? { token } : {}),
    }).toString();
    return httpUrl.toString();
  }

  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const params = new URLSearchParams({ clientId });
  if (token) params.set('token', token);
  return `${proto}//${window.location.host}/ws/collab?${params.toString()}`;
}

function notifyStatus(connected: boolean) {
  wsConnected = connected;
  statusListeners.forEach((fn) => fn(connected));
}

function openSocket() {
  if (!clientIdRef || typeof WebSocket === 'undefined') return;

  if (ws) {
    ws.onopen = null;
    ws.onclose = null;
    ws.onmessage = null;
    ws.onerror = null;
    ws.close();
    ws = null;
  }

  const token = useAuthStore.getState().accessToken;
  const url = buildWsUrl(clientIdRef, token);

  try {
    ws = new WebSocket(url);

    ws.onopen = () => {
      reconnectDelay = RECONNECT_MS;
      notifyStatus(true);
    };

    ws.onmessage = handleMessage;

    ws.onclose = () => {
      notifyStatus(false);
      scheduleReconnect();
    };

    ws.onerror = () => {
      notifyStatus(false);
    };
  } catch {
    notifyStatus(false);
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (reconnectTimer || !clientIdRef) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    openSocket();
    reconnectDelay = Math.min(reconnectDelay * 1.5, MAX_RECONNECT_MS);
  }, reconnectDelay);
}

function handleMessage(raw: MessageEvent) {
  try {
    const envelope = JSON.parse(String(raw.data)) as {
      event?: string;
      data?: SyncMessage;
    };
    if (envelope.event === 'sync' && envelope.data) {
      messageListener?.(envelope.data);
    }
    if (envelope.event === 'sync-request') {
      syncRequestListener?.();
    }
  } catch {
    /* ignore */
  }
}

export function isCollabWsConnected(): boolean {
  return wsConnected;
}

export function subscribeCollabWsStatus(fn: StatusListener): () => void {
  statusListeners.push(fn);
  fn(wsConnected);
  return () => {
    statusListeners = statusListeners.filter((l) => l !== fn);
  };
}

export function connectCollabWs(
  clientId: string,
  onMessage: MessageListener,
  onSyncRequest: SyncRequestListener,
): () => void {
  clientIdRef = clientId;
  messageListener = onMessage;
  syncRequestListener = onSyncRequest;

  openSocket();

  return () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    messageListener = null;
    syncRequestListener = null;
    clientIdRef = '';
    if (ws) {
      ws.onclose = null;
      ws.close();
      ws = null;
    }
    notifyStatus(false);
  };
}

export function pushCollabWs(msg: SyncMessage): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({ event: 'sync', data: msg }));
}

export function requestCollabWsSync(): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({ event: 'sync-request', data: {} }));
}

/** Переподключение после смены аккаунта / получения токена. */
export function reconnectCollabWs(): void {
  if (!clientIdRef) return;
  reconnectDelay = RECONNECT_MS;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  openSocket();
}
