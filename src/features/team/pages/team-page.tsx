import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ConfirmDeleteDialog, type DeleteConfirmState } from '@/components/ui/confirm-delete-dialog';
import { getInviteLink, subscribeSyncStatus } from '@/lib/sync-engine';
import { useProjectsStore } from '@/stores/projects-store';
import { pullInvitesFromPool, useTeamStore } from '@/stores/team-store';
import { useAuthStore } from '@/stores/auth-store';
import type { ProjectMember, Role, TeamInvite } from '@/shared/types';
import { SyncStatusBadge } from '@/features/team/components/sync-status-badge';
import { PendingInvitesCard } from '@/features/team/components/pending-invites-card';
import { InviteForm } from '@/features/team/components/invite-form';
import { ProjectMembersCard } from '@/features/team/components/project-members-card';
import { SentInvitesCard } from '@/features/team/components/sent-invites-card';
import { JoinCodeCard } from '@/features/team/components/join-code-card';

export function TeamPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const projects = useProjectsStore((s) => s.projects);
  const members = useTeamStore((s) => s.members);
  const invites = useTeamStore((s) => s.invites);
  const syncRooms = useTeamStore((s) => s.syncRooms);
  const inviteToProject = useTeamStore((s) => s.inviteToProject);
  const acceptInvite = useTeamStore((s) => s.acceptInvite);
  const declineInvite = useTeamStore((s) => s.declineInvite);
  const removeMember = useTeamStore((s) => s.removeMember);
  const removeInvite = useTeamStore((s) => s.removeInvite);
  const updateMemberRole = useTeamStore((s) => s.updateMemberRole);
  const joinSyncRoom = useTeamStore((s) => s.joinSyncRoom);

  const [syncLive, setSyncLive] = useState(false);
  const [joinCode, setJoinCode] = useState(params.get('join') ?? '');
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);

  useEffect(() => subscribeSyncStatus(setSyncLive), []);

  useEffect(() => {
    const pool = pullInvitesFromPool();
    const existing = new Set(useTeamStore.getState().invites.map((i) => i.id));
    const fresh = pool.filter((i) => !existing.has(i.id));
    if (fresh.length > 0) {
      useTeamStore.setState((s) => ({ invites: [...fresh, ...s.invites] }));
    }
  }, []);

  const joinParam = params.get('join');
  useEffect(() => {
    if (joinParam) setJoinCode(joinParam);
  }, [joinParam]);

  const myPending = useMemo(() => {
    const mail = user?.email?.toLowerCase();
    if (!mail) return [];
    return invites.filter(
      (i) => i.status === 'PENDING' && i.email === mail && new Date(i.expiresAt) > new Date(),
    );
  }, [invites, user?.email]);

  const sentInvites = useMemo(
    () => invites.filter((i) => i.invitedBy === user?.id),
    [invites, user?.id],
  );

  function handleInvite(data: { projectId: string; email: string; role: Role }) {
    const project = projects.find((p) => p.id === data.projectId);
    if (!project) return null;
    const inv = inviteToProject({
      projectId: project.id,
      projectName: project.name,
      email: data.email,
      role: data.role,
    });
    joinSyncRoom(project.id);
    return getInviteLink(inv.token);
  }

  function handleAccept(token: string) {
    const inv = acceptInvite(token);
    if (inv) {
      joinSyncRoom(inv.projectId);
      setJoinCode('');
      params.delete('join');
      setParams(params, { replace: true });
      navigate(`/projects/${inv.projectId}`);
    }
  }

  async function copyLink(link: string) {
    await navigator.clipboard.writeText(link);
  }

  function confirmRemoveMember(member: ProjectMember) {
    setDeleteConfirm({
      title: 'Удалить участника?',
      description: `${member.name} потеряет доступ к проекту.`,
      onConfirm: () => removeMember(member.id),
    });
  }

  function confirmRevokeInvite(invite: TeamInvite) {
    setDeleteConfirm({
      title: 'Отозвать приглашение?',
      description: `Приглашение для ${invite.email} будет удалено.`,
      onConfirm: () => removeInvite(invite.id),
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Команда</h1>
          <p className="text-sm text-muted-foreground">
            Приглашайте в проекты с любой ролью. Изменения синхронизируются в реальном времени.
          </p>
        </div>
        <SyncStatusBadge syncLive={syncLive} />
      </header>

      <PendingInvitesCard
        invites={myPending}
        joinCode={joinCode}
        onJoinCodeChange={setJoinCode}
        onDecline={declineInvite}
        onAccept={handleAccept}
      />

      <InviteForm
        projects={projects}
        onNavigateToProjects={() => navigate('/projects')}
        onInvite={handleInvite}
      />

      <ProjectMembersCard
        projects={projects}
        members={members}
        syncRooms={syncRooms}
        onOpenProject={(id) => navigate(`/projects/${id}`)}
        onUpdateRole={updateMemberRole}
        onRemoveMember={confirmRemoveMember}
      />

      <SentInvitesCard
        invites={sentInvites}
        onCopyLink={copyLink}
        onRevoke={confirmRevokeInvite}
      />

      <JoinCodeCard
        joinCode={joinCode}
        onJoinCodeChange={setJoinCode}
        onAccept={handleAccept}
      />

      <ConfirmDeleteDialog
        open={deleteConfirm !== null}
        onOpenChange={(o) => !o && setDeleteConfirm(null)}
        title={deleteConfirm?.title}
        description={deleteConfirm?.description}
        onConfirm={() => deleteConfirm?.onConfirm()}
      />
    </div>
  );
}
