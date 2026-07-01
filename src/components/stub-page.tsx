import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import * as Icons from '@/components/ui/icons';

interface Stub {
  title: string;
  description: string;
}

export function StubPage({ title, description }: Stub) {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.CircleDashed className="h-5 w-5 text-muted-foreground" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p className="mb-4">
            Модуль подключён к маршрутизатору, дизайн-системе и store'ам. Реальные данные
            появятся, как только backend-модуль будет реализован.
          </p>
          <Button variant="outline" size="sm">
            <Icons.Plus className="mr-1 h-4 w-4" />
            Создать
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
