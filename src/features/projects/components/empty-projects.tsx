import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import * as Icons from '@/components/ui/icons';

export function EmptyProjects({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
          <Icons.FolderPlus className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Пока нет проектов</p>
          <p className="text-sm text-muted-foreground">Создайте первый проект, чтобы начать работу.</p>
        </div>
        <Button onClick={onCreate} variant="outline" size="sm" className="gap-2">
          <Icons.Plus className="h-4 w-4" />
          Создать проект
        </Button>
      </CardContent>
    </Card>
  );
}
