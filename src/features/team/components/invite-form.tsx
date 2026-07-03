import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import * as Icons from '@/components/ui/icons';
import { INVITE_ROLES } from '@/stores/team-store';
import { ROLE_LABEL, type Project, type Role } from '@/shared/types';

export function InviteForm({
  projects,
  onNavigateToProjects,
  onInvite,
}: {
  projects: Project[];
  onNavigateToProjects: () => void;
  onInvite: (data: { projectId: string; role: Role }) => string | null;
}) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [role, setRole] = useState<Role>('DEVELOPER');
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [copied, setCopied] = useState<'link' | 'code' | null>(null);

  async function copy(text: string, kind: 'link' | 'code') {
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    const link = onInvite({ projectId: project.id, role });
    if (link) {
      setLastInviteLink(link);
      const code = new URL(link).searchParams.get('join');
      setLastCode(code);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icons.UserPlus className="h-4 w-4" />
          Пригласить в проект
        </CardTitle>
        <CardDescription>
          Создайте код — отправьте коллеге ссылку целиком (почта не нужна).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Сначала создайте проект.{' '}
            <button type="button" className="text-primary hover:underline" onClick={onNavigateToProjects}>
              Перейти к проектам
            </button>
          </p>
        ) : (
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Проект</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            </div>
            <Button type="submit" className="gap-2">
              <Icons.Link2 className="h-4 w-4" />
              Создать код приглашения
            </Button>
            {lastInviteLink && lastCode && (
              <div className="space-y-2 rounded-md bg-muted/30 px-3 py-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground">Код:</span>
                  <code className="rounded bg-muted px-2 py-0.5 font-mono text-sm">{lastCode}</code>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1"
                    onClick={() => copy(lastCode, 'code')}
                  >
                    <Icons.Copy className="h-3 w-3" />
                    {copied === 'code' ? 'Скопировано' : 'Код'}
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground">Ссылка:</span>
                  <code className="min-w-0 flex-1 truncate font-mono">{lastInviteLink}</code>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1"
                    onClick={() => copy(lastInviteLink, 'link')}
                  >
                    <Icons.Copy className="h-3 w-3" />
                    {copied === 'link' ? 'Скопировано' : 'Ссылку'}
                  </Button>
                </div>
              </div>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  );
}
