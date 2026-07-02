import { useSettingsStore } from '@/stores/settings-store';
import { StatsCards } from '@/features/dashboard/components/stats-cards';
import { ActivityCard } from '@/features/dashboard/components/activity-card';
import { RecommendationsCard } from '@/features/dashboard/components/recommendations-card';
import { ProjectQuickList } from '@/features/dashboard/components/project-quick-list';
import { useDashboardData } from '@/features/dashboard/hooks/use-dashboard-data';

export function DashboardPage() {
  const workspaceName = useSettingsStore((s) => s.workspaceName);
  const {
    projects,
    tasks,
    activeProjects,
    openTasks,
    criticalTasks,
    healthCounts,
    activity,
    recommendations,
  } = useDashboardData();

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{workspaceName}</h1>
        <p className="text-sm text-muted-foreground">
          AI-first обзор: проекты, задачи и контекст для разработки.
        </p>
      </header>

      <StatsCards
        activeProjectsCount={activeProjects.length}
        totalProjectsCount={projects.length}
        openTasksCount={openTasks.length}
        criticalTasksCount={criticalTasks.length}
        healthCounts={healthCounts}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ActivityCard activity={activity} />
        <RecommendationsCard hasProjects={projects.length > 0} recommendations={recommendations} />
      </div>

      {projects.length > 0 && (
        <ProjectQuickList activeProjects={activeProjects} tasks={tasks} />
      )}
    </div>
  );
}
