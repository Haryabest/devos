import { subscribePresence, type CollabPresence } from '@/lib/collab-presence';

type FollowListener = (point: { x: number; y: number }) => void;

let followingHostId: string | null = null;
let hostClientId: string | null = null;
let unsub: (() => void) | null = null;
const listeners: FollowListener[] = [];

export function startFollowHost(projectId: string, hostUserId: string, hostClientIdHint?: string) {
  stopFollowHost();
  followingHostId = hostUserId;
  hostClientId = hostClientIdHint ?? null;
  unsub = subscribePresence((msg: CollabPresence) => {
    if (msg.projectId !== projectId) return;
    if (msg.kind !== 'cursor') return;
    if (hostClientId && msg.clientId !== hostClientId) return;
    if (!hostClientId && msg.userId !== followingHostId) return;
    if (!hostClientId) hostClientId = msg.clientId;
    listeners.forEach((fn) => fn({ x: msg.x, y: msg.y }));
  });
}

export function stopFollowHost() {
  followingHostId = null;
  hostClientId = null;
  unsub?.();
  unsub = null;
}

export function isFollowingHost() {
  return followingHostId !== null;
}

export function subscribeFollow(fn: FollowListener) {
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i >= 0) listeners.splice(i, 1);
  };
}
