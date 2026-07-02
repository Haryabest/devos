import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import * as Icons from '@/components/ui/icons';

export function EmptyClients({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
          <Icons.Users className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Пока нет клиентов</p>
          <p className="text-sm text-muted-foreground">
            Добавьте первого клиента и привяжите к нему проекты.
          </p>
        </div>
        <Button onClick={onCreate} variant="outline" size="sm" className="gap-2">
          <Icons.Plus className="h-4 w-4" />
          Добавить клиента
        </Button>
      </CardContent>
    </Card>
  );
}
