import { useMemo, useState } from 'react';
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
import { renderMentionText, type MentionCandidate } from '@/lib/mention-utils';
import { groupCommentsByThread } from '@/lib/task-comments-utils';
import { CommentReactions } from '@/features/tasks/components/comment-reactions';
import type { Task } from '@/shared/types';

type TaskExtraSection = 'dependencies' | 'comments' | 'history';

interface TaskExtrasProps {
  task: Task;
  siblingTasks: Task[];
  mentionCandidates?: MentionCandidate[];
  onAddComment: (text: string) => void;
  onReply?: (parentId: string, text: string) => void;
  onToggleReaction?: (commentId: string, emoji: string) => void;
  currentUserId?: string | null;
  onAddDependency: (taskId: string) => void;
  onRemoveDependency: (taskId: string) => void;
  sections?: TaskExtraSection[];
}

export function TaskExtras({
  task,
  siblingTasks,
  mentionCandidates = [],
  onAddComment,
  onReply,
  onToggleReaction,
  currentUserId,
  onAddDependency,
  onRemoveDependency,
  sections = ['dependencies', 'comments', 'history'],
}: TaskExtrasProps) {
  const [comment, setComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [depId, setDepId] = useState('');
  const threads = useMemo(() => groupCommentsByThread(task.comments), [task.comments]);

  const mentionHint = useMemo(
    () => mentionCandidates.slice(0, 6).map((c) => `@${c.name.split(' ')[0]?.toLowerCase()}`).join(' '),
    [mentionCandidates],
  );

  const atQuery = useMemo(() => {
    const m = comment.match(/@([\w\u0400-\u04FF.-]*)$/);
    return m?.[1]?.toLowerCase() ?? null;
  }, [comment]);

  const suggestions = useMemo(() => {
    if (atQuery === null) return [];
    return mentionCandidates.filter((c) => {
      const name = c.name.toLowerCase();
      const email = c.email.split('@')[0]?.toLowerCase() ?? '';
      return name.includes(atQuery) || email.startsWith(atQuery);
    }).slice(0, 5);
  }, [atQuery, mentionCandidates]);

  const candidates = siblingTasks.filter(
    (t) => t.id !== task.id && !task.dependsOn.includes(t.id) && t.parentId === null,
  );

  const show = (s: TaskExtraSection) => sections.includes(s);

  function insertMention(candidate: MentionCandidate) {
    const token = candidate.name.split(' ')[0] ?? candidate.email.split('@')[0] ?? candidate.name;
    setComment((prev) => prev.replace(/@[\w\u0400-\u04FF.-]*$/, `@${token} `));
  }

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
            <div className="space-y-3">
              {threads.map(({ root, replies }) => (
                <div key={root.id} className="space-y-1.5">
                  <div className="rounded-md border border-border/60 px-3 py-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{root.author}</span>
                      <span>{formatDateTime(root.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm">{renderMentionText(root.text)}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <CommentReactions
                        commentId={root.id}
                        reactions={root.reactions}
                        currentUserId={currentUserId}
                        onToggleReaction={onToggleReaction}
                        className="mt-0 flex-1"
                      />
                      <button
                        type="button"
                        className="shrink-0 text-xs text-primary"
                        onClick={() => setReplyTo(root.id)}
                      >
                        Ответить
                      </button>
                    </div>
                  </div>
                  {replies.map((r) => (
                    <div key={r.id} className="ml-4 rounded-md border border-border/40 px-3 py-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{r.author}</span>
                        <span>{formatDateTime(r.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-sm">{renderMentionText(r.text)}</p>
                      <CommentReactions
                        commentId={r.id}
                        reactions={r.reactions}
                        currentUserId={currentUserId}
                        onToggleReaction={onToggleReaction}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!comment.trim()) return;
              if (replyTo && onReply) onReply(replyTo, comment);
              else onAddComment(comment);
              setComment('');
              setReplyTo(null);
            }}
            className="space-y-2"
          >
            {replyTo && (
              <p className="text-xs text-muted-foreground">
                Ответ в треде ·{' '}
                <button type="button" className="text-primary" onClick={() => setReplyTo(null)}>
                  отмена
                </button>
              </p>
            )}
            <div className="relative">
              <Input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Написать комментарий… @имя для упоминания"
                className="h-8"
              />
              {suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-md border border-border bg-popover p-1 shadow-md">
                  {suggestions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="flex w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                      onClick={() => insertMention(s)}
                    >
                      @{s.name}
                      <span className="ml-2 text-xs text-muted-foreground">{s.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {mentionCandidates.length > 0 && (
              <p className="text-[10px] text-muted-foreground">
                @mention · @assign:имя для назначения · {mentionHint}
              </p>
            )}
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
