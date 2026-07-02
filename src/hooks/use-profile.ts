import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { User } from '@/shared/types';

export interface ProfileUser extends User {
  createdAt?: string;
}

interface UpdateProfileDto {
  name?: string;
  email?: string;
  avatarUrl?: string | null;
}

interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export function useUpdateProfile() {
  const updateUser = useAuthStore((s) => s.updateUser);
  return useMutation({
    mutationFn: (dto: UpdateProfileDto) =>
      api<ProfileUser>('/users/me', { method: 'PATCH', body: JSON.stringify(dto) }),
    onSuccess: (user) => updateUser(user),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (dto: ChangePasswordDto) =>
      api<void>('/auth/change-password', { method: 'POST', body: JSON.stringify(dto) }),
  });
}

export function useProfileQuery() {
  const isGuest = useAuthStore((s) => s.isGuest);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<ProfileUser | null>(null);

  useEffect(() => {
    if (isGuest || !accessToken) return;
    let cancelled = false;
    setLoading(true);
    api<ProfileUser>('/users/me')
      .then((user) => {
        if (!cancelled) {
          useAuthStore.getState().updateUser(user);
          setProfile(user);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isGuest, accessToken]);

  return { loading: !isGuest && !!accessToken && loading, profile };
}
