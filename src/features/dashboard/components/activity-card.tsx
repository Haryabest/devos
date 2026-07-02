import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ActivityIcon } from '@/features/dashboard/components/activity-icon';
import type { ActivityItem } from '@/features/dashboard/types';

type ActivityCardProps = {
  activity: ActivityItem[];
};

export function ActivityCard({ activity }: ActivityCardProps) {
  const navigate = useNavigate();

  function handleClick(a: ActivityItem) {
    if (a.kind === 'project' && a.projectId) navigate(`/projects/${a.projectId}`);
    else if (a.kind === 'doc' && a.projectId) navigate(`/projects/${a.projectId}/docs`);
    else if (a.kind === 'task' && a.projectId) navigate(`/projects/${a.projectId}/tasks`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Последняя активность</CardTitle>
        <CardDescription>Задачи, документация, проекты.</CardDescription>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Пока пусто. Создайте проект и начните работу.
          </p>
        ) : (
          <ul className="space-y-2">
            {activity.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => handleClick(a)}
                  className="flex w-full items-start gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
                >
                  <ActivityIcon kind={a.kind} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.projectName && `${a.projectName} · `}
                      {new Date(a.at).toLocaleString('ru-RU')}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
