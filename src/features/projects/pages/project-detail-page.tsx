import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import * as Icons from '@/components/ui/icons';
import { useProjectsStore } from '@/stores/projects-store';
import { useTasksStore } from '@/stores/tasks-store';
import { useDocsStore } from '@/stores/docs-store';
import { useApiStore } from '@/stores/api-store';
import { ProjectFormDialog } from '@/features/projects/components/project-form-dialog';
import { ProjectShareDialog } from '@/features/projects/components/project-share-dialog';
import { ProjectDetailHeader } from '@/features/projects/components/project-detail-header';
import { ProjectMetaSection } from '@/features/projects/components/project-meta-section';
import { ProjectFigmaCard } from '@/features/projects/components/project-figma-card';
import { ProjectModulesSection } from '@/features/projects/components/project-modules-section';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';

export function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const project = useProjectsStore((s) => s.projects.find((p) => p.id === projectId));
  const update = useProjectsStore((s) => s.update);
  const remove = useProjectsStore((s) => s.remove);
  const taskCount = useTasksStore((s) => s.tasks.filter((t) => t.projectId === projectId).length);
  const docCount = useDocsStore((s) => s.docs.filter((d) => d.projectId === projectId).length);
  const apiCount = useApiStore((s) => s.endpoints.filter((e) => e.projectId === projectId).length);

  const [editingLinks, setEditingLinks] = useState(false);
  const [figmaDraft, setFigmaDraft] = useState('');
  const [gitDraft, setGitDraft] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!project) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Проект не найден</CardTitle>
            <CardDescription>Возможно, он был удалён или ссылка устарела.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" onClick={() => navigate('/projects')} className="gap-2">
              <Icons.ArrowLeft className="h-4 w-4" />
              К проектам
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  function startEditLinks() {
    setFigmaDraft(project!.links?.figma ?? '');
    setGitDraft(project!.links?.git ?? '');
    setEditingLinks(true);
  }

  function saveLinks() {
    update(project!.id, {
      links: {
        figma: figmaDraft.trim() || undefined,
        git: gitDraft.trim() || undefined,
      },
    });
    setEditingLinks(false);
  }

  const modules = [
    { label: 'Задачи', count: taskCount, icon: Icons.Layers, to: `/projects/${project.id}/tasks` },
    { label: 'Документация', count: docCount, icon: Icons.FileText, to: `/projects/${project.id}/docs` },
    { label: 'API', count: apiCount, icon: Icons.Plug, to: `/projects/${project.id}/api` },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <ProjectDetailHeader
        project={project}
        onBack={() => navigate('/projects')}
        onShare={() => setShareOpen(true)}
        onEdit={() => setEditOpen(true)}
        onDelete={() => setDeleteOpen(true)}
      />

      <ProjectModulesSection modules={modules} />

      <ProjectMetaSection
        project={project}
        editingLinks={editingLinks}
        figmaDraft={figmaDraft}
        gitDraft={gitDraft}
        onStatusChange={(status) => update(project.id, { status })}
        onStartEditLinks={startEditLinks}
        onFigmaDraftChange={setFigmaDraft}
        onGitDraftChange={setGitDraft}
        onSaveLinks={saveLinks}
        onCancelEditLinks={() => setEditingLinks(false)}
      />

      <ProjectFigmaCard
        project={project}
        onAddFigma={(url) => update(project.id, { links: { ...project.links, figma: url } })}
        onEditLinks={startEditLinks}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.Sparkles className="h-4 w-4" />
            AI-анализ
          </CardTitle>
          <CardDescription>Понимание проекта целиком.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          AI использует документацию, задачи, Git и Figma этого проекта. Наполните модули — появится анализ.
        </CardContent>
      </Card>

      <ProjectFormDialog open={editOpen} onOpenChange={setEditOpen} project={project} />
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
