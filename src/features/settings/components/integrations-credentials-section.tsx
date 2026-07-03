import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useIntegrationsStore } from '@/stores/integrations-store';

export function IntegrationsCredentialsSection() {
  const creds = useIntegrationsStore();
  const update = useIntegrationsStore((s) => s.update);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Jira / Linear</CardTitle>
        <CardDescription>API-ключи для синхронизации в карточке проекта.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">Jira Base URL</Label>
          <Input
            value={creds.jiraBaseUrl}
            onChange={(e) => update({ jiraBaseUrl: e.target.value })}
            placeholder="https://your.atlassian.net"
            className="h-8"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Jira Email</Label>
            <Input
              value={creds.jiraEmail}
              onChange={(e) => update({ jiraEmail: e.target.value })}
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Jira API Token</Label>
            <Input
              type="password"
              value={creds.jiraToken}
              onChange={(e) => update({ jiraToken: e.target.value })}
              className="h-8"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Linear API Key</Label>
          <Input
            type="password"
            value={creds.linearApiKey}
            onChange={(e) => update({ linearApiKey: e.target.value })}
            placeholder="lin_api_…"
            className="h-8"
          />
        </div>
      </CardContent>
    </Card>
  );
}
