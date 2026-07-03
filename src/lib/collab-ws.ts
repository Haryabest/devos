import type { SyncMessage } from '@/lib/sync-types';
import { buildCollabWsUrl } from '@/domain/collab/ws-url';
import { useAuthStore } from '@/stores/auth-store';

const RECONNECT_MS = 2500;
const MAX_RECONNECT_MS = 15000;

type StatusListener = (connected: boolean) => void;
type MessageListener = (msg: SyncMessage) => void;
type SyncRequestListener = () => void;
type HostLeftListener = (data: { projectId: string; userId: string | null }) => void;
type RawListener = (event: string, data: unknown) => void;
type CollabRoomRole = 'host' | 'guest';

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectDelay = RECONNECT_MS;
let clientIdRef = '';
let statusListeners: StatusListener[] = [];
let messageListener: MessageListener | null = null;
let syncRequestListener: SyncRequestListener | null = null;
let hostLeftListener: HostLeftListener | null = null;
let rawListeners: RawListener[] = [];
let wsConnected = false;
const joinedRooms = new Map<string, CollabRoomRole>();

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
  const url = buildCollabWsUrl(clientIdRef, token);

  try {
    ws = new WebSocket(url);

    ws.onopen = () => {
      reconnectDelay = RECONNECT_MS;
      notifyStatus(true);
      joinedRooms.forEach((role, projectId) => sendRoomJoin(projectId, role));
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
      data?: SyncMessage | { projectId: string; userId: string | null };
    };
    if (envelope.event === 'sync' && envelope.data) {
      messageListener?.(envelope.data as SyncMessage);
    }
    if (envelope.event === 'sync-request') {
      syncRequestListener?.();
    }
    if (envelope.event === 'host-left' && envelope.data && 'projectId' in envelope.data) {
      hostLeftListener?.(envelope.data);
    }
    if (envelope.event) {
      rawListeners.forEach((fn) => fn(envelope.event!, envelope.data));
    }
  } catch {
    /* ignore */
  }
}

function sendRoomJoin(projectId: string, role: CollabRoomRole) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({ event: 'room-join', data: { projectId, role } }));
}

function sendRoomLeave(projectId: string) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({ event: 'room-leave', data: { projectId } }));
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
  onHostLeft?: HostLeftListener,
): () => void {
  clientIdRef = clientId;
  messageListener = onMessage;
  syncRequestListener = onSyncRequest;
  hostLeftListener = onHostLeft ?? null;

  openSocket();

  return () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    messageListener = null;
    syncRequestListener = null;
    hostLeftListener = null;
    clientIdRef = '';
    joinedRooms.clear();
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

export function pushCollabRaw(event: string, data: unknown): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({ event, data }));
}

export function subscribeCollabRaw(fn: RawListener): () => void {
  rawListeners.push(fn);
  return () => {
    rawListeners = rawListeners.filter((l) => l !== fn);
  };
}

export function getCollabClientId(): string {
  return clientIdRef;
}

export function requestCollabWsSync(): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({ event: 'sync-request', data: {} }));
}

export function joinCollabRoom(projectId: string, role: CollabRoomRole): void {
  joinedRooms.set(projectId, role);
  sendRoomJoin(projectId, role);
}

export function leaveCollabRoom(projectId: string): void {
  joinedRooms.delete(projectId);
  sendRoomLeave(projectId);
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
