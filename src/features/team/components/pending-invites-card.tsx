import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ROLE_LABEL } from '@/shared/types';
import type { TeamInvite } from '@/shared/types';

export function PendingInvitesCard({
  invites,
  joinCode,
  onJoinCodeChange,
  onDecline,
  onAccept,
}: {
  invites: TeamInvite[];
  joinCode: string;
  onJoinCodeChange: (code: string) => void;
  onDecline: (token: string) => void;
  onAccept: (token: string) => void;
}) {
  if (invites.length === 0 && !joinCode) return null;

  return (
    <Card className="border-primary/40">
      <CardHeader>
        <CardTitle className="text-base">Входящие приглашения</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {invites.map((inv) => (
          <div
            key={inv.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2.5"
          >
            <div>
              <p className="text-sm font-medium">{inv.projectName}</p>
              <p className="text-xs text-muted-foreground">
                {ROLE_LABEL[inv.role]} · от {inv.invitedByName}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onDecline(inv.token)}>
                Отклонить
              </Button>
              <Button size="sm" onClick={() => onAccept(inv.token)}>
                Принять
              </Button>
            </div>
          </div>
        ))}
        {invites.length === 0 && joinCode && (
          <div className="flex gap-2">
            <Input
              value={joinCode}
              onChange={(e) => onJoinCodeChange(e.target.value.toUpperCase())}
              placeholder="Код приглашения"
              className="font-mono uppercase"
            />
            <Button onClick={() => onAccept(joinCode)}>Принять</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
