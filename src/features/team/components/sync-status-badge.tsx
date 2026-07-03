import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function SyncStatusBadge({ syncLive }: { syncLive: boolean }) {
  return (
    <Badge
      variant={syncLive ? 'default' : 'secondary'}
      className={cn('gap-1.5', syncLive && 'bg-emerald-600 hover:bg-emerald-600')}
    >
      <span
        className={cn('h-1.5 w-1.5 rounded-full', syncLive ? 'bg-white animate-pulse' : 'bg-muted-foreground')}
      />
      {syncLive ? 'Live sync · WS' : 'Sync offline'}
    </Badge>
  );
}
