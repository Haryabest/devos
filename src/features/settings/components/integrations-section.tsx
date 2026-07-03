import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import * as Icons from '@/components/ui/icons';
import { IntegrationRow } from '@/features/settings/components/integration-row';

export function IntegrationsSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Интеграции</CardTitle>
        <CardDescription>GitHub PR, Figma sync, Slack/Telegram webhooks.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <IntegrationRow icon={Icons.Github} name="GitHub" status="Коммиты + open PR в проекте" />
        <IntegrationRow icon={Icons.Figma} name="Figma" status="oEmbed превью + ручной sync" />
        <IntegrationRow icon={Icons.Plug} name="Webhooks" status="Настройки → Webhooks" />
      </CardContent>
    </Card>
  );
}
