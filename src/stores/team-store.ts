import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createScopedPersistStorage } from '@/lib/scoped-storage';
import {
  findGlobalInviteByToken,
  readGlobalInvitePool,
  upsertGlobalInvite,
} from '@/lib/global-invite-pool';
import {
  parseJoinInput,
  type AcceptInviteResult,
  type ParsedJoinInput,
} from '@/lib/invite-link';
import type { ProjectMember, Role, TeamInvite } from '@/shared/types';
import { useSaveStore } from '@/stores/save-store';
import { useAuthStore } from '@/stores/auth-store';
import { useProjectsStore } from '@/stores/projects-store';
import { useTasksStore } from '@/stores/tasks-store';
import { useDocsStore } from '@/stores/docs-store';
import { useApiStore } from '@/stores/api-store';
import type { ProjectInviteBundle } from '@/shared/types';

export const INVITE_ROLES: Role[] = ['ADMIN', 'MANAGER', 'DEVELOPER', 'VIEWER', 'GUEST'];

interface TeamState {
  members: ProjectMember[];
  invites: TeamInvite[];
  syncRooms: string[];

  inviteToProject: (input: {
    projectId: string;
    projectName: string;
    email?: string;
    role: Role;
  }) => TeamInvite;
  acceptInvite: (input: string | ParsedJoinInput) => AcceptInviteResult;
  declineInvite: (token: string) => void;
  removeMember: (memberId: string) => void;
  removeInvite: (inviteId: string) => void;
  updateMemberRole: (memberId: string, role: Role) => void;
  joinSyncRoom: (projectId: string) => void;
  leaveSyncRoom: (projectId: string) => void;
  getProjectMembers: (projectId: string) => ProjectMember[];
  getPendingInvites: () => TeamInvite[];
  mergePendingInvites: (fresh: TeamInvite[]) => void;
  getJoinedProjectIds: () => string[];
  isJoinedProject: (projectId: string) => boolean;
}

function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function inviteToken(): string {
  return uid().replace(/-/g, '').slice(0, 12).toUpperCase();
}

function markSaved() {
  useSaveStore.getState().markSaved();
}

export function pullInvitesFromPool(): TeamInvite[] {
  return readGlobalInvitePool();
}

export function findInviteByToken(token: string): TeamInvite | undefined {
  const upper = token.toUpperCase();
  const local = useTeamStore.getState().invites.find((i) => i.token === upper);
  if (local) return local;
  return findGlobalInviteByToken(upper);
}

function buildProjectBundle(projectId: string): ProjectInviteBundle | undefined {
  const project = useProjectsStore.getState().projects.find((p) => p.id === projectId);
  if (!project) return undefined;
  return {
    project,
    columns: useTasksStore.getState().columns.filter((c) => c.projectId === projectId),
    tasks: useTasksStore.getState().tasks.filter((t) => t.projectId === projectId),
    docs: useDocsStore.getState().docs.filter((d) => d.projectId === projectId),
    endpoints: useApiStore.getState().endpoints.filter((e) => e.projectId === projectId),
  };
}

function mergeProjectBundle(bundle: ProjectInviteBundle) {
  const pid = bundle.project.id;
  useProjectsStore.setState((s) => ({
    projects: s.projects.some((p) => p.id === pid) ? s.projects : [...s.projects, bundle.project],
  }));
  useTasksStore.setState((s) => ({
    columns: [...s.columns.filter((c) => c.projectId !== pid), ...bundle.columns],
    tasks: [...s.tasks.filter((t) => t.projectId !== pid), ...bundle.tasks],
  }));
  useDocsStore.setState((s) => ({
    docs: [...s.docs.filter((d) => d.projectId !== pid), ...bundle.docs],
  }));
  useApiStore.setState((s) => ({
    endpoints: [...s.endpoints.filter((e) => e.projectId !== pid), ...bundle.endpoints],
  }));
}

function resolveJoinInput(input: string | ParsedJoinInput): ParsedJoinInput | null {
  if (typeof input === 'string') return parseJoinInput(input);
  return input;
}

function findPendingInvite(token: string, payload: TeamInvite | null): TeamInvite | undefined {
  const upper = token.toUpperCase();
  const local = useTeamStore.getState().invites.find((i) => i.token === upper && i.status === 'PENDING');
  if (local) return local;

  const global = findGlobalInviteByToken(upper);
  if (global) return global;

  if (payload?.token === upper && payload.status === 'PENDING') return payload;
  return undefined;
}

export const useTeamStore = create<TeamState>()(
  persist(
    (set, get) => ({
      members: [],
      invites: [],
      syncRooms: [],

      inviteToProject: (input) => {
        const user = useAuthStore.getState().user;
        const bundle = buildProjectBundle(input.projectId);
        const invite: TeamInvite = {
          id: uid(),
          projectId: input.projectId,
          projectName: input.projectName,
          email: input.email?.trim().toLowerCase() || '*',
          role: input.role,
          token: inviteToken(),
          status: 'PENDING',
          invitedBy: user?.id ?? 'unknown',
          invitedByName: user?.name ?? 'DevOS',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          bundle,
        };
        set((s) => ({ invites: [invite, ...s.invites] }));
        upsertGlobalInvite(invite);
        get().joinSyncRoom(input.projectId);
        markSaved();
        return invite;
      },

      acceptInvite: (input) => {
        const user = useAuthStore.getState().user;
        if (!user) return { ok: false, reason: 'auth' };

        const parsed = resolveJoinInput(input);
        if (!parsed) return { ok: false, reason: 'invalid' };

        const invite = findPendingInvite(parsed.token, parsed.payload);
        if (!invite) return { ok: false, reason: 'not_found' };

        if (!get().invites.some((i) => i.id === invite.id)) {
          set((s) => ({ invites: [invite, ...s.invites] }));
        }

        if (new Date(invite.expiresAt) < new Date()) {
          const expired = { ...invite, status: 'EXPIRED' as const };
          set((s) => ({
            invites: s.invites.map((i) => (i.id === invite.id ? expired : i)),
          }));
          upsertGlobalInvite(expired);
          return { ok: false, reason: 'expired' };
        }

        if (invite.bundle) mergeProjectBundle(invite.bundle);

        const member: ProjectMember = {
          id: uid(),
          projectId: invite.projectId,
          userId: user.id,
          email: user.email.toLowerCase(),
          name: user.name,
          role: invite.role,
          joinedAt: new Date().toISOString(),
        };

        const accepted = { ...invite, status: 'ACCEPTED' as const };

        set((s) => ({
          invites: s.invites.map((i) => (i.id === invite.id ? accepted : i)),
          members: [
            ...s.members.filter(
              (m) => !(m.projectId === invite.projectId && m.userId === user.id),
            ),
            member,
          ],
          syncRooms: s.syncRooms.includes(invite.projectId)
            ? s.syncRooms
            : [...s.syncRooms, invite.projectId],
        }));
        upsertGlobalInvite(accepted);
        markSaved();
        return { ok: true, invite: accepted };
      },

      declineInvite: (token) => {
        const upper = token.toUpperCase();
        set((s) => ({
          invites: s.invites.map((i) =>
            i.token === upper ? { ...i, status: 'DECLINED' as const } : i,
          ),
        }));
        const declined = get().invites.find((i) => i.token === upper);
        if (declined) upsertGlobalInvite({ ...declined, status: 'DECLINED' });
        markSaved();
      },

      removeMember: (memberId) => {
        set((s) => ({ members: s.members.filter((m) => m.id !== memberId) }));
        markSaved();
      },

      removeInvite: (inviteId) => {
        set((s) => ({ invites: s.invites.filter((i) => i.id !== inviteId) }));
        markSaved();
      },

      updateMemberRole: (memberId, role) => {
        set((s) => ({
          members: s.members.map((m) => (m.id === memberId ? { ...m, role } : m)),
        }));
        markSaved();
      },

      joinSyncRoom: (projectId) => {
        set((s) => ({
          syncRooms: s.syncRooms.includes(projectId) ? s.syncRooms : [...s.syncRooms, projectId],
        }));
      },

      leaveSyncRoom: (projectId) => {
        set((s) => ({ syncRooms: s.syncRooms.filter((id) => id !== projectId) }));
      },

      getProjectMembers: (projectId) => get().members.filter((m) => m.projectId === projectId),

      getPendingInvites: () => {
        const email = useAuthStore.getState().user?.email?.toLowerCase();
        if (!email) return [];
        return get().invites.filter(
          (i) =>
            i.status === 'PENDING' &&
            (i.email === '*' || i.email === email) &&
            new Date(i.expiresAt) > new Date(),
        );
      },

      mergePendingInvites: (fresh) => {
        const existing = new Set(get().invites.map((i) => i.id));
        const toAdd = fresh.filter((i) => !existing.has(i.id) && i.status === 'PENDING');
        if (toAdd.length === 0) return;
        set((s) => ({ invites: [...toAdd, ...s.invites] }));
      },

      getJoinedProjectIds: () => {
        const userId = useAuthStore.getState().user?.id;
        if (!userId) return [];
        return get()
          .members.filter((m) => m.userId === userId)
          .map((m) => m.projectId);
      },

      isJoinedProject: (projectId) => get().getJoinedProjectIds().includes(projectId),
    }),
    {
      name: 'devos:team',
      skipHydration: true,
      storage: createJSONStorage(() => createScopedPersistStorage('devos:team')),
      version: 1,
    },
  ),
);
