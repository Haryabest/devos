import { useEffect, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import * as Icons from '@/components/ui/icons';
import { PROJECT_TYPES, useProjectsStore } from '@/stores/projects-store';
import { useGroupsStore } from '@/stores/groups-store';
import type { Project, ProjectLinks, ProjectType } from '@/shared/types';

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Если передан — режим редактирования, иначе — создание. */
  project?: Project | null;
  onCreated?: (id: string) => void;
}

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
  onCreated,
}: ProjectFormDialogProps) {
  const add = useProjectsStore((s) => s.add);
  const update = useProjectsStore((s) => s.update);
  const groups = useGroupsStore((s) => s.groups);

  const isEdit = !!project;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ProjectType>('WEB');
  const [groupId, setGroupId] = useState<string | null>(null);
  const [links, setLinks] = useState<ProjectLinks>({});

  useEffect(() => {
    if (!open) return;
    setName(project?.name ?? '');
    setDescription(project?.description ?? '');
    setType(project?.type ?? 'WEB');
    setGroupId(project?.groupId ?? null);
    setLinks(project?.links ?? {});
  }, [open, project]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (isEdit && project) {
      update(project.id, { name, description, type, links, groupId });
    } else {
      const created = add({ name, description, type, links, groupId });
      onCreated?.(created.id);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Редактировать проект' : 'Новый проект'}</DialogTitle>
            <DialogDescription>
              {isEdit ? 'Изменения сохранятся локально.' : 'Проект будет сохранён локально.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="name">Название</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например, DevOS Web"
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Коротко о проекте"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Тип</Label>
            <Select value={type} onValueChange={(v) => setType(v as ProjectType)}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Выберите тип" />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {groups.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="group">Группа</Label>
              <Select
                value={groupId ?? '__none'}
                onValueChange={(v) => setGroupId(v === '__none' ? null : v)}
              >
                <SelectTrigger id="group">
                  <SelectValue placeholder="Без группы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Без группы</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-3 rounded-md border border-border/60 p-3">
            <p className="text-xs font-medium text-muted-foreground">Ссылки (опционально)</p>
            <div className="space-y-2">
              <Label htmlFor="figma" className="flex items-center gap-1.5 text-xs">
                <Icons.Figma className="h-3.5 w-3.5" /> Figma
              </Label>
              <Input
                id="figma"
                value={links.figma ?? ''}
                onChange={(e) => setLinks((l) => ({ ...l, figma: e.target.value }))}
                placeholder="https://figma.com/file/… (превью подтянется)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="git" className="flex items-center gap-1.5 text-xs">
                <Icons.Github className="h-3.5 w-3.5" /> Git
              </Label>
              <Input
                id="git"
                value={links.git ?? ''}
                onChange={(e) => setLinks((l) => ({ ...l, git: e.target.value }))}
                placeholder="https://github.com/org/repo"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Документация и API добавляются внутри проекта.
            </p>
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
