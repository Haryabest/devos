import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import * as Icons from '@/components/ui/icons';
import type { Client } from '@/shared/types';

export function ClientGrid({
  clients,
  projectCounts,
  onOpen,
  onDelete,
}: {
  clients: Client[];
  projectCounts: Record<string, number>;
  onOpen: (id: string) => void;
  onDelete: (client: Client) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {clients.map((c) => {
        const projectCount = projectCounts[c.id] ?? 0;
        return (
          <Card
            key={c.id}
            onClick={() => onOpen(c.id)}
            className="group cursor-pointer transition-colors hover:border-primary/50"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icons.Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{c.name}</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Удалить клиента"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(c);
                  }}
                >
                  <Icons.Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
              <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                {c.description || 'Без описания'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs text-muted-foreground">
              <div className="flex flex-wrap items-center gap-2">
                {c.email && (
                  <span className="flex items-center gap-1 truncate">
                    <Icons.Mail className="h-3 w-3 shrink-0" />
                    {c.email}
                  </span>
                )}
                {c.phone && (
                  <span className="flex items-center gap-1">
                    <Icons.Phone className="h-3 w-3 shrink-0" />
                    {c.phone}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 border-t border-border/40 pt-2">
                <Badge variant="secondary" className="gap-1">
                  <Icons.Boxes className="h-3 w-3" />
                  {projectCount} {projectCount === 1 ? 'проект' : projectCount < 5 ? 'проекта' : 'проектов'}
                </Badge>
                {c.contacts.length > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <Icons.User className="h-3 w-3" />
                    {c.contacts.length}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
