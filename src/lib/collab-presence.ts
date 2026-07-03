import { pushCollabRaw, subscribeCollabRaw } from '@/lib/collab-ws';

export type PresenceKind = 'cursor' | 'laser';

export interface CollabPresence {
  kind: PresenceKind;
  projectId: string;
  clientId: string;
  userId: string | null;
  userName: string;
  x: number;
  y: number;
  ts: number;
}

type PresenceListener = (msg: CollabPresence) => void;

const listeners: PresenceListener[] = [];
let subscribed = false;

function ensureSubscribe() {
  if (subscribed) return;
  subscribed = true;
  subscribeCollabRaw((event, data) => {
    if (event === 'presence' && data && typeof data === 'object' && 'projectId' in data) {
      listeners.forEach((fn) => fn(data as CollabPresence));
    }
  });
}

export function subscribePresence(fn: PresenceListener): () => void {
  ensureSubscribe();
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i >= 0) listeners.splice(i, 1);
  };
}

export function sendPresence(msg: Omit<CollabPresence, 'ts'>) {
  pushCollabRaw('presence', { ...msg, ts: Date.now() });
}
