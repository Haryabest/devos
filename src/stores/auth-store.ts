import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { upsertSavedAccount } from '@/lib/saved-accounts';
import { onAuthLogout, onAuthScopeSwitch } from '@/lib/storage-scope';
import type { AuthResponse, User } from '@/shared/types';

export const GUEST_USER: User = {
  id: 'guest',
  email: 'guest@devos.local',
  name: 'Гость',
};

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isGuest: boolean;
  workspaceId: string | null;
  setSession: (r: AuthResponse) => void;
  setGuest: () => void;
  setWorkspaceId: (id: string) => void;
  updateUser: (user: Partial<User>) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isGuest: false,
      workspaceId: null,
      setSession: (r) => {
        set({
          user: r.user,
          accessToken: r.tokens.accessToken,
          refreshToken: r.tokens.refreshToken,
          isGuest: false,
          workspaceId: null,
        });
        upsertSavedAccount(r.user, r.tokens.refreshToken);
        onAuthScopeSwitch();
      },
      setGuest: () => {
        set({
          user: GUEST_USER,
          accessToken: null,
          refreshToken: null,
          isGuest: true,
          workspaceId: null,
        });
        onAuthScopeSwitch();
      },
      setWorkspaceId: (id) => set({ workspaceId: id }),
      updateUser: (patch) =>
        set((s) => ({
          user: s.user ? { ...s.user, ...patch } : s.user,
        })),
      clear: () => {
        set({ user: null, accessToken: null, refreshToken: null, isGuest: false, workspaceId: null });
        onAuthLogout();
      },
    }),
    { name: 'devos:auth' },
  ),
);
