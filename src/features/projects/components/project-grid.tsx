import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import * as Icons from '@/components/ui/icons';
import {
  HEALTH_COLOR,
  HEALTH_LABEL,
  STATUS_COLOR,
  STATUS_LABEL,
} from '@/stores/projects-store';
import { useGroupsStore } from '@/stores/groups-store';
import { useTasksStore } from '@/stores/tasks-store';
import { useDocsStore } from '@/stores/docs-store';
import { useApiStore } from '@/stores/api-store';
import type { Project } from '@/shared/types';
import { ModuleIcon } from '@/features/projects/components/module-icon';

export function ProjectGrid({
  projects,
  tasks,
  docs,
  endpoints,
  groups,
  onOpen,
  onDelete,
  deleteAction = 'delete',
}: {
  projects: Project[];
  tasks: ReturnType<typeof useTasksStore.getState>['tasks'];
  docs: ReturnType<typeof useDocsStore.getState>['docs'];
  endpoints: ReturnType<typeof useApiStore.getState>['endpoints'];
  groups: ReturnType<typeof useGroupsStore.getState>['groups'];
  onOpen: (id: string) => void;
  onDelete?: (p: Project) => void;
  /** detach — кнопка отвязывает проект вместо удаления */
  deleteAction?: 'delete' | 'detach';
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {projects.map((p) => {
        const group = groups.find((g) => g.id === p.groupId);
        const taskCount = tasks.filter((t) => t.projectId === p.id && t.parentId === null).length;
        const docCount = docs.filter((d) => d.projectId === p.id).length;
        const apiCount = endpoints.filter((e) => e.projectId === p.id).length;
        return (
          <Card
            key={p.id}
            onClick={() => onOpen(p.id)}
            className="group cursor-pointer transition-colors hover:border-primary/50"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-background"
                    style={{ backgroundColor: HEALTH_COLOR[p.health] }}
                    title={`Здоровье: ${HEALTH_LABEL[p.health]}`}
                  />
                  <span className="truncate">{p.name}</span>
                </CardTitle>
                {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label={deleteAction === 'detach' ? 'Отвязать проект' : 'Удалить проект'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(p);
                  }}
                >
                  {deleteAction === 'detach' ? (
                    <Icons.X className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <Icons.Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </Button>
                )}
              </div>
              <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                {p.description || 'Без описания'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs text-muted-foreground">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{p.type}</Badge>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_COLOR[p.status] }} />
                  {STATUS_LABEL[p.status]}
                </span>
                {group && (
                  <span className="flex items-center gap-1 rounded-full border px-1.5 py-0.5">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: group.color }} />
                    {group.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 border-t border-border/40 pt-2">
                <ModuleIcon icon={Icons.Layers} count={taskCount} label="Задачи" />
                <ModuleIcon icon={Icons.FileText} count={docCount} label="Документация" />
                <ModuleIcon icon={Icons.Plug} count={apiCount} label="API" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
