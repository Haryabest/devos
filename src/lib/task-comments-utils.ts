import type { TaskComment, CommentReaction } from '@/shared/types';

export function normalizeComment(raw: Partial<TaskComment> & { id: string; author: string; text: string; createdAt: string }): TaskComment {
  return {
    id: raw.id,
    author: raw.author,
    authorId: raw.authorId ?? null,
    text: raw.text,
    createdAt: raw.createdAt,
    threadId: raw.threadId ?? null,
    parentCommentId: raw.parentCommentId ?? null,
    reactions: raw.reactions ?? [],
    assigneeIds: raw.assigneeIds ?? [],
  };
}

export function parseAssigneeFromText(text: string): string | null {
  const m = text.match(/@assign:([\w\u0400-\u04FF.-]+)/i);
  return m?.[1]?.toLowerCase() ?? null;
}

export function groupCommentsByThread(comments: TaskComment[]): { root: TaskComment; replies: TaskComment[] }[] {
  const roots = comments.filter((c) => !c.parentCommentId);
  return roots.map((root) => ({
    root,
    replies: comments.filter((c) => c.parentCommentId === root.id),
  }));
}

export function toggleReaction(
  reactions: CommentReaction[],
  emoji: string,
  userId: string,
  userName: string,
): CommentReaction[] {
  const existing = reactions.find((r) => r.emoji === emoji && r.userId === userId);
  if (existing) {
    return reactions.filter((r) => !(r.emoji === emoji && r.userId === userId));
  }
  return [...reactions, { emoji, userId, userName }];
}

export function groupReactionsByEmoji(
  reactions: CommentReaction[],
  currentUserId?: string | null,
): { emoji: string; count: number; names: string[]; active: boolean }[] {
  const groups = new Map<string, { count: number; names: string[]; active: boolean }>();
  for (const r of reactions) {
    const g = groups.get(r.emoji) ?? { count: 0, names: [], active: false };
    g.count += 1;
    g.names.push(r.userName);
    if (currentUserId && r.userId === currentUserId) g.active = true;
    groups.set(r.emoji, g);
  }
  return [...groups.entries()]
    .map(([emoji, g]) => ({ emoji, ...g }))
    .sort((a, b) => b.count - a.count);
}
