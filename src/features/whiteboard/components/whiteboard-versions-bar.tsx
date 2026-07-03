import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWhiteboardVersionsStore } from '@/stores/whiteboard-versions-store';
import { useWhiteboardStore } from '@/stores/whiteboard-store';

interface WhiteboardVersionsBarProps {
  projectId: string;
}

export function WhiteboardVersionsBar({ projectId }: WhiteboardVersionsBarProps) {
  const versions = useWhiteboardVersionsStore((s) => s.listForProject(projectId));
  const restoreVersion = useWhiteboardVersionsStore((s) => s.restoreVersion);
  const replaceBoard = useWhiteboardStore((s) => s.replaceBoard);

  if (versions.length === 0) return null;

  return (
    <div className="flex items-center gap-2 border-b border-border/60 px-3 py-1.5 text-xs">
      <span className="text-muted-foreground">Версии:</span>
      <Select
        onValueChange={(id) => {
          const board = restoreVersion(id);
          if (board) replaceBoard(board);
        }}
      >
        <SelectTrigger className="h-7 w-48">
          <SelectValue placeholder="Восстановить…" />
        </SelectTrigger>
        <SelectContent>
          {versions.map((v) => (
            <SelectItem key={v.id} value={v.id}>
              {v.label} · {new Date(v.createdAt).toLocaleString('ru-RU')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-7 text-xs"
        onClick={() => {
          const latest = versions[0];
          if (latest) {
            const board = restoreVersion(latest.id);
            if (board) replaceBoard(board);
          }
        }}
      >
        Последняя
      </Button>
    </div>
  );
}
