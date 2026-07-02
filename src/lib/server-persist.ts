import { api } from '@/lib/api';
import type { Client, Doc, DocFolder, DocFormat, DocRevision } from '@/shared/types';
import type { Attachment } from '@/shared/types';
import { useAuthStore } from '@/stores/auth-store';

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
