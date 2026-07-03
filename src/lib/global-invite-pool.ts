import type { TeamInvite } from '@/shared/types';

/** Общий пул приглашений (не привязан к аккаунту) — для кодов на одном устройстве. */
export const GLOBAL_INVITE_POOL_KEY = 'devos:global-invite-pool';

export function readGlobalInvitePool(): TeamInvite[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(GLOBAL_INVITE_POOL_KEY) ?? '[]') as TeamInvite[];
  } catch {
    return [];
  }
}

export function writeGlobalInvitePool(pool: TeamInvite[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(GLOBAL_INVITE_POOL_KEY, JSON.stringify(pool.slice(0, 200)));
}

export function upsertGlobalInvite(invite: TeamInvite): void {
  const pool = readGlobalInvitePool().filter((i) => i.id !== invite.id);
  pool.unshift(invite);
  writeGlobalInvitePool(pool);
}

export function findGlobalInviteByToken(token: string): TeamInvite | undefined {
  const upper = token.toUpperCase();
  return readGlobalInvitePool().find((i) => i.token === upper && i.status === 'PENDING');
}

export function syncGlobalInvitesIntoTeamStore(
  merge: (fresh: TeamInvite[]) => void,
): () => void {
  if (typeof window === 'undefined') return () => {};

  const apply = () => {
    const pool = readGlobalInvitePool().filter((i) => i.status === 'PENDING');
    if (pool.length > 0) merge(pool);
  };

  apply();

  const onStorage = (e: StorageEvent) => {
    if (e.key === GLOBAL_INVITE_POOL_KEY) apply();
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}
