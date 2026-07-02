import { cn } from '@/lib/utils';

type IntegrationRowProps = {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  status: string;
  disabled?: boolean;
};

export function IntegrationRow({ icon: Icon, name, status, disabled }: IntegrationRowProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-md border border-border/60 px-3 py-2.5',
        disabled && 'opacity-60',
      )}
    >
      <div className="flex items-center gap-2 text-sm">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {name}
      </div>
      <span className="text-xs text-muted-foreground">{status}</span>
    </div>
  );
}
