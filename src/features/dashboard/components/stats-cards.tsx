import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { HEALTH_COLOR } from '@/stores/projects-store';
import { HealthDot } from '@/features/dashboard/components/health-dot';

type StatsCardsProps = {
  activeProjectsCount: number;
  totalProjectsCount: number;
  openTasksCount: number;
  criticalTasksCount: number;
  healthCounts: { GREEN: number; YELLOW: number; RED: number };
};

export function StatsCards({
  activeProjectsCount,
  totalProjectsCount,
  openTasksCount,
  criticalTasksCount,
  healthCounts,
}: StatsCardsProps) {
  const navigate = useNavigate();

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Активные проекты</CardDescription>
          <CardTitle className="text-3xl tabular-nums">{activeProjectsCount}</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          Всего {totalProjectsCount} ·{' '}
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="text-primary hover:underline"
          >
            Открыть
          </button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Открытые задачи</CardDescription>
          <CardTitle className="text-3xl tabular-nums">{openTasksCount}</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {criticalTasksCount > 0
            ? `${criticalTasksCount} высокий / критичный приоритет`
            : 'Нет срочных задач'}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Здоровье проектов</CardDescription>
          <CardTitle className="flex items-center gap-2 text-lg">
            <HealthDot color={HEALTH_COLOR.GREEN} count={healthCounts.GREEN} />
            <HealthDot color={HEALTH_COLOR.YELLOW} count={healthCounts.YELLOW} />
            <HealthDot color={HEALTH_COLOR.RED} count={healthCounts.RED} />
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {totalProjectsCount === 0
            ? 'Создайте первый проект'
            : 'По статусу health в карточках проектов'}
        </CardContent>
      </Card>
    </div>
  );
}
