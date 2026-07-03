import { Badge } from '@/components/ui/badge';
import * as Icons from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { PRIORITY_DOT } from '@/features/tasks/constants';
import { useTasksStore } from '@/stores/tasks-store';
import type { Task, TaskColumn } from '@/shared/types';

interface TaskListViewProps {
  columns: TaskColumn[];
  tasks: Task[];
  onOpen: (t: Task) => void;
  onRemove: (t: Task) => void;
}

export function TaskListView({ columns, tasks, onOpen, onRemove }: TaskListViewProps) {
  const allTasks = useTasksStore((s) => s.tasks);
  const childCount = (id: string) => allTasks.filter((t) => t.parentId === id).length;

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="w-full max-w-3xl space-y-8">
        {columns.map((col) => {
          const colTasks = tasks
            .filter((t) => t.columnId === col.id)
            .sort((a, b) => a.order - b.order);
          if (colTasks.length === 0) return null;
          return (
            <section key={col.id}>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                <h2 className="text-sm font-semibold">{col.name}</h2>
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                  {colTasks.length}
                </Badge>
              </div>
              <div className="space-y-1">
                {colTasks.map((t) => (
                  <TaskListRow
                    key={t.id}
                    task={t}
                    subtaskCount={childCount(t.id)}
                    onOpen={() => onOpen(t)}
                    onRemove={() => onRemove(t)}
                  />
                ))}
              </div>
            </section>
          );
        })}
        {tasks.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Нет задач по выбранному фильтру.
          </p>
        )}
      </div>
    </div>
  );
}

function TaskListRow({
  task,
  subtaskCount,
  onOpen,
  onRemove,
}: {
  task: Task;
  subtaskCount: number;
  onOpen: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className="group flex cursor-pointer items-center gap-3 rounded-md border border-border/60 bg-card px-3 py-2 hover:bg-accent/50"
      onDoubleClick={onOpen}
      title="Двойной клик, чтобы открыть"
    >
      <span className={cn('h-2 w-2 shrink-0 rounded-full', PRIORITY_DOT[task.priority])} />
      <span className={cn('flex-1 text-sm', task.done && 'text-muted-foreground line-through')}>
        {task.title}
      </span>
      {subtaskCount > 0 && (
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Icons.Layers className="h-3 w-3" />
          {subtaskCount}
        </span>
      )}
      {task.attachments.length > 0 && (
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Icons.Paperclip className="h-3 w-3" />
          {task.attachments.length}
        </span>
      )}
      {task.done && <Icons.Check className="h-3.5 w-3.5 text-primary" />}
      <button
        type="button"
        aria-label="Удалить"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="opacity-0 transition-opacity group-hover:opacity-100"
      >
        <Icons.Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
      </button>
    </div>
  );
}
