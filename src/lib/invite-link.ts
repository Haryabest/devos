import type { TeamInvite } from '@/shared/types';

export interface ParsedJoinInput {
  token: string;
  payload: TeamInvite | null;
}

export type AcceptInviteResult =
  | { ok: true; invite: TeamInvite }
  | { ok: false; reason: 'auth' | 'invalid' | 'not_found' | 'expired' };

export function encodeInvitePayload(invite: TeamInvite): string {
  const json = JSON.stringify({
    id: invite.id,
    projectId: invite.projectId,
    projectName: invite.projectName,
    email: invite.email,
    role: invite.role,
    token: invite.token,
    status: invite.status,
    invitedBy: invite.invitedBy,
    invitedByName: invite.invitedByName,
    createdAt: invite.createdAt,
    expiresAt: invite.expiresAt,
    bundle: invite.bundle,
  });
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function decodeInvitePayload(encoded: string): TeamInvite | null {
  try {
    const pad = encoded.length % 4;
    const b64 =
      encoded.replace(/-/g, '+').replace(/_/g, '/') + (pad ? '='.repeat(4 - pad) : '');
    const json = decodeURIComponent(escape(atob(b64)));
    return JSON.parse(json) as TeamInvite;
  } catch {
    return null;
  }
}

export function buildInviteLink(invite: TeamInvite): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  const p = encodeInvitePayload(invite);
  return `${base}/team?join=${invite.token}&p=${encodeURIComponent(p)}`;
}

export function parseJoinInput(input: string): ParsedJoinInput | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (trimmed.includes('join=') || trimmed.includes('/team')) {
    try {
      const url = new URL(
        trimmed.startsWith('http') ? trimmed : `http://local${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`,
      );
      const token = url.searchParams.get('join')?.toUpperCase() ?? '';
      const rawP = url.searchParams.get('p');
      const payload = rawP ? decodeInvitePayload(decodeURIComponent(rawP)) : null;
      if (token) return { token, payload };
    } catch {
      /* plain code below */
    }
  }

  const token = trimmed.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
  if (!token) return null;
  return { token, payload: null };
}

export function parseJoinSearchParams(params: URLSearchParams): ParsedJoinInput | null {
  const token = params.get('join')?.toUpperCase();
  if (!token) return null;
  const rawP = params.get('p');
  const payload = rawP ? decodeInvitePayload(decodeURIComponent(rawP)) : null;
  return { token, payload };
}

export const ACCEPT_INVITE_ERRORS: Record<
  Exclude<AcceptInviteResult, { ok: true }>['reason'],
  string
> = {
  auth: 'Войдите в аккаунт, чтобы принять приглашение.',
  invalid: 'Неверный код или ссылка.',
  not_found:
    'Приглашение не найдено. Попросите отправить полную ссылку — одного кода недостаточно на другом устройстве.',
  expired: 'Срок действия приглашения истёк.',
};
