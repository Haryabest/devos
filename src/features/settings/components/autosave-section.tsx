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

type AutosaveSectionProps = {
  autosaveDelayMs: number;
  onChange: (delayMs: number) => void;
};

export function AutosaveSection({ autosaveDelayMs, onChange }: AutosaveSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Автосохранение</CardTitle>
        <CardDescription>Задержка после последнего изменения (docs, задачи).</CardDescription>
      </CardHeader>
      <CardContent>
        <Select
          value={String(autosaveDelayMs)}
          onValueChange={(v) => onChange(Number(v))}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1000">1 секунда</SelectItem>
            <SelectItem value="3000">3 секунды</SelectItem>
            <SelectItem value="5000">5 секунд</SelectItem>
            <SelectItem value="10000">10 секунд</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
