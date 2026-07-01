import { useParams } from 'react-router-dom';
import { StubPage } from '@/components/stub-page';

export function ProjectDetailPage() {
  const { projectId } = useParams();
  return (
    <StubPage
      title={`Проект · ${projectId}`}
      description="Дашборд проекта, задачи, документация, AI-анализ, интеграции."
    />
  );
}
