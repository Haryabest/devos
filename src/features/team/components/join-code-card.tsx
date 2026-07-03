import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function JoinCodeCard({
  joinCode,
  onJoinCodeChange,
  onAccept,
  error,
}: {
  joinCode: string;
  onJoinCodeChange: (code: string) => void;
  onAccept: (raw: string) => void;
  error?: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Вступить по коду или ссылке</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-2">
          <Input
            value={joinCode}
            onChange={(e) => onJoinCodeChange(e.target.value)}
            placeholder="Код или полная ссылка приглашения"
            className="font-mono"
            onKeyDown={(e) => e.key === 'Enter' && joinCode.trim() && onAccept(joinCode)}
          />
          <Button onClick={() => onAccept(joinCode)} disabled={!joinCode.trim()}>
            Вступить
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          На другом устройстве нужна полная ссылка от отправителя — в ней уже есть данные проекта.
        </p>
        {error && (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
