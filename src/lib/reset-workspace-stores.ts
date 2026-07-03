import { queryClient } from '@/lib/query-client';
import { getStorageScope } from '@/lib/storage-scope';
import { useApiStore } from '@/stores/api-store';
import { useClientsStore } from '@/stores/clients-store';
import { useDocsStore } from '@/stores/docs-store';
import { useFigmaStore } from '@/stores/figma-store';
import { useGitStore } from '@/stores/git-store';
import { useGroupsStore } from '@/stores/groups-store';
import { useProjectsStore } from '@/stores/projects-store';
import { useRoadmapStore } from '@/stores/roadmap-store';
import { useSettingsStore } from '@/stores/settings-store';
import { useTasksStore } from '@/stores/tasks-store';
import { useTeamStore } from '@/stores/team-store';
import { useNotificationsStore } from '@/stores/notifications-store';
import { useAuditStore } from '@/stores/audit-store';
import { useWhiteboardStore } from '@/stores/whiteboard-store';
import { useIntegrationsStore } from '@/stores/integrations-store';
import { useWhiteboardVersionsStore } from '@/stores/whiteboard-versions-store';
import { useAutomationStore } from '@/stores/automation-store';
import { useProjectTemplatesStore } from '@/stores/project-templates-store';

const workspacePersistStores = [
  useProjectsStore,
  useDocsStore,
  useClientsStore,
  useTasksStore,
  useGroupsStore,
  useApiStore,
  useRoadmapStore,
  useTeamStore,
  useWhiteboardStore,
  useNotificationsStore,
  useAuditStore,
  useFigmaStore,
  useGitStore,
  useSettingsStore,
  useAutomationStore,
  useProjectTemplatesStore,
  useIntegrationsStore,
  useWhiteboardVersionsStore,
] as const;

let hydratedScope: string | null = null;

export function resetHydratedScope() {
  hydratedScope = null;
}

export function resetWorkspaceStoresInMemory() {
  useProjectsStore.setState({ projects: [] });
  useDocsStore.setState({ docs: [], folders: [] });
  useClientsStore.setState({ clients: [] });
  useTasksStore.setState({ columns: [], tasks: [] });
  useGroupsStore.setState({ groups: [] });
  useApiStore.setState({ endpoints: [] });
  useRoadmapStore.setState({ columns: [], cards: [] });
  useTeamStore.setState({ members: [], invites: [], syncRooms: [] });
  useWhiteboardStore.setState({ boards: [] });
  useAutomationStore.setState({ rules: useAutomationStore.getState().rules });
  useProjectTemplatesStore.setState({ custom: [] });
  useNotificationsStore.setState({ items: [] });
  useAuditStore.setState({ entries: [] });
  useFigmaStore.setState({ cache: {} });
  useGitStore.setState({ cache: {} });
  useSettingsStore.setState({
    workspaceName: 'Мой воркспейс',
    theme: 'system',
    aiUseDocs: true,
    aiUseTasks: true,
    aiUseGit: true,
    aiUseFigma: true,
    openAiApiKey: '',
    autosaveDelayMs: 3000,
    webhooks: [],
  });
}

export async function rehydrateWorkspaceStores() {
  await Promise.all(workspacePersistStores.map((store) => store.persist.rehydrate()));
}

export async function ensureWorkspaceHydrated() {
  const scope = getStorageScope();
  if (hydratedScope === scope) return;
  await rehydrateWorkspaceStores();
  hydratedScope = scope;
}

export async function switchWorkspaceStorageScope() {
  resetWorkspaceStoresInMemory();
  resetHydratedScope();
  await ensureWorkspaceHydrated();
  queryClient.clear();
}

export async function resetWorkspaceOnLogout() {
  resetWorkspaceStoresInMemory();
  resetHydratedScope();
  queryClient.clear();
}
