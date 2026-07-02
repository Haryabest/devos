import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import * as Icons from '@/components/ui/icons';
import { formatDateTime } from '@/lib/format-date';
import type { Task } from '@/shared/types';

type TaskExtraSection = 'dependencies' | 'comments' | 'history';

interface TaskExtrasProps {
  task: Task;
  siblingTasks: Task[];
  onAddComment: (text: string) => void;
  onAddDependency: (taskId: string) => void;
  onRemoveDependency: (taskId: string) => void;
  sections?: TaskExtraSection[];
}

export function TaskExtras({
  task,
  siblingTasks,
  onAddComment,
  onAddDependency,
  onRemoveDependency,
  sections = ['dependencies', 'comments', 'history'],
}: TaskExtrasProps) {
  const [comment, setComment] = useState('');
  const [depId, setDepId] = useState('');

  const candidates = siblingTasks.filter(
    (t) => t.id !== task.id && !task.dependsOn.includes(t.id) && t.parentId === null,
  );

  const show = (s: TaskExtraSection) => sections.includes(s);

  return (
    <div className="space-y-6">
      {show('dependencies') && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Icons.Link2 className="h-3.5 w-3.5" />
            Зависимости
          </div>
          {task.dependsOn.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет зависимостей.</p>
          ) : (
            <div className="space-y-1.5">
              {task.dependsOn.map((id) => {
                const dep = siblingTasks.find((t) => t.id === id);
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-sm"
                  >
                    <span>{dep?.title || id}</span>
                    <Button variant="ghost" size="sm" className="h-7" onClick={() => onRemoveDependency(id)}>
                      <Icons.X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
          {candidates.length > 0 && (
            <div className="flex gap-2">
              <Select value={depId} onValueChange={setDepId}>
                <SelectTrigger className="h-8 flex-1">
                  <SelectValue placeholder="Задача-блокер" />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title || 'Без названия'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="h-8"
                disabled={!depId}
                onClick={() => {
                  onAddDependency(depId);
                  setDepId('');
                }}
              >
                Добавить
              </Button>
            </div>
          )}
        </section>
      )}

      {show('comments') && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Icons.Send className="h-3.5 w-3.5" />
            Комментарии
          </div>
          {task.comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Комментариев пока нет.</p>
          ) : (
            <div className="space-y-2">
              {task.comments.map((c) => (
                <div key={c.id} className="rounded-md border border-border/60 px-3 py-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{c.author}</span>
                    <span>{formatDateTime(c.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm">{c.text}</p>
                </div>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!comment.trim()) return;
              onAddComment(comment);
              setComment('');
            }}
            className="flex gap-2"
          >
            <Input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Написать комментарий…"
              className="h-8"
            />
            <Button type="submit" size="sm" className="h-8" disabled={!comment.trim()}>
              Отправить
            </Button>
          </form>
        </section>
      )}

      {show('history') && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Icons.CircleDashed className="h-3.5 w-3.5" />
            История изменений
          </div>
          {task.history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Изменений пока нет.</p>
          ) : (
            <div className="max-h-[50vh] space-y-1 overflow-y-auto text-xs">
              {task.history.slice(0, 30).map((h) => (
                <div key={h.id} className="rounded border border-border/40 px-2 py-1.5 text-muted-foreground">
                  <span className="font-medium text-foreground">{h.author}</span> изменил{' '}
                  <span className="font-medium">{h.field}</span>: {h.oldValue || '—'} → {h.newValue || '—'}
                  <span className="ml-2 opacity-70">{formatDateTime(h.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
