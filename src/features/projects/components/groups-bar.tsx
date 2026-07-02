import { Button } from '@/components/ui/button';
import * as Icons from '@/components/ui/icons';
import type { Project, ProjectGroup } from '@/shared/types';

export function GroupsBar({
  groups,
  projects,
  onEdit,
  onDelete,
}: {
  groups: ProjectGroup[];
  projects: Project[];
  onEdit: (group: ProjectGroup) => void;
  onDelete: (groupId: string, name: string) => void;
}) {
  if (groups.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {groups.map((g) => (
        <div
          key={g.id}
          className="flex items-center gap-1 rounded-md border border-border/60 bg-card/50 pl-2 pr-1 py-1 text-xs"
        >
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: g.color }} />
          <span className="font-medium">{g.name}</span>
          <span className="text-muted-foreground tabular-nums">
            ({projects.filter((p) => p.groupId === g.id).length})
          </span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(g)}>
            <Icons.Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onDelete(g.id, g.name)}
          >
            <Icons.Trash2 className="h-3 w-3 text-muted-foreground" />
          </Button>
        </div>
      ))}
    </div>
  );
}
