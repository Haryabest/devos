import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { mapApiProject, mapProjectToApi, type ApiProject } from '@/lib/backend-sync';
import { saveProjectLinks } from '@/hooks/use-backend-bootstrap';
import { useAuthStore } from '@/stores/auth-store';
import { useProjectsStore, type NewProject } from '@/stores/projects-store';
import type { Project } from '@/shared/types';

export function useCreateProjectApi() {
  const workspaceId = useAuthStore((s) => s.workspaceId);
  const isGuest = useAuthStore((s) => s.isGuest);
  const addLocal = useProjectsStore((s) => s.add);

  return useMutation({
    mutationFn: async (input: NewProject) => {
      if (isGuest || !workspaceId) return addLocal(input);
      const created = await api<ApiProject>(
        `/projects?workspaceId=${encodeURIComponent(workspaceId)}`,
        { method: 'POST', body: JSON.stringify(mapProjectToApi(input)) },
      );
      if (input.links) saveProjectLinks(created.id, input.links);
      const mapped = mapApiProject(created, input.links ?? {});
      useProjectsStore.setState((s) => ({
        projects: [mapped, ...s.projects.filter((p) => p.id !== mapped.id)],
      }));
      return mapped;
    },
  });
}

export function useUpdateProjectApi() {
  const isGuest = useAuthStore((s) => s.isGuest);
  const updateLocal = useProjectsStore((s) => s.update);

  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Project> }) => {
      updateLocal(id, patch);
      if (patch.links) saveProjectLinks(id, patch.links);
      if (isGuest) return;
      await api<ApiProject>(`/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(mapProjectToApi(patch as NewProject)),
      });
    },
  });
}
