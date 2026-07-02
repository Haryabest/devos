import { useState } from 'react';
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
  onInvite: (data: { projectId: string; email: string; role: Role }) => string | null;
}) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('DEVELOPER');
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function copyLink(link: string) {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const project = projects.find((p) => p.id === projectId);
    if (!project || !email.trim()) return;
    const link = onInvite({
      projectId: project.id,
      email: email.trim(),
      role,
    });
    if (link) setLastInviteLink(link);
    setEmail('');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icons.UserPlus className="h-4 w-4" />
          Пригласить в проект
        </CardTitle>
        <CardDescription>
          Любая роль: админ, менеджер, разработчик, наблюдатель, гость.
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
            <div className="grid gap-4 sm:grid-cols-3">
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
                <Label>Email</Label>
                <Input
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
            </div>
            <Button type="submit" className="gap-2">
              <Icons.Send className="h-4 w-4" />
              Отправить приглашение
            </Button>
            {lastInviteLink && (
              <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted/30 px-3 py-2 text-xs">
                <span className="text-muted-foreground">Ссылка:</span>
                <code className="flex-1 truncate font-mono">{lastInviteLink}</code>
                <Button type="button" size="sm" variant="outline" className="h-7 gap-1" onClick={() => copyLink(lastInviteLink)}>
                  <Icons.Copy className="h-3 w-3" />
                  {copied ? 'Скопировано' : 'Копировать'}
                </Button>
              </div>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  );
}
