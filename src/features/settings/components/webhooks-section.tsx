import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import * as Icons from '@/components/ui/icons';
import {
  useSettingsStore,
  type WebhookConfig,
  type WebhookEvent,
  type WebhookProvider,
} from '@/stores/settings-store';

const ALL_EVENTS: { id: WebhookEvent; label: string }[] = [
  { id: 'project.created', label: 'Проект создан' },
  { id: 'project.deadline', label: 'Дедлайн проекта' },
  { id: 'task.created', label: 'Задача создана' },
  { id: 'task.mention', label: '@mention в задаче' },
  { id: 'invite.sent', label: 'Приглашение' },
];

export function WebhooksSection() {
  const webhooks = useSettingsStore((s) => s.webhooks);
  const addWebhook = useSettingsStore((s) => s.addWebhook);
  const updateWebhook = useSettingsStore((s) => s.updateWebhook);
  const removeWebhook = useSettingsStore((s) => s.removeWebhook);

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [provider, setProvider] = useState<WebhookProvider>('slack');

  function handleAdd() {
    const trimmed = url.trim();
    if (!trimmed) return;
    addWebhook({
      name: name.trim() || 'Webhook',
      url: trimmed,
      provider,
      enabled: true,
      events: ['project.deadline', 'task.mention'],
    });
    setName('');
    setUrl('');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Webhooks</CardTitle>
        <CardDescription>
          Slack Incoming Webhook, Telegram Bot API или любой POST-endpoint.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {webhooks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Webhooks не настроены.</p>
        ) : (
          <div className="space-y-2">
            {webhooks.map((hook) => (
              <WebhookRow
                key={hook.id}
                hook={hook}
                onUpdate={(patch) => updateWebhook(hook.id, patch)}
                onRemove={() => removeWebhook(hook.id)}
              />
            ))}
          </div>
        )}

        <div className="space-y-3 rounded-md border border-border/60 p-3">
          <p className="text-xs font-medium text-muted-foreground">Добавить webhook</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="wh-name" className="text-xs">
                Название
              </Label>
              <Input
                id="wh-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Slack #dev"
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="wh-provider" className="text-xs">
                Канал
              </Label>
              <Select value={provider} onValueChange={(v) => setProvider(v as WebhookProvider)}>
                <SelectTrigger id="wh-provider" className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slack">Slack</SelectItem>
                  <SelectItem value="telegram">Telegram</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="wh-url" className="text-xs">
              URL
            </Label>
            <Input
              id="wh-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://hooks.slack.com/…"
              className="h-8"
            />
          </div>
          <Button type="button" size="sm" className="h-8 gap-1.5" onClick={handleAdd} disabled={!url.trim()}>
            <Icons.Plus className="h-3.5 w-3.5" />
            Добавить
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function WebhookRow({
  hook,
  onUpdate,
  onRemove,
}: {
  hook: WebhookConfig;
  onUpdate: (patch: Partial<WebhookConfig>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-md border border-border/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{hook.name}</p>
          <p className="truncate text-xs text-muted-foreground">{hook.url}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-[10px]">
              {hook.provider}
            </Badge>
            {hook.events.map((e) => (
              <Badge key={e} variant="outline" className="text-[10px]">
                {ALL_EVENTS.find((x) => x.id === e)?.label ?? e}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            type="button"
            size="sm"
            variant={hook.enabled ? 'secondary' : 'outline'}
            className="h-7 text-xs"
            onClick={() => onUpdate({ enabled: !hook.enabled })}
          >
            {hook.enabled ? 'Вкл' : 'Выкл'}
          </Button>
          <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={onRemove}>
            <Icons.Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
