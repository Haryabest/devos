import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import * as Icons from '@/components/ui/icons';
import { BreadcrumbBack } from '@/components/layout/breadcrumb-back';
import { formatDate } from '@/lib/format-date';
import {
  HEALTH_COLOR,
  HEALTH_LABEL,
  PROJECT_STATUSES,
  STATUS_COLOR,
  STATUS_LABEL,
} from '@/stores/projects-store';
import type { Project } from '@/shared/types';

interface ProjectDetailHeaderProps {
  project: Project;
  onBack: () => void;
  onShare: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: Project['status']) => void;
}

export function ProjectDetailHeader({
  project,
  onBack,
  onShare,
  onEdit,
  onDelete,
  onStatusChange,
}: ProjectDetailHeaderProps) {
  return (
    <div>
      <BreadcrumbBack label="Проекты" onClick={onBack} className="mb-3" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <span
                className="h-3 w-3 shrink-0 rounded-full ring-2 ring-background"
                style={{ backgroundColor: HEALTH_COLOR[project.health] }}
                title={`Здоровье: ${HEALTH_LABEL[project.health]}`}
              />
              {project.name}
            </h1>
            <Badge variant="secondary">{project.type}</Badge>
          </div>

          {project.description && (
            <p className="text-sm text-muted-foreground">{project.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Icons.CircleDashed className="h-3 w-3" />
              Создан {formatDate(project.createdAt, 'd MMM yyyy')}
            </span>
            <Select value={project.status} onValueChange={(v) => onStatusChange(v as Project['status'])}>
              <SelectTrigger className="h-7 w-auto gap-1.5 border-dashed px-2 text-xs">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: STATUS_COLOR[project.status] }}
                />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: HEALTH_COLOR[project.health] }}
              />
              {HEALTH_LABEL[project.health]}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" onClick={onShare} className="gap-2">
            <Icons.Share2 className="h-4 w-4" />
            Поделиться
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit} className="gap-2">
            <Icons.Pencil className="h-4 w-4" />
            Редактировать
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete} className="gap-2">
            <Icons.Trash2 className="h-4 w-4" />
            Удалить
          </Button>
        </div>
      </div>
    </div>
  );
}
