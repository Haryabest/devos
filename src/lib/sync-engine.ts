/**
 * Real-time синхронизация между вкладками/окнами (BroadcastChannel).
 * Для multi-device — WebSocket через backend (roadmap).
 */

import { useAuthStore } from '@/stores/auth-store';
import { useProjectsStore } from '@/stores/projects-store';
import { useTasksStore } from '@/stores/tasks-store';
import { useDocsStore } from '@/stores/docs-store';
import { useApiStore } from '@/stores/api-store';
import { useGroupsStore } from '@/stores/groups-store';
import { useTeamStore } from '@/stores/team-store';
import { useClientsStore } from '@/stores/clients-store';

export type SyncStoreName = 'projects' | 'tasks' | 'docs' | 'api' | 'groups' | 'team' | 'clients';

export interface SyncMessage {
  senderId: string;
  senderName: string;
  store: SyncStoreName;
  payload: unknown;
  ts: number;
}

type SyncListener = (connected: boolean) => void;

const CHANNEL_NAME = 'devos-collab-v1';
let channel: BroadcastChannel | null = null;
let applyingRemote = false;
let syncListeners: SyncListener[] = [];
const debounceTimers: Partial<Record<SyncStoreName, ReturnType<typeof setTimeout>>> = {};

function getSenderId(): string {
  return useAuthStore.getState().user?.id ?? 'anon';
}

function getSenderName(): string {
  return useAuthStore.getState().user?.name ?? 'Аноним';
}

function broadcast(store: SyncStoreName, payload: unknown) {
  if (applyingRemote || !channel) return;
  const msg: SyncMessage = {
    senderId: getSenderId(),
    senderName: getSenderName(),
    store,
    payload,
    ts: Date.now(),
  };
  channel.postMessage(msg);
}

function debouncedBroadcast(store: SyncStoreName, getPayload: () => unknown, delay = 150) {
  if (debounceTimers[store]) clearTimeout(debounceTimers[store]!);
  debounceTimers[store] = setTimeout(() => {
    broadcast(store, getPayload());
    debounceTimers[store] = undefined;
  }, delay);
}

function applyRemote(msg: SyncMessage) {
  if (msg.senderId === getSenderId()) return;

  applyingRemote = true;
  try {
    switch (msg.store) {
      case 'projects':
        useProjectsStore.setState({ projects: msg.payload as never });
        break;
      case 'tasks': {
        const data = msg.payload as { tasks: unknown; columns: unknown };
        useTasksStore.setState({ tasks: data.tasks as never, columns: data.columns as never });
        break;
      }
      case 'docs':
        useDocsStore.setState({ docs: msg.payload as never });
        break;
      case 'api':
        useApiStore.setState({ endpoints: msg.payload as never });
        break;
      case 'groups':
        useGroupsStore.setState({ groups: msg.payload as never });
        break;
      case 'team':
        useTeamStore.setState(msg.payload as never);
        break;
      case 'clients':
        useClientsStore.setState({ clients: msg.payload as never });
        break;
    }
  } finally {
    applyingRemote = false;
  }
}

function notifyListeners(connected: boolean) {
  syncListeners.forEach((fn) => fn(connected));
}

export function subscribeSyncStatus(fn: SyncListener): () => void {
  syncListeners.push(fn);
  fn(!!channel);
  return () => {
    syncListeners = syncListeners.filter((l) => l !== fn);
  };
}

export function initCollaborationSync() {
  if (typeof window === 'undefined' || channel) return;

  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (ev) => applyRemote(ev.data as SyncMessage);
    notifyListeners(true);
  }

  useProjectsStore.subscribe((state, prev) => {
    if (applyingRemote || state.projects === prev.projects) return;
    debouncedBroadcast('projects', () => state.projects);
  });

  useTasksStore.subscribe((state, prev) => {
    if (applyingRemote || (state.tasks === prev.tasks && state.columns === prev.columns)) return;
    debouncedBroadcast('tasks', () => ({ tasks: state.tasks, columns: state.columns }));
  });

  useDocsStore.subscribe((state, prev) => {
    if (applyingRemote || state.docs === prev.docs) return;
    debouncedBroadcast('docs', () => state.docs);
  });

  useApiStore.subscribe((state, prev) => {
    if (applyingRemote || state.endpoints === prev.endpoints) return;
    debouncedBroadcast('api', () => state.endpoints);
  });

  useGroupsStore.subscribe((state, prev) => {
    if (applyingRemote || state.groups === prev.groups) return;
    debouncedBroadcast('groups', () => state.groups);
  });

  useTeamStore.subscribe((state, prev) => {
    if (
      applyingRemote ||
      (state.members === prev.members &&
        state.invites === prev.invites &&
        state.syncRooms === prev.syncRooms)
    )
      return;
    debouncedBroadcast('team', () => ({
      members: state.members,
      invites: state.invites,
      syncRooms: state.syncRooms,
    }));
  });

  useClientsStore.subscribe((state, prev) => {
    if (applyingRemote || state.clients === prev.clients) return;
    debouncedBroadcast('clients', () => state.clients);
  });
}

export function getInviteLink(token: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/team?join=${token}`;
}
