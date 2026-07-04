import { Outlet } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useBackendBootstrap } from '@/hooks/use-backend-bootstrap';
import { useNotificationWs } from '@/hooks/use-notification-ws';
import { useWorkspaceHydration } from '@/hooks/use-workspace-hydration';

export function BackendBootstrap({ children }: { children?: React.ReactNode }) {
  const workspaceReady = useWorkspaceHydration();
  const { isBootstrapping } = useBackendBootstrap();
  useNotificationWs();

  if (!workspaceReady || isBootstrapping) {
    return (
      <div className="w-full space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return children ?? <Outlet />;
}
