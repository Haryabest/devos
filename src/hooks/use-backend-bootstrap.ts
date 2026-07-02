import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { mapApiProject, type ApiProject, type ApiWorkspace } from '@/lib/backend-sync';
import {
  fetchWorkspaceClients,
  fetchWorkspaceDocs,
} from '@/lib/server-persist';
import { readScopedItem, writeScopedItem } from '@/lib/storage-scope';
import { useAuthStore } from '@/stores/auth-store';
import { useProjectsStore } from '@/stores/projects-store';
import { useDocsStore } from '@/stores/docs-store';
import { useClientsStore } from '@/stores/clients-store';

const LINKS_KEY = 'devos:project-links';

function loadLocalLinks(): Record<string, { figma?: string; git?: string }> {
  try {
    return JSON.parse(readScopedItem(LINKS_KEY) ?? '{}') as Record<
      string,
      { figma?: string; git?: string }
    >;
  } catch {
    return {};
  }
}

export function saveProjectLinks(projectId: string, links: { figma?: string; git?: string }) {
  const all = loadLocalLinks();
  all[projectId] = links;
  writeScopedItem(LINKS_KEY, JSON.stringify(all));
}

export function useBackendBootstrap() {
  const isGuest = useAuthStore((s) => s.isGuest);
  const userId = useAuthStore((s) => s.user?.id);
  const accessToken = useAuthStore((s) => s.accessToken);
  const workspaceId = useAuthStore((s) => s.workspaceId);
  const setWorkspaceId = useAuthStore((s) => s.setWorkspaceId);
  const setProjects = useProjectsStore((s) => s.setFromServer);
  const setDocs = useDocsStore((s) => s.setFromServer);
  const setClients = useClientsStore((s) => s.setFromServer);

  const enabled = !isGuest && !!accessToken;

  const workspacesQuery = useQuery({
    queryKey: ['workspaces', userId],
    queryFn: () => api<ApiWorkspace[]>('/workspaces'),
    enabled,
    staleTime: 60_000,
  });

  useEffect(() => {
    const first = workspacesQuery.data?.[0];
    if (first && !workspaceId) setWorkspaceId(first.id);
  }, [workspacesQuery.data, workspaceId, setWorkspaceId]);

  const activeWorkspaceId = workspaceId ?? workspacesQuery.data?.[0]?.id;

  const projectsQuery = useQuery({
    queryKey: ['projects', userId, activeWorkspaceId],
    queryFn: () =>
      api<ApiProject[]>(`/projects?workspaceId=${encodeURIComponent(activeWorkspaceId!)}`),
    enabled: enabled && !!activeWorkspaceId,
    staleTime: 30_000,
  });

  const docsQuery = useQuery({
    queryKey: ['documents', userId, activeWorkspaceId],
    queryFn: () => fetchWorkspaceDocs(activeWorkspaceId!),
    enabled: enabled && !!activeWorkspaceId,
    staleTime: 30_000,
  });

  const clientsQuery = useQuery({
    queryKey: ['clients', userId, activeWorkspaceId],
    queryFn: () => fetchWorkspaceClients(activeWorkspaceId!),
    enabled: enabled && !!activeWorkspaceId,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!projectsQuery.data) return;
    const links = loadLocalLinks();
    setProjects(
      projectsQuery.data.map((p) => mapApiProject(p, links[p.id] ?? {})),
    );
  }, [projectsQuery.data, setProjects]);

  useEffect(() => {
    if (!docsQuery.data) return;
    setDocs(docsQuery.data.docs, docsQuery.data.folders);
  }, [docsQuery.data, setDocs]);

  useEffect(() => {
    if (!clientsQuery.data) return;
    setClients(clientsQuery.data);
  }, [clientsQuery.data, setClients]);

  return {
    isBootstrapping:
      enabled &&
      (workspacesQuery.isLoading ||
        (!!activeWorkspaceId && projectsQuery.isLoading) ||
        (!!activeWorkspaceId && docsQuery.isLoading) ||
        (!!activeWorkspaceId && clientsQuery.isLoading)),
    workspaceId: activeWorkspaceId,
    refetchProjects: projectsQuery.refetch,
  };
}
