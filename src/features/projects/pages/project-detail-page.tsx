import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BreadcrumbBack } from '@/components/layout/breadcrumb-back';
import * as Icons from '@/components/ui/icons';
import { useWhiteboardStore } from '@/stores/whiteboard-store';
import { useProjectsStore } from '@/stores/projects-store';
import { useTasksStore } from '@/stores/tasks-store';
import { useDocsStore } from '@/stores/docs-store';
import { useApiStore } from '@/stores/api-store';
import { ProjectShareDialog } from '@/features/projects/components/project-share-dialog';
import { ProjectDetailHeader } from '@/features/projects/components/project-detail-header';
import { ProjectFigmaCard } from '@/features/projects/components/project-figma-card';
import { ProjectModulesSection } from '@/features/projects/components/project-modules-section';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { ProjectDeadlinesCard } from '@/features/projects/components/project-deadlines-card';
import { ProjectGitDashboard } from '@/features/projects/components/project-git-dashboard';
import { ProjectIntegrationsPanel } from '@/features/projects/components/project-integrations-panel';
import { AiAssistantPanel } from '@/components/ai/ai-assistant-panel';
import { useAuthStore } from '@/stores/auth-store';

export function ProjectDetailPage() {
  const workspaceId = useAuthStore((s) => s.workspaceId);
  const { projectId } = useParams();
  const navigate = useNavigate();
  const project = useProjectsStore((s) => s.projects.find((p) => p.id === projectId));
  const update = useProjectsStore((s) => s.update);
  const remove = useProjectsStore((s) => s.remove);
  const taskCount = useTasksStore((s) => s.tasks.filter((t) => t.projectId === projectId).length);
  const docCount = useDocsStore((s) => s.docs.filter((d) => d.projectId === projectId).length);
  const apiCount = useApiStore((s) => s.endpoints.filter((e) => e.projectId === projectId).length);
  const noteCount = useWhiteboardStore((s) => s.getBoard(projectId!).notes.length);

  const [shareOpen, setShareOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!project) {
    return (
      <div className="w-full max-w-4xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Проект не найден</CardTitle>
            <CardDescription>Возможно, он был удалён или ссылка устарела.</CardDescription>
          </CardHeader>
          <CardContent>
            <BreadcrumbBack label="Проекты" to="/projects" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const modules = [
    { label: 'Задачи', count: taskCount, icon: Icons.Layers, to: `/projects/${project.id}/tasks` },
    { label: 'Roadmap', count: 0, icon: Icons.LayoutGrid, to: `/projects/${project.id}/roadmap` },
    { label: 'Доска', count: noteCount, icon: Icons.StickyNote, to: `/projects/${project.id}/whiteboard` },
    { label: 'Документация', count: docCount, icon: Icons.FileText, to: `/projects/${project.id}/docs` },
    { label: 'API', count: apiCount, icon: Icons.Plug, to: `/projects/${project.id}/api` },
  ];

  return (
    <div className="w-full space-y-6 p-6">
      <ProjectDetailHeader
        project={project}
        onBack={() => navigate('/projects')}
        onShare={() => setShareOpen(true)}
        onEdit={() => navigate(`/projects/${project.id}/edit`)}
        onDelete={() => setDeleteOpen(true)}
        onStatusChange={(status) => update(project.id, { status })}
      />

      <ProjectModulesSection modules={modules} className="lg:grid-cols-5" />

      {workspaceId && (
        <AiAssistantPanel
          context="project"
          workspaceId={workspaceId}
          projectId={project.id}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <ProjectDeadlinesCard project={project} />
        <ProjectGitDashboard
          projectId={project.id}
          gitUrl={project.links?.git}
          onSaveGitUrl={(git) =>
            update(project.id, { links: { ...project.links, git: git || undefined } })
          }
        />
      </div>

      <ProjectFigmaCard
        project={project}
        onAddFigma={(url) => update(project.id, { links: { ...project.links, figma: url } })}
      />

      <ProjectIntegrationsPanel
        project={project}
        onUpdateLinks={(links) => update(project.id, { links })}
      />

      <ProjectShareDialog project={project} open={shareOpen} onOpenChange={setShareOpen} />
      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Удалить проект?"
        description={`«${project.name}» и все задачи, документация и API будут удалены.`}
        onConfirm={() => {
          remove(project.id);
          navigate('/projects');
        }}
      />
    </div>
  );
}
