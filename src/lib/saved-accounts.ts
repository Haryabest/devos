import { api } from '@/lib/api';
import type { AuthResponse, User } from '@/shared/types';

const STORAGE_KEY = 'devos:saved-accounts';

export interface SavedAccount {
  userId: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  refreshToken: string;
  lastUsedAt: string;
}

function readAll(): SavedAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedAccount[]) : [];
  } catch {
    return [];
  }
}

function writeAll(accounts: SavedAccount[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

export function listSavedAccounts(): SavedAccount[] {
  return readAll().sort(
    (a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime(),
  );
}

export function getLastSavedAccount(): SavedAccount | null {
  return listSavedAccounts()[0] ?? null;
}

export function upsertSavedAccount(user: User, refreshToken: string) {
  const now = new Date().toISOString();
  const accounts = readAll().filter((a) => a.userId !== user.id);
  accounts.unshift({
    userId: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    refreshToken,
    lastUsedAt: now,
  });
  writeAll(accounts.slice(0, 8));
}

export function removeSavedAccount(userId: string) {
  writeAll(readAll().filter((a) => a.userId !== userId));
}

export async function switchToSavedAccount(account: SavedAccount): Promise<AuthResponse> {
  const data = await api<AuthResponse>('/auth/refresh', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ refreshToken: account.refreshToken }),
  });
  upsertSavedAccount(data.user, data.tokens.refreshToken);
  return data;
}
