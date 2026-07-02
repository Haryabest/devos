import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import * as Icons from '@/components/ui/icons';
import { formatDate } from '@/lib/format-date';
import { differenceInCalendarDays, parseISO, isValid } from 'date-fns';
import type { Project } from '@/shared/types';

export function ProjectDeadlinesCard({ project }: { project: Project }) {
  const start = project.startAt;
  const due = project.dueAt;
  const now = new Date();

  let progress = 0;
  let daysLeft: number | null = null;
  let overdue = false;

  if (start && due) {
    const s = parseISO(start);
    const d = parseISO(due);
    if (isValid(s) && isValid(d)) {
      const total = differenceInCalendarDays(d, s);
      const elapsed = differenceInCalendarDays(now, s);
      progress = total > 0 ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 0;
      daysLeft = differenceInCalendarDays(d, now);
      overdue = daysLeft < 0;
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-1.5">
          <Icons.CircleDashed className="h-3.5 w-3.5" />
          Сроки проекта
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Начало</p>
            <p className="font-medium">{formatDate(start)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Окончание</p>
            <p className="font-medium">{formatDate(due)}</p>
          </div>
        </div>

        {start && due && (
          <>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${overdue ? 'bg-destructive' : 'bg-primary'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{Math.round(progress)}% времени прошло</span>
              {daysLeft !== null && (
                <Badge variant={overdue ? 'destructive' : 'secondary'}>
                  {overdue ? `Просрочено на ${Math.abs(daysLeft)} дн.` : `${daysLeft} дн. осталось`}
                </Badge>
              )}
            </div>
          </>
        )}

        {!start && !due && (
          <p className="text-sm text-muted-foreground">Сроки не заданы. Укажите при редактировании проекта.</p>
        )}
      </CardContent>
    </Card>
  );
}
