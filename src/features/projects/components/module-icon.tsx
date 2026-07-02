import { cn } from '@/lib/utils';

export function ModuleIcon({
  icon: Icon,
  count,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  label: string;
}) {
  return (
    <span
      title={`${label}: ${count}`}
      className={cn(
        'flex items-center gap-1 transition-colors',
        count > 0 ? 'text-foreground/80' : 'text-muted-foreground/40',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="tabular-nums">{count}</span>
    </span>
  );
}
