import { useMemo, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import * as Icons from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { SortableTaskCard } from '@/features/tasks/components/sortable-task-card';
import { COLUMN_COLORS, useTasksStore } from '@/stores/tasks-store';
import type { Task, TaskColumn } from '@/shared/types';

export interface KanbanColumnProps {
  column: TaskColumn;
  tasks: Task[];
  onAdd: (columnId: string) => void;
  onRename: (name: string) => void;
  onRecolor: (color: string) => void;
  onRemove: () => void;
  onRemoveTask: (t: Task) => void;
  onOpenTask: (t: Task) => void;
}

export function KanbanColumn({
  column,
  tasks,
  onAdd,
  onRename,
  onRecolor,
  onRemove,
  onRemoveTask,
  onOpenTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(column.name);
  const [menuOpen, setMenuOpen] = useState(false);

  const sorted = useMemo(() => [...tasks].sort((a, b) => a.order - b.order), [tasks]);
  const allTasks = useTasksStore((s) => s.tasks);
  const childCount = (id: string) => allTasks.filter((t) => t.parentId === id).length;

  function commitName() {
    const v = name.trim();
    if (v) onRename(v);
    else setName(column.name);
    setEditingName(false);
  }

  return (
    <div
      ref={setNodeRef}
      data-column={column.id}
      className={cn(
        'flex h-full w-72 shrink-0 flex-col rounded-lg border border-border/60 bg-card/50 transition-colors',
        isOver && 'border-primary/60 ring-2 ring-primary/20',
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: column.color }}
        />
        {editingName ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitName();
              if (e.key === 'Escape') {
                setName(column.name);
                setEditingName(false);
              }
            }}
            className="flex-1 bg-transparent text-sm font-semibold outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setName(column.name);
              setEditingName(true);
            }}
            className="flex-1 truncate text-left text-sm font-semibold"
          >
            {column.name}
          </button>
        )}
        <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
          {tasks.length}
        </Badge>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            aria-label="Опции колонки"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <Icons.MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-50 mt-1 w-44 rounded-md border border-border/60 bg-popover p-1.5 text-xs shadow-md">
                <p className="px-2 py-1 text-[10px] font-medium uppercase text-muted-foreground">
                  Цвет
                </p>
                <div className="flex flex-wrap gap-1 px-1 pb-1.5">
                  {COLUMN_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        onRecolor(c);
                        setMenuOpen(false);
                      }}
                      className={cn(
                        'h-4 w-4 rounded-full ring-offset-2 ring-offset-popover',
                        column.color === c && 'ring-2 ring-ring',
                      )}
                      style={{ backgroundColor: c }}
                      aria-label={`Цвет ${c}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onRemove();
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-destructive hover:bg-destructive/10"
                >
                  <Icons.Trash2 className="h-3.5 w-3.5" />
                  Удалить колонку
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <SortableContext items={sorted.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-2 overflow-y-auto px-2 py-1">
          {sorted.map((t) => (
            <SortableTaskCard
              key={t.id}
              task={t}
              subtaskCount={childCount(t.id)}
              onOpen={() => onOpenTask(t)}
              onRemove={() => onRemoveTask(t)}
            />
          ))}
          {sorted.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              Перетащите сюда задачу или добавьте новую.
            </p>
          )}
        </div>
      </SortableContext>

      <div className="p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAdd(column.id)}
          className="w-full justify-start gap-1.5 text-muted-foreground"
        >
          <Icons.Plus className="h-3.5 w-3.5" />
          Новая задача
        </Button>
      </div>
    </div>
  );
}
