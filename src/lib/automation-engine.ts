import { differenceInCalendarDays, differenceInHours, parseISO } from 'date-fns';
import { dispatchWebhooks, type WebhookEvent } from '@/lib/webhook-dispatch';
import type { IfThenConfig } from '@/shared/types/automation';
import type { AppNotification } from '@/stores/notifications-store';
import { useAutomationStore } from '@/stores/automation-store';
import { useProjectsStore } from '@/stores/projects-store';
import { useTasksStore } from '@/stores/tasks-store';
import { useAuthStore } from '@/stores/auth-store';
import { useTeamStore } from '@/stores/team-store';

const fired = new Set<string>();

function once(key: string) {
  return !fired.has(key) && (fired.add(key), true);
}

export function runAutomationEngine(push: (item: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void) {
  const rules = useAutomationStore.getState().rules.filter((r) => r.enabled);
  const projects = useProjectsStore.getState().projects;
  const tasks = useTasksStore.getState().tasks;
  const user = useAuthStore.getState().user;
  const now = new Date();

  for (const rule of rules) {
    if (rule.trigger === 'deadline_soon') {
      const days = (rule.config.daysBefore as number) ?? 3;
      for (const p of projects) {
        if (!p.dueAt) continue;
        const d = differenceInCalendarDays(parseISO(p.dueAt), now);
        if (d < 0 || d > days) continue;
        const key = `auto-deadline-${rule.id}-${p.id}-${d}`;
        if (!once(key)) continue;
        push({
          kind: 'deadline',
          title: rule.name,
          body: `«${p.name}» — дедлайн через ${d} дн.`,
          href: `/projects/${p.id}`,
        });
        void dispatchWebhooks('project.deadline', { projectId: p.id, name: p.name, daysLeft: d });
      }
    }

    if (rule.trigger === 'critical_tasks') {
      const critical = tasks.filter(
        (t) => !t.done && (t.priority === 'CRITICAL' || t.priority === 'HIGH'),
      );
      if (critical.length === 0) continue;
      const key = `auto-critical-${rule.id}-${critical.length}`;
      if (!once(key)) continue;
      push({
        kind: 'info',
        title: rule.name,
        body: `${critical.length} срочных задач требуют внимания`,
        href: critical[0] ? `/projects/${critical[0].projectId}/tasks` : '/projects',
      });
    }

    if (rule.trigger === 'if_then') {
      const cfg = rule.config as IfThenConfig;
      if (!cfg.when?.field || !cfg.when?.value) continue;
      for (const t of tasks.filter((x) => x.parentId === null)) {
        const fieldVal = cfg.when.field === 'status' ? t.status : t.priority;
        if (fieldVal !== cfg.when.value) continue;
        const key = `if-then-${rule.id}-${t.id}-${fieldVal}`;
        if (!once(key)) continue;
        if (cfg.then?.action === 'notify') {
          push({
            kind: 'info',
            title: rule.name,
            body: cfg.then.message ?? `Задача «${t.title}» → ${fieldVal}`,
            href: `/projects/${t.projectId}/tasks/${t.id}`,
          });
        }
        if (cfg.then?.action === 'webhook') {
          void dispatchWebhooks((cfg.then.event as WebhookEvent) ?? 'task.created', {
            taskId: t.id,
            projectId: t.projectId,
            field: cfg.when.field,
            value: fieldVal,
          });
        }
      }
    }

    if (rule.trigger === 'sla_escalation') {
      const hours = (rule.config.hoursWithoutUpdate as number) ?? 48;
      const minPriority = (rule.config.priority as string) ?? 'HIGH';
      const rank = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };
      for (const t of tasks.filter((x) => !x.done && x.parentId === null)) {
        if (rank[t.priority] < rank[minPriority as keyof typeof rank]) continue;
        const last = t.history[0]?.createdAt ?? t.createdAt;
        if (differenceInHours(now, parseISO(last)) < hours) continue;
        const key = `sla-${rule.id}-${t.id}`;
        if (!once(key)) continue;
        push({
          kind: 'deadline',
          title: rule.name,
          body: `«${t.title}» без обновлений ${hours}+ ч.`,
          href: `/projects/${t.projectId}/tasks/${t.id}`,
        });
      }
    }
  }

  if (!user) return;
  const email = user.email.toLowerCase();
  for (const inv of useTeamStore.getState().invites) {
    if (inv.status !== 'PENDING') continue;
    if (inv.email !== '*' && inv.email !== email) continue;
    if (new Date(inv.expiresAt) < now) continue;
    const key = `invite-${inv.id}`;
    if (!once(key)) continue;
    push({
      kind: 'invite',
      title: 'Приглашение в проект',
      body: `${inv.invitedByName} → «${inv.projectName}»`,
      href: `/team?join=${inv.token}`,
    });
    void dispatchWebhooks('invite.sent', { projectId: inv.projectId, token: inv.token });
  }
}
