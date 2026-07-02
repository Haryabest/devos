import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { switchToSavedAccount, type SavedAccount } from '@/lib/saved-accounts';
import { useAuthStore } from '@/stores/auth-store';
import type { AuthResponse, User } from '@/shared/types';

// ── register ──────────────────────────────────────────────────────────────────

interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export function useRegister() {
  const { setSession } = useAuthStore();
  return useMutation<AuthResponse, Error, RegisterDto>({
    mutationFn: (dto) => api<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(dto) }),
    onSuccess: (data) => setSession(data),
  });
}

// ── login ─────────────────────────────────────────────────────────────────────

interface LoginDto {
  email: string;
  password: string;
}

export function useLogin() {
  const { setSession } = useAuthStore();
  return useMutation<AuthResponse, Error, LoginDto>({
    mutationFn: (dto) => api<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(dto) }),
    onSuccess: (data) => setSession(data),
  });
}

// ── me ────────────────────────────────────────────────────────────────────────

export function useMe() {
  const { accessToken, user } = useAuthStore();
  return useQuery<User>({
    queryKey: ['me', user?.id],
    queryFn: () => api<User>('/auth/me'),
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSwitchAccount() {
  const { setSession } = useAuthStore();
  return useMutation<AuthResponse, Error, SavedAccount>({
    mutationFn: switchToSavedAccount,
    onSuccess: (data) => setSession(data),
  });
}
