import { useMemo } from 'react';
import * as Icons from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { PRIORITY_DOT } from '@/features/tasks/constants';
import { PRIORITY_LABEL } from '@/stores/tasks-store';
import type { Task, TaskColumn } from '@/shared/types';

interface TaskTableViewProps {
  columns: TaskColumn[];
  tasks: Task[];
  onOpen: (t: Task) => void;
  onRemove: (t: Task) => void;
}

export function TaskTableView({ columns, tasks, onOpen, onRemove }: TaskTableViewProps) {
  const colMap = useMemo(() => new Map(columns.map((c) => [c.id, c])), [columns]);
  const sorted = useMemo(() => [...tasks].sort((a, b) => a.order - b.order), [tasks]);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="w-full max-w-5xl overflow-hidden rounded-lg border border-border/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30 text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Название</th>
              <th className="px-4 py-2.5 font-medium">Статус</th>
              <th className="px-4 py-2.5 font-medium">Приоритет</th>
              <th className="px-4 py-2.5 font-medium">Готово</th>
              <th className="w-10 px-4 py-2.5 font-medium" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((t) => {
              const col = colMap.get(t.columnId);
              return (
                <tr
                  key={t.id}
                  className="group cursor-pointer border-b border-border/40 transition-colors hover:bg-accent/40"
                  onDoubleClick={() => onOpen(t)}
                  title="Двойной клик, чтобы открыть"
                >
                  <td className={cn('px-4 py-2.5', t.done && 'text-muted-foreground line-through')}>
                    {t.title}
                  </td>
                  <td className="px-4 py-2.5">
                    {col && (
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: col.color }}
                        />
                        {col.name}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <span className={cn('h-2 w-2 rounded-full', PRIORITY_DOT[t.priority])} />
                      {PRIORITY_LABEL[t.priority]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {t.done ? (
                      <Icons.Check className="h-4 w-4 text-primary" />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      type="button"
                      aria-label="Удалить"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(t);
                      }}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Icons.Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Нет задач по выбранному фильтру.
          </p>
        )}
      </div>
    </div>
  );
}
