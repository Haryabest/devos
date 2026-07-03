import { dispatchWebhooks } from '@/lib/webhook-dispatch';
import { resolveMentionTargets, type MentionCandidate } from '@/lib/mention-utils';
import type { AppNotification } from '@/stores/notifications-store';

export function notifyTaskMentions(input: {
  text: string;
  taskId: string;
  taskTitle: string;
  projectId: string;
  candidates: MentionCandidate[];
  currentUserId?: string;
  authorName: string;
  push: (item: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
}) {
  const targets = resolveMentionTargets(input.text, input.candidates, input.currentUserId);
  if (targets.length === 0) return;

  for (const target of targets) {
    input.push({
      kind: 'mention',
      title: `@${target.name}`,
      body: `${input.authorName} упомянул в «${input.taskTitle || 'Задача'}»`,
      href: `/projects/${input.projectId}/tasks/${input.taskId}`,
    });
  }

  void dispatchWebhooks('task.mention', {
    taskId: input.taskId,
    projectId: input.projectId,
    text: input.text,
    mentions: targets.map((t) => t.email),
  });
}
