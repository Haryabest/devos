import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DocsWorkspace } from '@/features/docs/components/docs-workspace';
import * as Icons from '@/components/ui/icons';
import { useProjectsStore } from '@/stores/projects-store';

export function ProjectDocsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const project = useProjectsStore((s) => s.projects.find((p) => p.id === projectId));

  if (!project) {
    return (
      <div className="w-full px-6 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Проект не найден</CardTitle>
            <CardDescription>Возможно, он был удалён.</CardDescription>
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

  return (
    <DocsWorkspace
      projectId={project.id}
      backTo={`/projects/${project.id}`}
      backLabel={project.name}
    />
  );
}
