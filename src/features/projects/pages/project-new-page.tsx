import { useNavigate } from 'react-router-dom';
import { BreadcrumbBack } from '@/components/layout/breadcrumb-back';
import { PageContainer } from '@/components/layout/page-container';
import { ProjectForm } from '@/features/projects/components/project-form';

export function ProjectNewPage() {
  const navigate = useNavigate();

  return (
    <PageContainer>
      <BreadcrumbBack label="Проекты" to="/projects" className="mb-4" />
      <header className="mb-8 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Новый проект</h1>
        <p className="text-sm text-muted-foreground">
          Заполните основные данные — проект сохранится локально.
        </p>
      </header>
      <ProjectForm
        onCancel={() => navigate('/projects')}
        onSaved={(id) => navigate(`/projects/${id}`)}
      />
    </PageContainer>
  );
}
