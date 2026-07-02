import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import * as Icons from '@/components/ui/icons';
import { useProjectsStore } from '@/stores/projects-store';
import { STATUS_LABEL } from '@/stores/projects-store';
import type { Project } from '@/shared/types';

interface AttachProjectsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
}

export function AttachProjectsDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
}: AttachProjectsDialogProps) {
  const projects = useProjectsStore((s) => s.projects);
  const updateProject = useProjectsStore((s) => s.update);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const available = useMemo(
    () => projects.filter((p) => p.clientId !== clientId),
    [projects, clientId],
  );

  const linked = useMemo(
    () => projects.filter((p) => p.clientId === clientId),
    [projects, clientId],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function attachSelected() {
    selected.forEach((id) => updateProject(id, { clientId }));
    setSelected(new Set());
    onOpenChange(false);
  }

  function detach(project: Project) {
    updateProject(project.id, { clientId: null });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setSelected(new Set());
      }}
    >
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Проекты клиента</DialogTitle>
          <DialogDescription>
            Привяжите существующие проекты к «{clientName}».
          </DialogDescription>
        </DialogHeader>

        {linked.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Привязанные</p>
            <div className="space-y-1.5">
              {linked.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{STATUS_LABEL[p.status]}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 shrink-0 text-xs"
                    onClick={() => detach(p)}
                  >
                    Отвязать
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {available.length > 0 ? 'Доступные проекты' : 'Нет доступных проектов'}
          </p>
          {available.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Все проекты уже привязаны к этому или другим клиентам. Создайте новый проект на вкладке «Проекты».
            </p>
          ) : (
            <div className="max-h-64 space-y-1.5 overflow-y-auto">
              {available.map((p) => {
                const checked = selected.has(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggle(p.id)}
                    className="flex w-full items-center gap-3 rounded-md border border-border/60 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50"
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        checked ? 'border-primary bg-primary text-primary-foreground' : 'border-input'
                      }`}
                    >
                      {checked && <Icons.Check className="h-3 w-3" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{p.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="px-1 py-0 text-[10px]">
                          {p.type}
                        </Badge>
                        {p.clientId && <span>у другого клиента</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
          {available.length > 0 && (
            <Button type="button" disabled={selected.size === 0} onClick={attachSelected}>
              Привязать ({selected.size})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
