import { registerWorkspaceScopeHandler, setStorageScopeGetter } from '@/lib/storage-scope';
import {
  resetWorkspaceOnLogout,
  switchWorkspaceStorageScope,
} from '@/lib/reset-workspace-stores';
import { listSavedAccounts, upsertSavedAccount } from '@/lib/saved-accounts';
import { useAuthStore } from '@/stores/auth-store';

setStorageScopeGetter(() => {
  const { user, isGuest } = useAuthStore.getState();
  if (isGuest) return 'guest';
  if (user?.id) return user.id;
  return 'anonymous';
});

function syncCurrentSessionToSavedAccounts() {
  const { user, refreshToken, isGuest } = useAuthStore.getState();
  if (!user || !refreshToken || isGuest) return;
  const known = listSavedAccounts().some((a) => a.userId === user.id);
  if (!known) upsertSavedAccount(user, refreshToken);
}

useAuthStore.persist.onFinishHydration(() => {
  syncCurrentSessionToSavedAccounts();
});

if (useAuthStore.persist.hasHydrated()) {
  syncCurrentSessionToSavedAccounts();
}

registerWorkspaceScopeHandler(async (mode) => {
  if (mode === 'logout') {
    await resetWorkspaceOnLogout();
    return;
  }
  await switchWorkspaceStorageScope();
});
