import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { GROUP_COLORS, useGroupsStore } from '@/stores/groups-store';
import type { ProjectGroup } from '@/shared/types';

interface GroupFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: ProjectGroup | null;
}

export function GroupFormDialog({ open, onOpenChange, group }: GroupFormDialogProps) {
  const add = useGroupsStore((s) => s.add);
  const rename = useGroupsStore((s) => s.rename);
  const recolor = useGroupsStore((s) => s.recolor);

  const isEdit = !!group;

  const [name, setName] = useState(group?.name ?? '');
  const [color, setColor] = useState(group?.color ?? GROUP_COLORS[0]);

  function handleOpenChange(o: boolean) {
    if (o) {
      setName(group?.name ?? '');
      setColor(group?.color ?? GROUP_COLORS[0]);
    }
    onOpenChange(o);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (isEdit && group) {
      rename(group.id, name);
      recolor(group.id, color);
    } else {
      add(name, color);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Редактировать группу' : 'Новая группа'}</DialogTitle>
            <DialogDescription>Группируйте проекты для фильтрации и обзора.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="group-name">Название</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например, Клиентские"
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Цвет</Label>
            <div className="flex flex-wrap gap-2">
              {GROUP_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'h-6 w-6 rounded-full ring-offset-2 ring-offset-background',
                    color === c && 'ring-2 ring-ring',
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Цвет ${c}`}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {isEdit ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
