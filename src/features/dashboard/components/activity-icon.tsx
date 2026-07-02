import * as Icons from '@/components/ui/icons';
import type { ActivityItem } from '@/features/dashboard/types';

export function ActivityIcon({ kind }: { kind: ActivityItem['kind'] }) {
  const Icon =
    kind === 'task' ? Icons.Layers : kind === 'doc' ? Icons.FileText : Icons.Boxes;
  return (
    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
    </span>
  );
}
