import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  if (subtasks.length === 0) return null;
  return (
    <div className="space-y-1">
      {subtasks.map((s) => (
        <div
          key={s.id}
          className="group flex items-center gap-2 rounded-md border border-border/60 bg-card px-3 py-1.5"
        >
          <button
            onClick={() => update(s.id, { done: !s.done })}
            className={cn(
              'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
              s.done ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
            )}
          >
            {s.done && <Icons.Check className="h-3 w-3" />}
          </button>
          <input
            defaultValue={s.title}
            key={s.id}
            onChange={(e) => scheduleUpdate(s.id, { title: e.target.value })}
            className={cn(
              'flex-1 bg-transparent text-sm outline-none',
              s.done && 'text-muted-foreground line-through',
            )}
          />
          <button
            onClick={() => onRequestRemove(s)}
            className="opacity-0 transition-opacity group-hover:opacity-100"
          >
            <Icons.Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
          </button>
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
