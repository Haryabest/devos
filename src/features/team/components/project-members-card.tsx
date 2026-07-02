import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import * as Icons from '@/components/ui/icons';
import { INVITE_ROLES } from '@/stores/team-store';
import { ROLE_LABEL, type Project, type ProjectMember, type Role } from '@/shared/types';

export function ProjectMembersCard({
  projects,
  members,
  syncRooms,
  onOpenProject,
  onUpdateRole,
  onRemoveMember,
}: {
  projects: Project[];
  members: ProjectMember[];
  syncRooms: string[];
  onOpenProject: (projectId: string) => void;
  onUpdateRole: (memberId: string, role: Role) => void;
  onRemoveMember: (member: ProjectMember) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Участники проектов</CardTitle>
        <CardDescription>
          {syncRooms.length > 0
            ? `Live sync для ${syncRooms.length} проект(ов) — правки видны во всех вкладках.`
            : 'Примите приглашение или пригласите кого-то, чтобы включить sync.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">Нет проектов.</p>
        ) : (
          projects.map((p) => {
            const projMembers = members.filter((m) => m.projectId === p.id);
            const isLive = syncRooms.includes(p.id);
            return (
              <section key={p.id}>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{p.name}</h3>
                  {isLive && (
                    <Badge variant="outline" className="text-[10px] text-emerald-500">
                      live
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-7 text-xs"
                    onClick={() => onOpenProject(p.id)}
                  >
                    Открыть
                  </Button>
                </div>
                {projMembers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Пока только вы.</p>
                ) : (
                  <div className="space-y-1">
                    {projMembers.map((m) => (
                      <div
                        key={m.id}
                        className="group flex items-center gap-3 rounded-md border border-border/60 px-3 py-2"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                          {m.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{m.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                        </div>
                        <Select
                          value={m.role}
                          onValueChange={(v) => onUpdateRole(m.id, v as Role)}
                        >
                          <SelectTrigger className="h-8 w-32 text-xs">
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
                          className="h-8 w-8 opacity-0 group-hover:opacity-100"
                          onClick={() => onRemoveMember(m)}
                        >
                          <Icons.Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
