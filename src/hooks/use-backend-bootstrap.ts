import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { mapApiProject, type ApiProject, type ApiWorkspace } from '@/lib/backend-sync';
import { applyDemoLocalSeed } from '@/lib/demo-local-seed';
import { useWhiteboardStore } from '@/stores/whiteboard-store';
import {
  fetchProjectRoadmap,
  fetchWorkspaceClients,
  fetchWorkspaceDocs,
  fetchWorkspaceNotifications,
  fetchWorkspaceTasks,
  fetchWorkspaceWhiteboards,
} from '@/lib/server-persist';
import { readScopedItem, writeScopedItem } from '@/lib/storage-scope';
import { useAuthStore } from '@/stores/auth-store';
import { useProjectsStore } from '@/stores/projects-store';
import { useDocsStore } from '@/stores/docs-store';
import { useClientsStore } from '@/stores/clients-store';
import { useTasksStore } from '@/stores/tasks/tasks-store';
import { useNotificationsStore } from '@/stores/notifications-store';
import { useRoadmapStore } from '@/stores/roadmap-store';

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
  const setWhiteboards = useWhiteboardStore((s) => s.setFromServer);
  const setTasks = useTasksStore((s) => s.setFromServer);
  const setNotifications = useNotificationsStore((s) => s.setFromServer);
  const setRoadmap = useRoadmapStore((s) => s.setFromServer);
  const userEmail = useAuthStore((s) => s.user?.email);

  const enabled = !isGuest && !!accessToken;

  const workspacesQuery = useQuery({
    queryKey: ['workspaces', userId],
    queryFn: () => api<ApiWorkspace[]>('/workspaces'),
    enabled,
    staleTime: 60_000,
  });

  useEffect(() => {
    const list = workspacesQuery.data;
    if (!list?.length) return;
    if (workspaceId && list.some((w) => w.id === workspaceId)) return;
    setWorkspaceId(list[0]!.id);
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

  const whiteboardsQuery = useQuery({
    queryKey: ['whiteboards', userId, activeWorkspaceId],
    queryFn: () => fetchWorkspaceWhiteboards(activeWorkspaceId!),
    enabled: enabled && !!activeWorkspaceId,
    staleTime: 30_000,
  });

  const notificationsQuery = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => fetchWorkspaceNotifications(),
    enabled,
    staleTime: 30_000,
  });

  const projectIds = projectsQuery.data?.map((p) => p.id) ?? [];

  const tasksQuery = useQuery({
    queryKey: ['tasks', userId, activeWorkspaceId, projectIds.join(',')],
    queryFn: () => fetchWorkspaceTasks(projectIds),
    enabled: enabled && projectIds.length > 0,
    staleTime: 30_000,
  });

  const roadmapQuery = useQuery({
    queryKey: ['roadmap', userId, projectIds.join(',')],
    queryFn: async () => {
      const rows = await Promise.all(projectIds.map((id) => fetchProjectRoadmap(id)));
      return projectIds.map((projectId, i) => ({ projectId, milestones: rows[i]! }));
    },
    enabled: enabled && projectIds.length > 0,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!projectsQuery.data) return;
    const links = loadLocalLinks();
    const mapped = projectsQuery.data.map((p) => mapApiProject(p, links[p.id] ?? {}));
    setProjects(mapped);
    applyDemoLocalSeed(mapped, userEmail);
  }, [projectsQuery.data, setProjects, userEmail]);

  useEffect(() => {
    if (!tasksQuery.data || projectIds.length === 0) return;
    setTasks(projectIds, tasksQuery.data);
  }, [tasksQuery.data, projectIds, setTasks]);

  useEffect(() => {
    if (!docsQuery.data) return;
    setDocs(docsQuery.data.docs, docsQuery.data.folders);
  }, [docsQuery.data, setDocs]);

  useEffect(() => {
    if (!clientsQuery.data) return;
    setClients(clientsQuery.data);
  }, [clientsQuery.data, setClients]);

  useEffect(() => {
    if (!whiteboardsQuery.data) return;
    setWhiteboards(whiteboardsQuery.data);
  }, [whiteboardsQuery.data, setWhiteboards]);

  useEffect(() => {
    if (!notificationsQuery.data) return;
    setNotifications(notificationsQuery.data);
  }, [notificationsQuery.data, setNotifications]);

  useEffect(() => {
    if (!roadmapQuery.data) return;
    for (const row of roadmapQuery.data) {
      setRoadmap(row.projectId, row.milestones);
    }
  }, [roadmapQuery.data, setRoadmap]);

  return {
    isBootstrapping:
      enabled &&
      (workspacesQuery.isLoading ||
        (!!activeWorkspaceId && projectsQuery.isLoading) ||
        (!!activeWorkspaceId && docsQuery.isLoading) ||
        (!!activeWorkspaceId && clientsQuery.isLoading) ||
        (!!activeWorkspaceId && whiteboardsQuery.isLoading) ||
        notificationsQuery.isLoading ||
        (projectIds.length > 0 && tasksQuery.isLoading) ||
        (projectIds.length > 0 && roadmapQuery.isLoading)),
    workspaceId: activeWorkspaceId,
    refetchProjects: projectsQuery.refetch,
  };
}
