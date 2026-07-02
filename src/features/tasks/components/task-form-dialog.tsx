import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
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
import { AddAttachment } from '@/components/ui/attachments';
import { cn } from '@/lib/utils';
import {
  PRIORITIES,
  PRIORITY_LABEL,
  STATUS_LABEL,
  useTasksStore,
} from '@/stores/tasks-store';
import type { NewAttachment } from '@/stores/tasks/constants';
import type { Priority, TaskColumn } from '@/shared/types';
import { PRIORITY_DOT } from '@/features/tasks/constants';

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  columns: TaskColumn[];
  defaultColumnId?: string;
  siblingTasks: { id: string; title: string }[];
  onCreated?: (taskId: string) => void;
}

export function TaskFormDialog({
  open,
  onOpenChange,
  projectId,
  columns,
  defaultColumnId,
  siblingTasks,
  onCreated,
}: TaskFormDialogProps) {
  const add = useTasksStore((s) => s.add);
  const update = useTasksStore((s) => s.update);
  const addAttachment = useTasksStore((s) => s.addAttachment);
  const addDependency = useTasksStore((s) => s.addDependency);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [startAt, setStartAt] = useState<string | null>(null);
  const [dueAt, setDueAt] = useState<string | null>(null);
  const [dependsOn, setDependsOn] = useState<string[]>([]);
  const [pendingAttachments, setPendingAttachments] = useState<NewAttachment[]>([]);

  const sortedColumns = useMemo(
    () => [...columns].sort((a, b) => a.order - b.order),
    [columns],
  );

  useEffect(() => {
    if (!open) return;
    setTitle('');
    setDescription('');
    setColumnId(defaultColumnId ?? sortedColumns[0]?.id ?? '');
    setPriority('MEDIUM');
    setStartAt(null);
    setDueAt(null);
    setDependsOn([]);
    setPendingAttachments([]);
  }, [open, defaultColumnId, sortedColumns]);

  function toggleDependency(id: string) {
    setDependsOn((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !columnId) return;

    const task = add({
      projectId,
      columnId,
      title,
      priority,
    });

    update(task.id, {
      description: description.trim(),
      startAt,
      dueAt,
    });

    dependsOn.forEach((depId) => addDependency(task.id, depId));
    pendingAttachments.forEach((a) => addAttachment(task.id, a));

    onOpenChange(false);
    onCreated?.(task.id);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Новая задача</DialogTitle>
            <DialogDescription>
              Backlog → Done, приоритеты, даты, зависимости и вложения.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="task-title">Название</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Что нужно сделать"
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-desc">Описание</Label>
            <Textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Контекст, шаги, критерии…"
              className="min-h-20"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Статус / колонка</Label>
              <Select value={columnId} onValueChange={setColumnId}>
                <SelectTrigger>
                  <SelectValue placeholder="Колонка" />
                </SelectTrigger>
                <SelectContent>
                  {sortedColumns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span
                        className="mr-1.5 inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      {STATUS_LABEL[c.statusKey] ?? c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Приоритет</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      <span className={cn('mr-1.5 inline-block h-2 w-2 rounded-full', PRIORITY_DOT[p])} />
                      {PRIORITY_LABEL[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Начало</Label>
              <DatePicker value={startAt} onChange={setStartAt} />
            </div>
            <div className="space-y-2">
              <Label>Срок</Label>
              <DatePicker value={dueAt} onChange={setDueAt} />
            </div>
          </div>

          {siblingTasks.length > 0 && (
            <div className="space-y-2">
              <Label>Зависимости</Label>
              <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border border-border/60 p-2">
                {siblingTasks.map((t) => (
                  <label
                    key={t.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={dependsOn.includes(t.id)}
                      onCheckedChange={() => toggleDependency(t.id)}
                    />
                    <span className="truncate">{t.title || 'Без названия'}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Вложения</Label>
            <AddAttachment
              onAdd={(a) => setPendingAttachments((prev) => [...prev, a])}
            />
            {pendingAttachments.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {pendingAttachments.length} файл(ов) будет добавлено
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={!title.trim() || !columnId}>
              Создать
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
