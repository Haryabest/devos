import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as Icons from '@/components/ui/icons';

interface AddColumnCardProps {
  onAdd: (name: string) => void;
}

export function AddColumnCard({ onAdd }: AddColumnCardProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name);
    setName('');
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 w-72 shrink-0 items-center gap-2 rounded-lg border border-dashed border-border/60 px-3 text-sm text-muted-foreground transition-colors hover:bg-accent"
      >
        <Icons.Plus className="h-4 w-4" />
        Новая колонка
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="flex w-72 shrink-0 flex-col gap-2 rounded-lg border border-border/60 bg-card p-3"
    >
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Название колонки…"
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={!name.trim()}>
          Создать
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            setOpen(false);
            setName('');
          }}
        >
          Отмена
        </Button>
      </div>
    </form>
  );
}
