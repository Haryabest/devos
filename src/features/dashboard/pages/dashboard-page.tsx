import { useSettingsStore } from '@/stores/settings-store';
import { StatsCards } from '@/features/dashboard/components/stats-cards';
import { ActivityCard } from '@/features/dashboard/components/activity-card';
import { RecommendationsCard } from '@/features/dashboard/components/recommendations-card';
import { ProjectQuickList } from '@/features/dashboard/components/project-quick-list';
import { DashboardDeadlinesCard } from '@/features/dashboard/components/deadlines-card';
import { ClientReportsCard } from '@/features/dashboard/components/client-reports-card';
import { BurndownCard, VelocityCard, TimeTrackingCard } from '@/features/dashboard/components/charts-cards';
import { exportSprintReviewPdf } from '@/lib/sprint-review-pdf';
import { Button } from '@/components/ui/button';
import { AuditLogCard } from '@/features/dashboard/components/audit-log-card';
import { useDashboardData } from '@/features/dashboard/hooks/use-dashboard-data';
import { useClientsStore } from '@/stores/clients-store';

export function DashboardPage() {
  const workspaceName = useSettingsStore((s) => s.workspaceName);
  const clients = useClientsStore((s) => s.clients);
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
    <div className="w-full space-y-6 p-6">
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
        <AuditLogCard />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <BurndownCard tasks={tasks} />
        <VelocityCard tasks={tasks} />
        <TimeTrackingCard tasks={tasks} />
      </div>

      {activeProjects[0] && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            exportSprintReviewPdf({ project: activeProjects[0]!, tasks, sprintName: 'Sprint Review' })
          }
        >
          Sprint Review PDF
        </Button>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <RecommendationsCard hasProjects={projects.length > 0} recommendations={recommendations} />
        <ClientReportsCard clients={clients} projects={projects} />
      </div>

      <DashboardDeadlinesCard projects={projects} />

      {projects.length > 0 && (
        <ProjectQuickList activeProjects={activeProjects} tasks={tasks} />
      )}
    </div>
  );
}
