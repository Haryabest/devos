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
        <CardDescription>GitHub, Figma — приоритет по roadmap.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <IntegrationRow icon={Icons.Github} name="GitHub" status="Ссылка в карточке проекта" />
        <IntegrationRow icon={Icons.Figma} name="Figma" status="Превью в проекте" />
        <IntegrationRow icon={Icons.Plug} name="API / Webhooks" status="Скоро" disabled />
      </CardContent>
    </Card>
  );
}
