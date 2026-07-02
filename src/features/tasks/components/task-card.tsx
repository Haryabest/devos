import * as Icons from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { PRIORITY_LABEL } from '@/stores/tasks-store';
import { PRIORITY_DOT } from '@/features/tasks/constants';
import type { Task } from '@/shared/types';

export interface TaskCardProps {
  task: Task;
  subtaskCount?: number;
  onOpen?: () => void;
  onRemove?: () => void;
  dragging?: boolean;
}

export function TaskCard({ task, subtaskCount, onOpen, onRemove, dragging }: TaskCardProps) {
  return (
    <div
      className={cn(
        'group cursor-pointer rounded-md border border-border/60 bg-card px-3 py-2.5 shadow-sm transition-shadow hover:shadow-md',
        dragging && 'rotate-2 cursor-grabbing shadow-lg ring-2 ring-primary/30',
        task.done && 'opacity-60',
      )}
      onDoubleClick={onOpen}
      title="Двойной клик, чтобы открыть"
    >
      <div className="flex items-start gap-2">
        <span
          className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', PRIORITY_DOT[task.priority])}
          title={PRIORITY_LABEL[task.priority]}
        />
        <span
          className={cn(
            'flex-1 text-sm leading-snug',
            task.done && 'text-muted-foreground line-through',
          )}
        >
          {task.title}
        </span>
        {onRemove && (
          <button
            aria-label="Удалить"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="opacity-0 transition-opacity group-hover:opacity-100"
          >
            <Icons.Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
          </button>
        )}
      </div>
      {(subtaskCount || task.attachments.length > 0) && (
        <div className="mt-1.5 flex items-center gap-3 pl-4 text-[11px] text-muted-foreground">
          {subtaskCount ? (
            <span className="flex items-center gap-1">
              <Icons.Layers className="h-3 w-3" />
              {subtaskCount}
            </span>
          ) : null}
          {task.attachments.length > 0 && (
            <span className="flex items-center gap-1">
              <Icons.Paperclip className="h-3 w-3" />
              {task.attachments.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
