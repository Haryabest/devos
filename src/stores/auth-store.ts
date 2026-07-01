import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
  setSession: (r: AuthResponse) => void;
  setGuest: () => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isGuest: false,
      setSession: (r) =>
        set({
          user: r.user,
          accessToken: r.tokens.accessToken,
          refreshToken: r.tokens.refreshToken,
          isGuest: false,
        }),
      setGuest: () =>
        set({
          user: GUEST_USER,
          accessToken: null,
          refreshToken: null,
          isGuest: true,
        }),
      clear: () =>
        set({ user: null, accessToken: null, refreshToken: null, isGuest: false }),
    }),
    { name: 'devos:auth' },
  ),
);
