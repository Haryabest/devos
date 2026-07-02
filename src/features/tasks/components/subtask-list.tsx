import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import * as Icons from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { useTasksStore } from '@/stores/tasks-store';
import type { Task } from '@/shared/types';

type SubtaskListProps = {
  subtasks: Task[];
  onRequestRemove: (s: Task) => void;
};

export function SubtaskList({ subtasks, onRequestRemove }: SubtaskListProps) {
  const update = useTasksStore((s) => s.update);
  const scheduleUpdate = useTasksStore((s) => s.scheduleUpdate);
  if (subtasks.length === 0) {
    return <p className="text-sm text-muted-foreground">Подзадач пока нет.</p>;
  }
  return (
    <div className="space-y-1">
      {subtasks.map((s) => (
        <div
          key={s.id}
          className="group flex items-center gap-2 rounded-md border border-border/60 bg-card px-3 py-1.5"
        >
          <Checkbox
            checked={s.done}
            onCheckedChange={(checked) => update(s.id, { done: checked === true })}
            aria-label="Отметить подзадачу"
          />
          <Input
            defaultValue={s.title}
            key={s.id}
            onChange={(e) => scheduleUpdate(s.id, { title: e.target.value })}
            className={cn(
              'h-8 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0',
              s.done && 'text-muted-foreground line-through',
            )}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100"
            onClick={() => onRequestRemove(s)}
          >
            <Icons.Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      ))}
    </div>
  );
}

type AddSubtaskProps = {
  onAdd: (title: string) => void;
};

export function AddSubtask({ onAdd }: AddSubtaskProps) {
  const [title, setTitle] = useState('');
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title);
    setTitle('');
  }
  return (
    <form onSubmit={submit} className="flex gap-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Добавить подзадачу…"
        className="h-8 text-sm"
      />
      <Button type="submit" size="sm" variant="outline" disabled={!title.trim()}>
        Добавить
      </Button>
    </form>
  );
}
