import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import * as Icons from '@/components/ui/icons';
import { formatDate } from '@/lib/format-date';
import { differenceInCalendarDays, parseISO, isValid } from 'date-fns';
import type { Project } from '@/shared/types';

export function DashboardDeadlinesCard({ projects }: { projects: Project[] }) {
  const navigate = useNavigate();

  const withDeadlines = projects
    .filter((p) => p.dueAt)
    .map((p) => {
      const due = p.dueAt ? parseISO(p.dueAt) : null;
      const daysLeft =
        due && isValid(due) ? differenceInCalendarDays(due, new Date()) : null;
      return { project: p, daysLeft };
    })
    .sort((a, b) => {
      if (a.daysLeft === null) return 1;
      if (b.daysLeft === null) return -1;
      return a.daysLeft - b.daysLeft;
    })
    .slice(0, 6);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icons.CircleDashed className="h-4 w-4" />
          Дедлайны проектов
        </CardTitle>
        <CardDescription>Ближайшие сроки окончания.</CardDescription>
      </CardHeader>
      <CardContent>
        {withDeadlines.length === 0 ? (
          <p className="text-sm text-muted-foreground">Нет проектов с заданным сроком окончания.</p>
        ) : (
          <div className="space-y-2">
            {withDeadlines.map(({ project, daysLeft }) => (
              <button
                key={project.id}
                type="button"
                onClick={() => navigate(`/projects/${project.id}`)}
                className="flex w-full items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2 text-left hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{project.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(project.startAt)} — {formatDate(project.dueAt)}
                  </p>
                </div>
                {daysLeft !== null && (
                  <Badge variant={daysLeft < 0 ? 'destructive' : daysLeft <= 7 ? 'default' : 'secondary'}>
                    {daysLeft < 0 ? `${Math.abs(daysLeft)} дн. просрочки` : `${daysLeft} дн.`}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
