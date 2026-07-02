import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BreadcrumbBack } from '@/components/layout/breadcrumb-back';
import { PageContainer } from '@/components/layout/page-container';
import { ProjectForm } from '@/features/projects/components/project-form';
import { useProjectsStore } from '@/stores/projects-store';

export function ProjectEditPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const project = useProjectsStore((s) => s.projects.find((p) => p.id === projectId));

  if (!project) {
    return (
      <PageContainer variant="prose">
        <Card>
          <CardHeader>
            <CardTitle>Проект не найден</CardTitle>
            <CardDescription>Возможно, он был удалён.</CardDescription>
          </CardHeader>
          <CardContent>
            <BreadcrumbBack label="Проекты" to="/projects" />
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer variant="prose">
      <BreadcrumbBack label={project.name} to={`/projects/${project.id}`} className="mb-4" />
      <header className="mb-8 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Редактирование</h1>
        <p className="text-sm text-muted-foreground">Изменения сохранятся локально.</p>
      </header>
      <ProjectForm
        project={project}
        onCancel={() => navigate(`/projects/${project.id}`)}
        onSaved={() => navigate(`/projects/${project.id}`)}
      />
    </PageContainer>
  );
}
