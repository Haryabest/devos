import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Главная</h1>
        <p className="text-sm text-muted-foreground">
          Обзор проектов, задач и AI-рекомендаций по всему воркспейсу.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Активные проекты</CardDescription>
            <CardTitle className="text-3xl">—</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Подключите воркспейс, чтобы увидеть данные.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Открытые задачи</CardDescription>
            <CardTitle className="text-3xl">—</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Todo + В работе + Ревью
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Здоровье проекта</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <Badge variant="secondary">н/д</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            AI health score появится после подключения проекта.
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Последняя активность</CardTitle>
            <CardDescription>Коммиты, задачи, документация.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Пока пусто. Активность появится, как только вы подключите GitHub / GitLab / Figma
            или создадите первые задачи.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>AI рекомендации</CardTitle>
            <CardDescription>Что стоит сделать до релиза.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            AI начнёт давать рекомендации после первой индексации документации и задач.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
