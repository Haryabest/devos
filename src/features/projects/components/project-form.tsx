import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
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
  const [nameError, setNameError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

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
    setNameError(null);
    setDateError(null);
    if (!name.trim()) {
      setNameError('Укажите название проекта');
      return;
    }
    if (startAt && dueAt && new Date(startAt) > new Date(dueAt)) {
      setDateError('Дата начала не может быть позже даты окончания');
      return;
    }
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
    <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
      <FormField label="Название" htmlFor="name" error={nameError}>
        <Input
          id="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) setNameError(null);
          }}
          placeholder="Например, DevOS Web"
          autoFocus
          required
          aria-invalid={!!nameError}
        />
      </FormField>

      <FormField label="Описание" htmlFor="description">
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Коротко о проекте"
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Начало">
          <DatePicker value={startAt} onChange={setStartAt} placeholder="Дата начала" invalid={!!dateError} />
        </FormField>
        <FormField label="Окончание" error={dateError}>
          <DatePicker value={dueAt} onChange={setDueAt} placeholder="Дата окончания" invalid={!!dateError} />
        </FormField>
      </div>

      <FormField label="Тип" htmlFor="type">
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
      </FormField>

      {groups.length > 0 && (
        <FormField label="Группа" htmlFor="group">
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
        </FormField>
      )}

      {clients.length > 0 && (
        <FormField label="Клиент" htmlFor="client">
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
        </FormField>
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
