import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import * as Icons from '@/components/ui/icons';
import { getInviteLink } from '@/lib/sync-engine';
import { INVITE_ROLES, useTeamStore } from '@/stores/team-store';
import { useAuthStore } from '@/stores/auth-store';
import { ROLE_LABEL, type Project, type Role } from '@/shared/types';

interface ProjectShareDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectShareDialog({ project, open, onOpenChange }: ProjectShareDialogProps) {
  const user = useAuthStore((s) => s.user);
  const members = useTeamStore((s) => s.members);
  const invites = useTeamStore((s) => s.invites);
  const inviteToProject = useTeamStore((s) => s.inviteToProject);
  const joinSyncRoom = useTeamStore((s) => s.joinSyncRoom);
  const removeMember = useTeamStore((s) => s.removeMember);
  const removeInvite = useTeamStore((s) => s.removeInvite);
  const updateMemberRole = useTeamStore((s) => s.updateMemberRole);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('DEVELOPER');
  const [lastLink, setLastLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ type: 'member' | 'invite'; id: string; label: string } | null>(null);

  const projectMembers = useMemo(
    () => members.filter((m) => m.projectId === project.id),
    [members, project.id],
  );

  const pendingInvites = useMemo(
    () =>
      invites.filter(
        (i) =>
          i.projectId === project.id &&
          i.status === 'PENDING' &&
          new Date(i.expiresAt) > new Date(),
      ),
    [invites, project.id],
  );

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    const inv = inviteToProject({
      projectId: project.id,
      projectName: project.name,
      email: email.trim(),
      role,
    });
    joinSyncRoom(project.id);
    setLastLink(getInviteLink(inv.token));
    setEmail('');
  }

  async function copyLink(link: string) {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[88vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icons.Share2 className="h-4 w-4" />
              Поделиться проектом
            </DialogTitle>
            <DialogDescription>
              {project.name} — пригласите по email. Изменения синхронизируются в реальном времени.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInvite} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="share-email">Email</Label>
              <Input
                id="share-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Роль</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVITE_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full gap-2" disabled={!email.trim()}>
              <Icons.Send className="h-4 w-4" />
              Отправить приглашение
            </Button>
          </form>

          {lastLink && (
            <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs">
              <code className="min-w-0 flex-1 truncate font-mono">{lastLink}</code>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 shrink-0 gap-1"
                onClick={() => copyLink(lastLink)}
              >
                <Icons.Copy className="h-3 w-3" />
                {copied ? 'OK' : 'Копировать'}
              </Button>
            </div>
          )}

          <div className="space-y-2 border-t border-border/40 pt-4">
            <p className="text-xs font-medium text-muted-foreground">Участники</p>
            <div className="flex items-center gap-2 rounded-md border border-border/60 px-3 py-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                {(user?.name ?? 'Я').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user?.name ?? 'Вы'}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <span className="text-xs text-muted-foreground">{ROLE_LABEL.OWNER}</span>
            </div>
            {projectMembers.map((m) => (
              <div
                key={m.id}
                className="group flex items-center gap-2 rounded-md border border-border/60 px-3 py-2"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                  {m.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{m.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                </div>
                <Select value={m.role} onValueChange={(v) => updateMemberRole(m.id, v as Role)}>
                  <SelectTrigger className="h-7 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVITE_ROLES.map((r) => (
                      <SelectItem key={r} value={r} className="text-xs">
                        {ROLE_LABEL[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100"
                  onClick={() =>
                    setRemoveTarget({ type: 'member', id: m.id, label: m.name })
                  }
                >
                  <Icons.Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          {pendingInvites.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Ожидают принятия</p>
              {pendingInvites.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center gap-2 rounded-md border border-dashed border-border/60 px-3 py-2 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{inv.email}</p>
                    <p className="text-muted-foreground">{ROLE_LABEL[inv.role]}</p>
                  </div>
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono">{inv.token}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => copyLink(getInviteLink(inv.token))}
                  >
                    <Icons.Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() =>
                      setRemoveTarget({ type: 'invite', id: inv.id, label: inv.email })
                    }
                  >
                    <Icons.Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={removeTarget !== null}
        onOpenChange={(o) => !o && setRemoveTarget(null)}
        title={removeTarget?.type === 'member' ? 'Убрать доступ?' : 'Отозвать приглашение?'}
        description={
          removeTarget?.type === 'member'
            ? `${removeTarget.label} потеряет доступ к проекту.`
            : `Приглашение для ${removeTarget?.label} будет отозвано.`
        }
        onConfirm={() => {
          if (!removeTarget) return;
          if (removeTarget.type === 'member') removeMember(removeTarget.id);
          else removeInvite(removeTarget.id);
        }}
      />
    </>
  );
}
