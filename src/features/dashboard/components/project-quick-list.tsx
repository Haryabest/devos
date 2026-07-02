import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { HEALTH_LABEL, STATUS_COLOR } from '@/stores/projects-store';
import type { Project, Task } from '@/shared/types';

type ProjectQuickListProps = {
  activeProjects: Project[];
  tasks: Task[];
};

export function ProjectQuickList({ activeProjects, tasks }: ProjectQuickListProps) {
  const navigate = useNavigate();

  if (activeProjects.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Проекты</CardTitle>
        <CardDescription>Быстрый доступ к активным.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {activeProjects.slice(0, 6).map((p) => {
            const taskN = tasks.filter((t) => t.projectId === p.id && !t.done).length;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => navigate(`/projects/${p.id}`)}
                className="flex items-center gap-3 rounded-md border border-border/60 px-3 py-2.5 text-left transition-colors hover:bg-accent"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: STATUS_COLOR[p.status] }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {taskN} задач · {HEALTH_LABEL[p.health]}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
