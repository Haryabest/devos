import { lazy, Suspense, useMemo, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import * as Icons from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { groupReactionsByEmoji } from '@/lib/task-comments-utils';
import type { CommentReaction } from '@/shared/types';

const CommentEmojiPicker = lazy(() =>
  import('@/features/tasks/components/comment-emoji-picker').then((m) => ({
    default: m.CommentEmojiPicker,
  })),
);

const QUICK_EMOJI = ['👍', '❤️', '😂', '🎉', '👀', '🔥'] as const;

interface CommentReactionsProps {
  commentId: string;
  reactions: CommentReaction[];
  currentUserId?: string | null;
  onToggleReaction?: (commentId: string, emoji: string) => void;
  className?: string;
}

export function CommentReactions({
  commentId,
  reactions,
  currentUserId,
  onToggleReaction,
  className,
}: CommentReactionsProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const groups = useMemo(
    () => groupReactionsByEmoji(reactions, currentUserId),
    [reactions, currentUserId],
  );

  const usedEmojis = useMemo(() => new Set(groups.map((g) => g.emoji)), [groups]);
  const quickEmojis = QUICK_EMOJI.filter((e) => !usedEmojis.has(e));

  function pick(emoji: string) {
    onToggleReaction?.(commentId, emoji);
    setPickerOpen(false);
  }

  if (!onToggleReaction) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn('mt-2 flex flex-wrap items-center gap-1.5', className)}>
        {groups.map(({ emoji, count, names, active }) => (
          <Tooltip key={emoji}>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-pressed={active}
                aria-label={`Реакция ${emoji}, ${count}`}
                className={cn(
                  'apple-emoji inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[13px] leading-none',
                  'border transition-all duration-150 active:scale-95',
                  active
                    ? 'border-sky-500/35 bg-sky-500/15 text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                    : 'border-border/40 bg-secondary/50 text-foreground hover:bg-secondary/80',
                )}
                onClick={() => onToggleReaction(commentId, emoji)}
              >
                <span className="text-[15px]">{emoji}</span>
                <span className="min-w-[0.5rem] text-[11px] font-medium tabular-nums text-muted-foreground">
                  {count}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[220px] text-xs">
              {names.join(', ')}
            </TooltipContent>
          </Tooltip>
        ))}

        {quickEmojis.slice(0, 4).map((emoji) => (
          <button
            key={emoji}
            type="button"
            aria-label={`Добавить ${emoji}`}
            className={cn(
              'apple-emoji inline-flex h-7 w-7 items-center justify-center rounded-full',
              'border border-transparent text-[15px] opacity-60 transition-all',
              'hover:border-border/40 hover:bg-secondary/50 hover:opacity-100 active:scale-95',
            )}
            onClick={() => onToggleReaction(commentId, emoji)}
          >
            {emoji}
          </button>
        ))}

        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Добавить реакцию"
              className={cn(
                'inline-flex h-7 w-7 items-center justify-center rounded-full',
                'border border-border/40 bg-secondary/40 text-muted-foreground',
                'transition-all hover:bg-secondary/70 hover:text-foreground active:scale-95',
                pickerOpen && 'border-sky-500/35 bg-sky-500/10 text-foreground',
              )}
            >
              <Icons.Smile className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto overflow-hidden border-border/60 p-0 shadow-xl"
            align="start"
            sideOffset={6}
          >
            <Suspense
              fallback={
                <div className="flex h-[360px] w-[320px] items-center justify-center text-sm text-muted-foreground">
                  <Icons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Загрузка…
                </div>
              }
            >
              <CommentEmojiPicker onPick={pick} />
            </Suspense>
          </PopoverContent>
        </Popover>
      </div>
    </TooltipProvider>
  );
}
