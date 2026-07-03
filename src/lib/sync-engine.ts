/**
 * Real-time синхронизация: WebSocket (backend) + BroadcastChannel + localStorage bus.
 */

import { useAuthStore } from '@/stores/auth-store';
import { useProjectsStore } from '@/stores/projects-store';
import { useTasksStore } from '@/stores/tasks-store';
import { useDocsStore } from '@/stores/docs-store';
import { useApiStore } from '@/stores/api-store';
import { useGroupsStore } from '@/stores/groups-store';
import { useTeamStore } from '@/stores/team-store';
import { useClientsStore } from '@/stores/clients-store';
import { buildInviteLink } from '@/lib/invite-link';
import {
  connectCollabWs,
  isCollabWsConnected,
  pushCollabWs,
  reconnectCollabWs,
  requestCollabWsSync,
  subscribeCollabWsStatus,
} from '@/lib/collab-ws';
import {
  mergeDocs,
  mergeEndpoints,
  mergeProjects,
  mergeTasksPayload,
  scopeDocs,
  scopeEndpoints,
  scopeProjects,
  scopeTasksPayload,
} from '@/lib/sync-payload';
import type { SyncMessage, SyncStoreName } from '@/lib/sync-types';
import type { TeamInvite } from '@/shared/types';

export type { SyncMessage, SyncStoreName } from '@/lib/sync-types';

type SyncListener = (connected: boolean) => void;

const CHANNEL_NAME = 'devos-collab-v1';
const SYNC_BUS_KEY = 'devos:sync-bus';
const CLIENT_ID =
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

let channel: BroadcastChannel | null = null;
let applyingRemote = false;
let syncListeners: SyncListener[] = [];
let localSyncLive = false;
const debounceTimers: Partial<Record<SyncStoreName, ReturnType<typeof setTimeout>>> = {};

function getSenderId(): string {
  return useAuthStore.getState().user?.id ?? 'anon';
}

function getSenderName(): string {
  return useAuthStore.getState().user?.name ?? 'Аноним';
}

function buildPayload(store: SyncStoreName): unknown {
  switch (store) {
    case 'projects':
      return scopeProjects(useProjectsStore.getState().projects);
    case 'tasks':
      return scopeTasksPayload({
        tasks: useTasksStore.getState().tasks,
        columns: useTasksStore.getState().columns,
      });
    case 'docs':
      return scopeDocs(useDocsStore.getState().docs);
    case 'api':
      return scopeEndpoints(useApiStore.getState().endpoints);
    case 'groups':
      return useGroupsStore.getState().groups;
    case 'team':
      return {
        members: useTeamStore.getState().members,
        invites: useTeamStore.getState().invites,
        syncRooms: useTeamStore.getState().syncRooms,
      };
    case 'clients':
      return useClientsStore.getState().clients;
  }
}

function notifyListeners() {
  const connected = isCollabWsConnected() || localSyncLive;
  syncListeners.forEach((fn) => fn(connected));
}

function broadcast(store: SyncStoreName, payload: unknown) {
  if (applyingRemote) return;

  const msg: SyncMessage = {
    clientId: CLIENT_ID,
    senderId: getSenderId(),
    senderName: getSenderName(),
    store,
    payload,
    ts: Date.now(),
  };

  channel?.postMessage(msg);
  pushCollabWs(msg);

  try {
    localStorage.setItem(SYNC_BUS_KEY, JSON.stringify(msg));
  } catch {
    /* quota */
  }
}

function debouncedBroadcast(store: SyncStoreName, delay = 150) {
  if (debounceTimers[store]) clearTimeout(debounceTimers[store]!);
  debounceTimers[store] = setTimeout(() => {
    broadcast(store, buildPayload(store));
    debounceTimers[store] = undefined;
  }, delay);
}

function applyRemote(msg: SyncMessage) {
  if (msg.clientId === CLIENT_ID) return;

  applyingRemote = true;
  try {
    switch (msg.store) {
      case 'projects': {
        const incoming = msg.payload as import('@/shared/types').Project[];
        useProjectsStore.setState((s) => ({
          projects: mergeProjects(s.projects, incoming),
        }));
        break;
      }
      case 'tasks': {
        const incoming = msg.payload as {
          tasks: import('@/shared/types').Task[];
          columns: import('@/shared/types').TaskColumn[];
        };
        useTasksStore.setState((s) => mergeTasksPayload(s, incoming));
        break;
      }
      case 'docs':
        useDocsStore.setState((s) => ({
          docs: mergeDocs(s.docs, msg.payload as import('@/shared/types').Doc[]),
        }));
        break;
      case 'api':
        useApiStore.setState((s) => ({
          endpoints: mergeEndpoints(
            s.endpoints,
            msg.payload as import('@/shared/types').ApiEndpoint[],
          ),
        }));
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

function onStorageBus(e: StorageEvent) {
  if (e.key !== SYNC_BUS_KEY || !e.newValue) return;
  try {
    applyRemote(JSON.parse(e.newValue) as SyncMessage);
  } catch {
    /* ignore */
  }
}

export function subscribeSyncStatus(fn: SyncListener): () => void {
  syncListeners.push(fn);
  fn(isCollabWsConnected() || localSyncLive);
  return () => {
    syncListeners = syncListeners.filter((l) => l !== fn);
  };
}

export function requestCollaborationSync() {
  requestCollabWsSync();

  const stores: SyncStoreName[] = ['projects', 'tasks', 'docs', 'api', 'team'];
  if (useTeamStore.getState().syncRooms.length === 0) {
    stores.push('groups', 'clients');
  }
  stores.forEach((store) => broadcast(store, buildPayload(store)));
}

export function initCollaborationSync() {
  if (typeof window === 'undefined' || channel) return;

  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (ev) => applyRemote(ev.data as SyncMessage);
    localSyncLive = true;
    notifyListeners();
  }

  window.addEventListener('storage', onStorageBus);

  connectCollabWs(CLIENT_ID, applyRemote, () => requestCollaborationSync());
  subscribeCollabWsStatus(() => notifyListeners());

  useAuthStore.subscribe((state, prev) => {
    if (state.accessToken !== prev.accessToken) reconnectCollabWs();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') requestCollaborationSync();
  });

  useProjectsStore.subscribe((state, prev) => {
    if (applyingRemote || state.projects === prev.projects) return;
    debouncedBroadcast('projects');
  });

  useTasksStore.subscribe((state, prev) => {
    if (applyingRemote || (state.tasks === prev.tasks && state.columns === prev.columns)) return;
    debouncedBroadcast('tasks');
  });

  useDocsStore.subscribe((state, prev) => {
    if (applyingRemote || state.docs === prev.docs) return;
    debouncedBroadcast('docs');
  });

  useApiStore.subscribe((state, prev) => {
    if (applyingRemote || state.endpoints === prev.endpoints) return;
    debouncedBroadcast('api');
  });

  useGroupsStore.subscribe((state, prev) => {
    if (applyingRemote || state.groups === prev.groups) return;
    debouncedBroadcast('groups');
  });

  useTeamStore.subscribe((state, prev) => {
    if (
      applyingRemote ||
      (state.members === prev.members &&
        state.invites === prev.invites &&
        state.syncRooms === prev.syncRooms)
    )
      return;
    debouncedBroadcast('team');
  });

  useClientsStore.subscribe((state, prev) => {
    if (applyingRemote || state.clients === prev.clients) return;
    debouncedBroadcast('clients');
  });
}

export function getInviteLink(invite: TeamInvite): string {
  return buildInviteLink(invite);
}
