import { api } from '@/lib/api';
import type { Client, Doc, DocFolder, DocFormat, DocRevision } from '@/shared/types';
import type { Attachment, RoadmapCard, Task } from '@/shared/types';
import type { Role } from '@/shared/types';
import { mapApiTask, mapTaskToApi, type ApiTask } from '@/lib/backend-sync';
import { useAuthStore } from '@/stores/auth-store';
import type { AppNotification } from '@/stores/notifications-store';

export interface ApiDoc {
  id: string;
  projectId: string | null;
  folderId: string | null;
  title: string;
  format?: DocFormat;
  content?: string;
  fileData?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  tags?: string[];
  version?: number;
  attachments?: Attachment[];
  history?: DocRevision[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiDocFolder {
  id: string;
  projectId: string | null;
  parentId: string | null;
  name: string;
  createdAt: string;
}

export interface ApiClient {
  id: string;
  name: string;
  description: string;
  email: string;
  phone: string;
  contacts: Client['contacts'];
  contracts: Client['contracts'];
  files: Client['files'];
  notes: string;
  createdAt: string;
}

function workspaceId(): string | null {
  return useAuthStore.getState().workspaceId;
}

export function isServerSyncEnabled(): boolean {
  const { isGuest, accessToken, workspaceId: ws } = useAuthStore.getState();
  return !isGuest && !!accessToken && !!ws;
}

export function mapApiDoc(d: ApiDoc): Doc {
  return {
    id: d.id,
    projectId: d.projectId ?? '',
    folderId: d.folderId ?? null,
    title: d.title,
    format: d.format ?? 'page',
    content: d.content ?? '',
    fileData: d.fileData ?? null,
    fileName: d.fileName ?? null,
    mimeType: d.mimeType ?? null,
    tags: d.tags ?? [],
    version: d.version ?? 1,
    history: d.history ?? [],
    attachments: d.attachments ?? [],
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

export function mapApiFolder(f: ApiDocFolder): DocFolder {
  return {
    id: f.id,
    projectId: f.projectId ?? '',
    parentId: f.parentId ?? null,
    name: f.name,
    createdAt: f.createdAt,
  };
}

export function mapApiClient(c: ApiClient): Client {
  return {
    id: c.id,
    name: c.name,
    description: c.description ?? '',
    email: c.email ?? '',
    phone: c.phone ?? '',
    contacts: c.contacts ?? [],
    contracts: c.contracts ?? [],
    files: c.files ?? [],
    notes: c.notes ?? '',
    createdAt: c.createdAt,
  };
}

function docPayload(doc: Doc) {
  return {
    format: doc.format,
    content: doc.content,
    fileData: doc.fileData,
    fileName: doc.fileName,
    mimeType: doc.mimeType,
    attachments: doc.attachments,
    history: doc.history,
  };
}

export async function fetchWorkspaceDocs(wsId: string) {
  const [docs, folders] = await Promise.all([
    api<ApiDoc[]>(`/documents?workspaceId=${encodeURIComponent(wsId)}`),
    api<ApiDocFolder[]>(`/document-folders?workspaceId=${encodeURIComponent(wsId)}`),
  ]);
  return {
    docs: docs.filter((d) => d.projectId).map(mapApiDoc),
    folders: folders.filter((f) => f.projectId).map(mapApiFolder),
  };
}

export async function fetchWorkspaceClients(wsId: string) {
  const clients = await api<ApiClient[]>(`/clients?workspaceId=${encodeURIComponent(wsId)}`);
  return clients.map(mapApiClient);
}

export async function persistDocCreate(doc: Doc): Promise<Doc | null> {
  const wsId = workspaceId();
  if (!wsId || !doc.projectId) return null;
  const saved = await api<ApiDoc>(`/documents?workspaceId=${encodeURIComponent(wsId)}`, {
    method: 'POST',
    body: JSON.stringify({
      projectId: doc.projectId,
      folderId: doc.folderId,
      title: doc.title,
      tags: doc.tags,
      payload: docPayload(doc),
    }),
  });
  return mapApiDoc(saved);
}

export async function persistDocUpdate(doc: Doc): Promise<void> {
  await api<ApiDoc>(`/documents/${doc.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      projectId: doc.projectId,
      folderId: doc.folderId,
      title: doc.title,
      tags: doc.tags,
      payload: docPayload(doc),
    }),
  });
}

export async function persistDocRemove(id: string): Promise<void> {
  await api<void>(`/documents/${id}`, { method: 'DELETE' });
}

export async function persistFolderCreate(folder: DocFolder): Promise<DocFolder | null> {
  const wsId = workspaceId();
  if (!wsId || !folder.projectId) return null;
  const saved = await api<ApiDocFolder>(`/document-folders?workspaceId=${encodeURIComponent(wsId)}`, {
    method: 'POST',
    body: JSON.stringify({
      projectId: folder.projectId,
      parentId: folder.parentId,
      name: folder.name,
    }),
  });
  return mapApiFolder(saved);
}

export async function persistFolderUpdate(folder: DocFolder): Promise<void> {
  await api<ApiDocFolder>(`/document-folders/${folder.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      projectId: folder.projectId,
      parentId: folder.parentId,
      name: folder.name,
    }),
  });
}

export async function persistFolderRemove(id: string): Promise<void> {
  await api<void>(`/document-folders/${id}`, { method: 'DELETE' });
}

export async function persistClientCreate(client: Client): Promise<Client | null> {
  const wsId = workspaceId();
  if (!wsId) return null;
  const saved = await api<ApiClient>(`/clients?workspaceId=${encodeURIComponent(wsId)}`, {
    method: 'POST',
    body: JSON.stringify({
      name: client.name,
      description: client.description,
      email: client.email,
      phone: client.phone,
      contactList: client.contacts,
      contracts: client.contracts,
      files: client.files,
      notes: client.notes,
    }),
  });
  return mapApiClient(saved);
}

export async function persistClientUpdate(client: Client): Promise<void> {
  await api<ApiClient>(`/clients/${client.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: client.name,
      description: client.description,
      email: client.email,
      phone: client.phone,
      contactList: client.contacts,
      contracts: client.contracts,
      files: client.files,
      notes: client.notes,
    }),
  });
}

export async function persistClientRemove(id: string): Promise<void> {
  await api<void>(`/clients/${id}`, { method: 'DELETE' });
}

export interface ApiWhiteboard {
  projectId: string;
  content: Record<string, unknown>;
  updatedAt: string;
}

const whiteboardTimers = new Map<string, ReturnType<typeof setTimeout>>();

export async function fetchWorkspaceWhiteboards(wsId: string) {
  const rows = await api<ApiWhiteboard[]>(`/whiteboards?workspaceId=${encodeURIComponent(wsId)}`);
  return rows.map((row) => ({
    projectId: row.projectId,
    ...(row.content as object),
  })) as import('@/shared/types/whiteboard').WhiteboardData[];
}

export async function fetchWorkspaceTasks(projectIds: string[]) {
  if (projectIds.length === 0) return [];
  const rows = await Promise.all(projectIds.map((id) => api<ApiTask[]>(`/projects/${id}/tasks`)));
  return rows.flat();
}

export async function persistTaskCreate(projectId: string, task: Task): Promise<Task | null> {
  const saved = await api<ApiTask>(`/projects/${projectId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(mapTaskToApi(task)),
  });
  if (task.order > 0 || task.status !== saved.status) {
    await persistTaskReorder(projectId, [{ id: saved.id, order: task.order, status: task.status }]);
  }
  return mapApiTask({ ...saved, order: task.order, status: task.status }, task.columnId);
}

export async function persistTaskUpdate(task: Task): Promise<void> {
  await api<ApiTask>(`/tasks/${task.id}`, {
    method: 'PATCH',
    body: JSON.stringify(mapTaskToApi(task)),
  });
}

export async function persistTaskRemove(id: string): Promise<void> {
  await api<void>(`/tasks/${id}`, { method: 'DELETE' });
}

export async function persistTaskComment(taskId: string, body: string): Promise<void> {
  await api(`/tasks/${taskId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

export async function persistTaskDependencyAdd(taskId: string, toId: string): Promise<void> {
  await api(`/tasks/${taskId}/dependencies`, {
    method: 'POST',
    body: JSON.stringify({ toId }),
  });
}

export async function persistTaskDependencyRemove(taskId: string, toId: string): Promise<void> {
  await api<void>(`/tasks/${taskId}/dependencies/${toId}`, { method: 'DELETE' });
}

export async function persistTaskReorder(
  projectId: string,
  items: { id: string; order: number; status: import('@/shared/types').TaskStatus }[],
): Promise<void> {
  await api(`/projects/${projectId}/tasks/reorder`, {
    method: 'PATCH',
    body: JSON.stringify({ items }),
  });
}

export interface ApiNotification {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
}

function mapApiNotification(n: ApiNotification): AppNotification {
  const data = n.data ?? {};
  const projectId = typeof data.projectId === 'string' ? data.projectId : undefined;
  const taskId = typeof data.taskId === 'string' ? data.taskId : undefined;
  const href =
    taskId && projectId
      ? `/projects/${projectId}/tasks/${taskId}`
      : projectId
        ? `/projects/${projectId}`
        : undefined;
  const kind = (['invite', 'deadline', 'mention', 'sync', 'info'] as const).includes(
    n.kind as AppNotification['kind'],
  )
    ? (n.kind as AppNotification['kind'])
    : 'info';
  return {
    id: n.id,
    kind,
    title: n.title,
    body: n.body ?? '',
    href,
    read: n.read,
    createdAt: n.createdAt,
  };
}

export async function fetchWorkspaceNotifications(): Promise<AppNotification[]> {
  const rows = await api<ApiNotification[]>('/notifications');
  return rows.map(mapApiNotification);
}

export async function persistNotificationRead(id: string): Promise<void> {
  await api(`/notifications/${id}/read`, { method: 'PATCH' });
}

export interface ApiMilestone {
  id: string;
  projectId: string;
  name: string;
  version: string | null;
  dueAt: string | null;
  releasedAt: string | null;
}

export async function fetchProjectRoadmap(projectId: string): Promise<ApiMilestone[]> {
  return api<ApiMilestone[]>(`/projects/${projectId}/milestones`);
}

export async function persistRoadmapCardCreate(
  projectId: string,
  card: RoadmapCard,
): Promise<ApiMilestone | null> {
  return api<ApiMilestone>(`/projects/${projectId}/milestones`, {
    method: 'POST',
    body: JSON.stringify({
      name: card.title,
      version: card.description || undefined,
    }),
  });
}

export async function persistRoadmapCardUpdate(card: RoadmapCard, released: boolean): Promise<void> {
  await api<ApiMilestone>(`/projects/${card.projectId}/milestones/${card.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: card.title,
      version: card.description || undefined,
      releasedAt: released ? new Date().toISOString() : null,
    }),
  });
}

export async function persistRoadmapCardRemove(projectId: string, id: string): Promise<void> {
  await api<void>(`/projects/${projectId}/milestones/${id}`, { method: 'DELETE' });
}

export interface ApiWorkspaceMember {
  id: string;
  userId: string;
  role: Role;
  joinedAt: string | null;
  user: { id: string; email: string; name: string; avatarUrl: string | null };
}

export async function fetchWorkspaceMembers(wsId: string): Promise<ApiWorkspaceMember[]> {
  const ws = await api<{
    members: Array<{
      id: string;
      userId: string;
      role: string;
      invitedAt: string;
      joinedAt: string | null;
      user: { id: string; email: string; name: string; avatarUrl: string | null };
    }>;
  }>(`/workspaces/${wsId}`);
  return ws.members.map((m) => ({
    id: m.id,
    userId: m.userId,
    role: m.role as Role,
    joinedAt: m.joinedAt ?? m.invitedAt,
    user: m.user,
  }));
}

export interface ApiIntegration {
  id: string;
  provider: 'GITHUB' | 'GITLAB' | 'FIGMA';
  externalId: string | null;
  scopes: string[];
  connected: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getIntegrations(wsId: string): Promise<ApiIntegration[]> {
  return api<ApiIntegration[]>(`/integrations?workspaceId=${encodeURIComponent(wsId)}`);
}

export async function connectIntegrationOAuthUrl(
  provider: string,
  wsId: string,
): Promise<string> {
  const res = await api<{ url: string }>(
    `/integrations/${provider.toLowerCase()}/connect?workspaceId=${encodeURIComponent(wsId)}`,
  );
  return res.url;
}

export async function disconnectIntegration(provider: string, wsId: string): Promise<void> {
  await api<void>(`/integrations/${provider.toLowerCase()}?workspaceId=${encodeURIComponent(wsId)}`, {
    method: 'DELETE',
  });
}

export async function persistWhiteboard(board: import('@/shared/types/whiteboard').WhiteboardData): Promise<void> {
  if (!board.projectId) return;
  const { projectId, ...content } = board;
  await api<ApiWhiteboard>(`/whiteboards/project/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify({ content: { projectId, ...content } }),
  });
}

export function persistWhiteboardDebounced(board: import('@/shared/types/whiteboard').WhiteboardData, delay = 800) {
  if (!isServerSyncEnabled()) return;
  const existing = whiteboardTimers.get(board.projectId);
  if (existing) clearTimeout(existing);
  whiteboardTimers.set(
    board.projectId,
    setTimeout(() => {
      whiteboardTimers.delete(board.projectId);
      void persistWhiteboard(board).catch(() => undefined);
    }, delay),
  );
}
