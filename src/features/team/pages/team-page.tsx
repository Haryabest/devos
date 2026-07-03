import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ConfirmDeleteDialog, type DeleteConfirmState } from '@/components/ui/confirm-delete-dialog';
import { getInviteLink, requestCollaborationSync, subscribeSyncStatus } from '@/lib/sync-engine';
import { syncGlobalInvitesIntoTeamStore } from '@/lib/global-invite-pool';
import { ACCEPT_INVITE_ERRORS, parseJoinSearchParams } from '@/lib/invite-link';
import { useProjectsStore } from '@/stores/projects-store';
import { useTeamStore } from '@/stores/team-store';
import { useAuthStore } from '@/stores/auth-store';
import type { ProjectMember, Role, TeamInvite } from '@/shared/types';
import { SyncStatusBadge } from '@/features/team/components/sync-status-badge';
import { PendingInvitesCard } from '@/features/team/components/pending-invites-card';
import { InviteForm } from '@/features/team/components/invite-form';
import { ProjectMembersCard } from '@/features/team/components/project-members-card';
import { SentInvitesCard } from '@/features/team/components/sent-invites-card';
import { JoinCodeCard } from '@/features/team/components/join-code-card';
import { PageContainer } from '@/components/layout/page-container';

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
  const mergePendingInvites = useTeamStore((s) => s.mergePendingInvites);

  const [syncLive, setSyncLive] = useState(false);
  const [joinCode, setJoinCode] = useState(params.get('join') ?? '');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);
  const autoJoinAttempted = useRef(false);

  useEffect(() => subscribeSyncStatus(setSyncLive), []);

  useEffect(() => syncGlobalInvitesIntoTeamStore(mergePendingInvites), [mergePendingInvites]);

  const joinParam = params.get('join');
  useEffect(() => {
    if (joinParam) setJoinCode(joinParam);
  }, [joinParam]);

  useEffect(() => {
    if (!user || autoJoinAttempted.current) return;
    const parsed = parseJoinSearchParams(params);
    if (!parsed) return;
    autoJoinAttempted.current = true;
    const result = acceptInvite(parsed);
    if (result.ok) {
      joinSyncRoom(result.invite.projectId);
      requestCollaborationSync();
      setJoinCode('');
      params.delete('join');
      params.delete('p');
      setParams(params, { replace: true });
      navigate(`/projects/${result.invite.projectId}`);
    }
  }, [user?.id, params, acceptInvite, joinSyncRoom, navigate, setParams]);

  const myPending = useMemo(() => {
    const mail = user?.email?.toLowerCase();
    if (!mail) return [];
    return invites.filter(
      (i) =>
        i.status === 'PENDING' &&
        (i.email === '*' || i.email === mail) &&
        new Date(i.expiresAt) > new Date(),
    );
  }, [invites, user?.email]);

  const sentInvites = useMemo(
    () => invites.filter((i) => i.invitedBy === user?.id),
    [invites, user?.id],
  );

  function handleInvite(data: { projectId: string; role: Role }) {
    const project = projects.find((p) => p.id === data.projectId);
    if (!project) return null;
    const inv = inviteToProject({
      projectId: project.id,
      projectName: project.name,
      role: data.role,
    });
    joinSyncRoom(project.id);
    return getInviteLink(inv);
  }

  function handleAccept(input: string | ReturnType<typeof parseJoinSearchParams>, silent = false) {
    if (!input) return;
    setJoinError(null);
    const result = acceptInvite(input);
    if (result.ok) {
      joinSyncRoom(result.invite.projectId);
      requestCollaborationSync();
      setJoinCode('');
      params.delete('join');
      params.delete('p');
      setParams(params, { replace: true });
      navigate(`/projects/${result.invite.projectId}`);
      return;
    }
    if (!silent) setJoinError(ACCEPT_INVITE_ERRORS[result.reason]);
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
      description: `Приглашение ${invite.token} будет удалено.`,
      onConfirm: () => removeInvite(invite.id),
    });
  }

  return (
    <PageContainer>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Команда</h1>
          <p className="text-sm text-muted-foreground">
            Создайте код и отправьте ссылку — коллега откроет проект без почты. Live sync работает
            между вкладками одного приложения.
          </p>
        </div>
        <SyncStatusBadge syncLive={syncLive} />
      </header>

      {joinError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {joinError}
        </div>
      )}

      <PendingInvitesCard
        invites={myPending}
        joinCode={joinCode}
        onJoinCodeChange={setJoinCode}
        onDecline={declineInvite}
        onAccept={(raw) => handleAccept(raw)}
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
        onAccept={(raw) => handleAccept(raw)}
        error={joinError}
      />

      <ConfirmDeleteDialog
        open={deleteConfirm !== null}
        onOpenChange={(o) => !o && setDeleteConfirm(null)}
        title={deleteConfirm?.title}
        description={deleteConfirm?.description}
        onConfirm={() => deleteConfirm?.onConfirm()}
      />
    </PageContainer>
  );
}
