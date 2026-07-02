import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import * as Icons from '@/components/ui/icons';
import { getInviteLink } from '@/lib/sync-engine';
import { ROLE_LABEL, type TeamInvite } from '@/shared/types';

export function SentInvitesCard({
  invites,
  onCopyLink,
  onRevoke,
}: {
  invites: TeamInvite[];
  onCopyLink: (link: string) => void;
  onRevoke: (invite: TeamInvite) => void;
}) {
  if (invites.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Отправленные приглашения</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {invites.map((inv) => (
          <div
            key={inv.id}
            className="flex flex-wrap items-center gap-3 rounded-md border border-border/60 px-3 py-2 text-sm"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium">{inv.projectName}</p>
              <p className="text-xs text-muted-foreground">
                {inv.email} · {ROLE_LABEL[inv.role]} · {inv.status}
              </p>
            </div>
            <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs">{inv.token}</code>
            {inv.status === 'PENDING' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7"
                  onClick={() => onCopyLink(getInviteLink(inv.token))}
                >
                  <Icons.Copy className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7"
                  onClick={() => onRevoke(inv)}
                >
                  <Icons.Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
