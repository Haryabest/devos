import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function JoinCodeCard({
  joinCode,
  onJoinCodeChange,
  onAccept,
}: {
  joinCode: string;
  onJoinCodeChange: (code: string) => void;
  onAccept: (token: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Есть код приглашения?</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Input
          value={joinCode}
          onChange={(e) => onJoinCodeChange(e.target.value.toUpperCase())}
          placeholder="XXXXXXXXXXXX"
          className="font-mono uppercase"
        />
        <Button onClick={() => onAccept(joinCode)} disabled={!joinCode.trim()}>
          Вступить
        </Button>
      </CardContent>
    </Card>
  );
}
