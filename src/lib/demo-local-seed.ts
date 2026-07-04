import type { Project } from '@/shared/types';
import { readScopedItem, writeScopedItem } from '@/lib/storage-scope';
import { auditLog } from '@/stores/audit-store';
import { useApiStore } from '@/stores/api-store';
import { GROUP_COLORS, useGroupsStore } from '@/stores/groups-store';
import { useNotificationsStore } from '@/stores/notifications-store';
import { useRoadmapStore } from '@/stores/roadmap-store';
import { useTeamStore } from '@/stores/team-store';

const DEMO_SEED_MARKER = 'devos:demo-local-seed-v2';

const SEED_PROJECT_CORE = 'seed-project-devos';
const SEED_PROJECT_MOBILE = 'seed-project-mobile';
const SEED_PROJECT_API = 'seed-project-api';

const LINKS_KEY = 'devos:project-links';

function saveProjectLinks(projectId: string, links: { figma?: string; git?: string }) {
  try {
    const all = JSON.parse(readScopedItem(LINKS_KEY) ?? '{}') as Record<string, { figma?: string; git?: string }>;
    all[projectId] = links;
    writeScopedItem(LINKS_KEY, JSON.stringify(all));
  } catch {
    writeScopedItem(LINKS_KEY, JSON.stringify({ [projectId]: links }));
  }
}

/** Локальные демо-данные для UI-секций без backend sync. */
export function applyDemoLocalSeed(projects: Project[], userEmail?: string | null) {
  if (userEmail !== 'owner@devos.local') return;
  if (readScopedItem(DEMO_SEED_MARKER)) return;

  const core = projects.find((p) => p.id === SEED_PROJECT_CORE);
  const mobile = projects.find((p) => p.id === SEED_PROJECT_MOBILE);
  const apiProject = projects.find((p) => p.id === SEED_PROJECT_API);
  if (!core) return;

  saveProjectLinks(SEED_PROJECT_CORE, {
    git: 'https://github.com/devos/core',
    figma: 'https://www.figma.com/file/devos-design-system',
  });
  if (mobile) {
    saveProjectLinks(SEED_PROJECT_MOBILE, {
      git: 'https://github.com/devos/mobile',
    });
  }

  const groups = useGroupsStore.getState();
  if (groups.groups.length === 0) {
    groups.add('Platform', GROUP_COLORS[0]);
    groups.add('Go-to-market', GROUP_COLORS[2]);
  }

  const roadmap = useRoadmapStore.getState();
  for (const p of [core, mobile, apiProject].filter(Boolean) as Project[]) {
    roadmap.seedProject(p.id);
    const cols = roadmap.columns.filter((c) => c.projectId === p.id);
    const planned = cols.find((c) => c.name === 'Planned');
    const progress = cols.find((c) => c.name === 'In Progress');
    const done = cols.find((c) => c.name === 'Done');
    if (planned) {
      roadmap.addCard({ projectId: p.id, columnId: planned.id, title: 'MVP scope', description: 'Минимальный набор фич' });
      roadmap.addCard({ projectId: p.id, columnId: planned.id, title: 'Beta feedback', description: 'Сбор обратной связи' });
    }
    if (progress) {
      roadmap.addCard({ projectId: p.id, columnId: progress.id, title: 'Core sync', description: 'Bootstrap + persist' });
    }
    if (done && p.id === SEED_PROJECT_CORE) {
      roadmap.addCard({ projectId: p.id, columnId: done.id, title: 'Auth module', description: 'JWT access + refresh' });
    }
  }

  const apiStore = useApiStore.getState();
  if (apiProject && !apiStore.endpoints.some((e) => e.projectId === apiProject.id)) {
    apiStore.add({ projectId: apiProject.id, name: 'Health check', method: 'GET', url: 'http://localhost:3333/health' });
    apiStore.add({ projectId: apiProject.id, name: 'Login', method: 'POST', url: 'http://localhost:3333/api/auth/login' });
    apiStore.add({ projectId: apiProject.id, name: 'List projects', method: 'GET', url: 'http://localhost:3333/api/projects' });
  }
  if (!apiStore.endpoints.some((e) => e.projectId === core.id)) {
    apiStore.add({ projectId: core.id, name: 'Workspace docs', method: 'GET', url: 'http://localhost:3333/api/documents' });
  }

  const notifications = useNotificationsStore.getState();
  if (notifications.items.length === 0) {
    notifications.push({
      kind: 'info',
      title: 'Добро пожаловать в DevOS',
      body: 'Demo seed загружен — смотрите проекты, задачи и документацию.',
      href: '/dashboard',
    });
    notifications.push({
      kind: 'deadline',
      title: 'Дедлайн: Projects CRUD + sync',
      body: 'Задача seed-task-3 — через 2 недели',
      href: `/projects/${SEED_PROJECT_CORE}/tasks/seed-task-3`,
    });
    notifications.push({
      kind: 'mention',
      title: 'Alex Dev упомянул вас',
      body: 'Bootstrap готов, можно подключать tasks sync',
      href: `/projects/${SEED_PROJECT_CORE}/tasks/seed-task-3`,
    });
  }

  const team = useTeamStore.getState();
  const existingCoreMembers = team.getProjectMembers(SEED_PROJECT_CORE);
  if (existingCoreMembers.length === 0) {
    useTeamStore.setState((s) => ({
      members: [
        ...s.members,
        {
          id: 'seed-member-owner',
          projectId: SEED_PROJECT_CORE,
          userId: 'seed-user-owner',
          email: 'owner@devos.local',
          name: 'DevOS Owner',
          role: 'OWNER',
          joinedAt: new Date().toISOString(),
        },
        {
          id: 'seed-member-dev1',
          projectId: SEED_PROJECT_CORE,
          userId: 'seed-user-dev1',
          email: 'dev1@devos.local',
          name: 'Alex Dev',
          role: 'DEVELOPER',
          joinedAt: new Date().toISOString(),
        },
        {
          id: 'seed-member-dev2',
          projectId: SEED_PROJECT_CORE,
          userId: 'seed-user-dev2',
          email: 'dev2@devos.local',
          name: 'Maria Frontend',
          role: 'DEVELOPER',
          joinedAt: new Date().toISOString(),
        },
        {
          id: 'seed-member-pm',
          projectId: SEED_PROJECT_CORE,
          userId: 'seed-user-manager',
          email: 'pm@devos.local',
          name: 'Ivan PM',
          role: 'MANAGER',
          joinedAt: new Date().toISOString(),
        },
      ],
      invites: [
        ...s.invites,
        {
          id: 'seed-invite-pending',
          projectId: SEED_PROJECT_CORE,
          projectName: core.name,
          email: 'newhire@devos.local',
          role: 'DEVELOPER',
          token: 'DEMOINVITE01',
          status: 'PENDING',
          invitedBy: 'seed-user-owner',
          invitedByName: 'DevOS Owner',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        },
      ],
    }));
  }

  auditLog({ kind: 'system', action: 'demo-seed', title: 'Demo data loaded', meta: 'local UI seed v2' });

  writeScopedItem(DEMO_SEED_MARKER, new Date().toISOString());
}
