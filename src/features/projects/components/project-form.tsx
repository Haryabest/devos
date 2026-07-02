import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PROJECT_TYPES } from '@/stores/projects-store';
import { useGroupsStore } from '@/stores/groups-store';
import { useClientsStore } from '@/stores/clients-store';
import { useCreateProjectApi, useUpdateProjectApi } from '@/hooks/use-project-api';
import type { Project, ProjectType } from '@/shared/types';

interface ProjectFormProps {
  project?: Project | null;
  onCancel: () => void;
  onSaved: (projectId: string) => void;
}

export function ProjectForm({ project, onCancel, onSaved }: ProjectFormProps) {
  const createApi = useCreateProjectApi();
  const updateApi = useUpdateProjectApi();
  const groups = useGroupsStore((s) => s.groups);
  const clients = useClientsStore((s) => s.clients);
  const isEdit = !!project;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ProjectType>('WEB');
  const [groupId, setGroupId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [startAt, setStartAt] = useState<string | null>(null);
  const [dueAt, setDueAt] = useState<string | null>(null);

  useEffect(() => {
    setName(project?.name ?? '');
    setDescription(project?.description ?? '');
    setType(project?.type ?? 'WEB');
    setGroupId(project?.groupId ?? null);
    setClientId(project?.clientId ?? null);
    setStartAt(project?.startAt ?? null);
    setDueAt(project?.dueAt ?? null);
  }, [project?.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (isEdit && project) {
      await updateApi.mutateAsync({
        id: project.id,
        patch: { name, description, type, groupId, clientId, startAt, dueAt },
      });
      onSaved(project.id);
    } else {
      const created = await createApi.mutateAsync({
        name,
        description,
        type,
        groupId,
        clientId,
        startAt,
        dueAt,
      });
      onSaved(created.id);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Начало</Label>
          <DatePicker value={startAt} onChange={setStartAt} placeholder="Дата начала" />
        </div>
        <div className="space-y-2">
          <Label>Окончание</Label>
          <DatePicker value={dueAt} onChange={setDueAt} placeholder="Дата окончания" />
        </div>
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

      {clients.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="client">Клиент</Label>
          <Select
            value={clientId ?? '__none'}
            onValueChange={(v) => setClientId(v === '__none' ? null : v)}
          >
            <SelectTrigger id="client">
              <SelectValue placeholder="Без клиента" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">Без клиента</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Git и Figma подключаются на странице проекта после создания.
      </p>

      <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Отмена
        </Button>
        <Button type="submit" disabled={!name.trim()}>
          {isEdit ? 'Сохранить' : 'Создать проект'}
        </Button>
      </div>
    </form>
  );
}
