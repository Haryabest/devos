import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type WorkspaceSectionProps = {
  workspaceDraft: string;
  onWorkspaceDraftChange: (value: string) => void;
  onSave: () => void;
  userName?: string;
  isGuest: boolean;
};

export function WorkspaceSection({
  workspaceDraft,
  onWorkspaceDraftChange,
  onSave,
  userName,
  isGuest,
}: WorkspaceSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Воркспейс</CardTitle>
        <CardDescription>Отображается на главной.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="workspace">Название</Label>
          <div className="flex gap-2">
            <Input
              id="workspace"
              value={workspaceDraft}
              onChange={(e) => onWorkspaceDraftChange(e.target.value)}
              placeholder="Мой воркспейс"
            />
            <Button variant="outline" onClick={onSave} disabled={!workspaceDraft.trim()}>
              Сохранить
            </Button>
          </div>
        </div>
        <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Аккаунт: </span>
          {userName ?? '—'}
          {isGuest && (
            <span className="ml-2 text-xs text-amber-500">(гостевой режим, данные локально)</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
