import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import * as Icons from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import {
  useConnectIntegration,
  useDisconnectIntegration,
  useIntegrations,
} from '@/hooks/use-integrations';
import type { Integration, IntegrationProvider } from '@/lib/integrations-api';

const PROVIDERS: {
  provider: IntegrationProvider;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}[] = [
  { provider: 'GITHUB', name: 'GitHub', icon: Icons.Github, description: 'Репозитории, коммиты, PR' },
  { provider: 'GITLAB', name: 'GitLab', icon: Icons.Plug, description: 'Репозитории и merge requests' },
  { provider: 'FIGMA', name: 'Figma', icon: Icons.Figma, description: 'Файлы и превью дизайна' },
];

function findIntegration(integrations: Integration[] | undefined, provider: IntegrationProvider) {
  return integrations?.find((i) => i.provider === provider);
}

export function IntegrationsSection() {
  const workspaceId = useAuthStore((s) => s.workspaceId);
  const { data: integrations, isLoading, isError } = useIntegrations(workspaceId);
  const connect = useConnectIntegration();
  const disconnect = useDisconnectIntegration();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Интеграции</CardTitle>
        <CardDescription>GitHub, GitLab, Figma — OAuth через backend API.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!workspaceId && (
          <p className="text-sm text-muted-foreground">Воркспейс не выбран.</p>
        )}
        {isLoading && workspaceId && (
          <p className="text-sm text-muted-foreground">Загрузка интеграций…</p>
        )}
        {isError && (
          <p className="text-sm text-destructive">Не удалось загрузить интеграции.</p>
        )}
        {PROVIDERS.map(({ provider, name, icon: Icon, description }) => {
          const row = findIntegration(integrations, provider);
          const connected = row?.connected ?? false;
          const busy =
            (connect.isPending && connect.variables?.provider === provider) ||
            (disconnect.isPending && disconnect.variables?.provider === provider);

          return (
            <div
              key={provider}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{name}</p>
                  <p className="truncate text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-xs',
                    connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
                  )}
                >
                  {connected ? 'Подключено' : 'Не подключено'}
                  {connected && row?.externalId ? ` · ${row.externalId}` : null}
                </span>
                {connected ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!workspaceId || busy}
                    onClick={() => workspaceId && disconnect.mutate({ provider, workspaceId })}
                  >
                    Отключить
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    disabled={!workspaceId || busy}
                    onClick={() => workspaceId && connect.mutate({ provider, workspaceId })}
                  >
                    Подключить
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
