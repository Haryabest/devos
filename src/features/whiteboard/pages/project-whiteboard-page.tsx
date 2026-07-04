import { useParams } from 'react-router-dom';
import { BreadcrumbBack } from '@/components/layout/breadcrumb-back';
import { PageTopBar } from '@/components/layout/page-top-bar';
import { WhiteboardWorkspace } from '@/features/whiteboard/components/whiteboard-workspace';
import { WhiteboardVersionsBar } from '@/features/whiteboard/components/whiteboard-versions-bar';
import { useProjectsStore } from '@/stores/projects-store';
import { useAuthStore } from '@/stores/auth-store';

export function ProjectWhiteboardPage() {
  const workspaceId = useAuthStore((s) => s.workspaceId);
  const { projectId } = useParams();
  const project = useProjectsStore((s) => s.projects.find((p) => p.id === projectId));

  if (!project || !projectId) {
    return (
      <div className="p-6">
        <BreadcrumbBack label="Проекты" to="/projects" />
        <p className="mt-4 text-sm text-muted-foreground">Проект не найден.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <PageTopBar>
        <BreadcrumbBack label={project.name} to={`/projects/${project.id}`} />
        <div className="mt-2 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Доска</h1>
          <p className="text-sm text-muted-foreground">
            Схемы, стикеры, коллаб (курсоры, laser) — синхронизация с сервером.
          </p>
        </div>
      </PageTopBar>
      <div className="min-h-0 flex-1 px-6 pb-6">
        <WhiteboardVersionsBar projectId={projectId} />
        <WhiteboardWorkspace projectId={projectId} workspaceId={workspaceId} />
      </div>
    </div>
  );
}
