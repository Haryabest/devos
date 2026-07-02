import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import * as Icons from '@/components/ui/icons';
import {
  HEALTH_COLOR,
  HEALTH_LABEL,
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
}

export function ProjectDetailHeader({
  project,
  onBack,
  onShare,
  onEdit,
  onDelete,
}: ProjectDetailHeaderProps) {
  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="mb-3 gap-2 text-muted-foreground"
      >
        <Icons.ArrowLeft className="h-4 w-4" />
        К проектам
      </Button>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <span
              className="h-3 w-3 shrink-0 rounded-full ring-2 ring-background"
              style={{ backgroundColor: HEALTH_COLOR[project.health] }}
              title={`Здоровье: ${HEALTH_LABEL[project.health]}`}
            />
            {project.name}
          </h1>
          <p className="text-sm text-muted-foreground">{project.description || 'Без описания'}</p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="secondary">{project.type}</Badge>
            <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: STATUS_COLOR[project.status] }}
              />
              {STATUS_LABEL[project.status]}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold">
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
