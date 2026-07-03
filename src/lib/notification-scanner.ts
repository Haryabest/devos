import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { AppNotification } from '@/stores/notifications-store';
import { useProjectsStore } from '@/stores/projects-store';
import { useTeamStore } from '@/stores/team-store';
import { useAuthStore } from '@/stores/auth-store';

const seen = new Set<string>();

function once(key: string, fn: () => void) {
  if (seen.has(key)) return;
  seen.add(key);
  fn();
}

export function scanAndNotify(push: (item: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void) {
  const user = useAuthStore.getState().user;
  const email = user?.email?.toLowerCase();
  const projects = useProjectsStore.getState().projects;
  const invites = useTeamStore.getState().invites;
  const now = new Date();

  for (const inv of invites) {
    if (inv.status !== 'PENDING') continue;
    if (email && inv.email !== '*' && inv.email !== email) continue;
    if (new Date(inv.expiresAt) < now) continue;
    once(`invite-${inv.id}`, () =>
      push({
        kind: 'invite',
        title: 'Приглашение в проект',
        body: `${inv.invitedByName} пригласил в «${inv.projectName}»`,
        href: `/team?join=${inv.token}`,
      }),
    );
  }

  for (const p of projects) {
    if (!p.dueAt) continue;
    const due = parseISO(p.dueAt);
    const days = differenceInCalendarDays(due, now);
    if (days < 0) {
      once(`overdue-${p.id}-${due.toDateString()}`, () =>
        push({
          kind: 'deadline',
          title: 'Просрочен дедлайн',
          body: `Проект «${p.name}» — срок был ${due.toLocaleDateString('ru-RU')}`,
          href: `/projects/${p.id}`,
        }),
      );
    } else if (days <= 3) {
      once(`soon-${p.id}-${days}`, () =>
        push({
          kind: 'deadline',
          title: 'Скоро дедлайн',
          body: `«${p.name}» — через ${days} дн.`,
          href: `/projects/${p.id}`,
        }),
      );
    }
  }
}
