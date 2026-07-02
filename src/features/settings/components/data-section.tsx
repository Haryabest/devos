import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import * as Icons from '@/components/ui/icons';

type DataSectionProps = {
  onExport: () => void;
  onClear: () => void;
};

export function DataSection({ onExport, onClear }: DataSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Данные</CardTitle>
        <CardDescription>Экспорт и очистка локального хранилища.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={onExport} className="gap-2">
          <Icons.FileText className="h-4 w-4" />
          Экспорт JSON
        </Button>
        <Button variant="destructive" onClick={onClear} className="gap-2">
          <Icons.Trash2 className="h-4 w-4" />
          Очистить все данные
        </Button>
      </CardContent>
    </Card>
  );
}
