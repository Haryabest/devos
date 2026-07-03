import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import * as Icons from '@/components/ui/icons';
import { useAutomationStore, type AutomationRule } from '@/stores/automation-store';

const TRIGGER_LABEL: Record<AutomationRule['trigger'], string> = {
  deadline_soon: 'Дедлайн проекта',
  critical_tasks: 'Срочные задачи',
  if_then: 'IF/THEN',
  sla_escalation: 'SLA эскалация',
};

export function AutomationSection() {
  const rules = useAutomationStore((s) => s.rules);
  const toggleRule = useAutomationStore((s) => s.toggleRule);
  const updateRule = useAutomationStore((s) => s.updateRule);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Автоматизация</CardTitle>
        <CardDescription>
          Правила «если дедлайн → уведомление» и оповещения о срочных задачах.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rules.map((rule) => (
          <div key={rule.id} className="rounded-md border border-border/60 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{rule.name}</p>
                <p className="text-xs text-muted-foreground">
                  Триггер: {TRIGGER_LABEL[rule.trigger]}
                </p>
                {rule.trigger === 'deadline_soon' && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">За</span>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      className="h-7 w-16"
                      value={(rule.config.daysBefore as number) ?? 3}
                      onChange={(e) =>
                        updateRule(rule.id, {
                          config: { ...rule.config, daysBefore: Number(e.target.value) || 3 },
                        })
                      }
                    />
                    <span className="text-xs text-muted-foreground">дн. до дедлайна</span>
                  </div>
                )}
                {rule.trigger === 'sla_escalation' && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Без апдейта</span>
                    <Input
                      type="number"
                      min={1}
                      className="h-7 w-16"
                      value={(rule.config.hoursWithoutUpdate as number) ?? 48}
                      onChange={(e) =>
                        updateRule(rule.id, {
                          config: { ...rule.config, hoursWithoutUpdate: Number(e.target.value) || 48 },
                        })
                      }
                    />
                    <span className="text-xs text-muted-foreground">ч.</span>
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={rule.enabled ? 'default' : 'secondary'} className="text-[10px]">
                  {rule.enabled ? 'активно' : 'выкл'}
                </Badge>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7"
                  onClick={() => toggleRule(rule.id)}
                >
                  {rule.enabled ? 'Выключить' : 'Включить'}
                </Button>
              </div>
            </div>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          <Icons.Zap className="mr-1 inline h-3 w-3" />
          Срабатывает при открытии панели уведомлений и каждые 60 сек.
        </p>
      </CardContent>
    </Card>
  );
}
