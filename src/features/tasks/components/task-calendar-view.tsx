import { useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  parseISO,
  isValid,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import type { Task, TaskColumn } from '@/shared/types';
import { cn } from '@/lib/utils';

interface TaskCalendarViewProps {
  tasks: Task[];
  columns: TaskColumn[];
  month: Date;
  onOpen: (task: Task) => void;
}

export function TaskCalendarView({ tasks, columns, month, onOpen }: TaskCalendarViewProps) {
  const days = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    return eachDayOfInterval({ start, end });
  }, [month]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.dueAt) continue;
      const d = parseISO(t.dueAt);
      if (!isValid(d)) continue;
      const key = format(d, 'yyyy-MM-dd');
      const list = map.get(key) ?? [];
      list.push(t);
      map.set(key, list);
    }
    return map;
  }, [tasks]);

  const startPad = (startOfMonth(month).getDay() + 6) % 7;

  return (
    <div className="p-6">
      <h2 className="mb-4 text-lg font-semibold capitalize">
        {format(month, 'LLLL yyyy', { locale: ru })}
      </h2>
      <div className="grid grid-cols-7 gap-px rounded-lg border border-border/60 bg-border/40 overflow-hidden">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
          <div key={d} className="bg-card px-2 py-1.5 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} className="min-h-24 bg-card/50" />
        ))}
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayTasks = tasksByDay.get(key) ?? [];
          return (
            <div
              key={key}
              className={cn(
                'min-h-24 bg-card p-1.5',
                !isSameMonth(day, month) && 'opacity-50',
                isSameDay(day, new Date()) && 'ring-1 ring-inset ring-primary/40',
              )}
            >
              <span className="text-xs text-muted-foreground">{format(day, 'd')}</span>
              <div className="mt-1 space-y-0.5">
                {dayTasks.slice(0, 3).map((t) => {
                  const col = columns.find((c) => c.id === t.columnId);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onOpen(t)}
                      className="block w-full truncate rounded px-1 py-0.5 text-left text-[10px] hover:bg-muted"
                      style={{ borderLeft: `2px solid ${col?.color ?? '#64748b'}` }}
                    >
                      {t.title || 'Без названия'}
                    </button>
                  );
                })}
                {dayTasks.length > 3 && (
                  <Badge variant="secondary" className="text-[9px]">
                    +{dayTasks.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {tasks.filter((t) => t.dueAt).length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          Нет задач с дедлайном. Укажите «Срок» на странице задачи.
        </p>
      )}
    </div>
  );
}
