const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateCallCode(length = 6): string {
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]!;
  }
  return code;
}

/** Нормализует ввод: DEV-ABC123 → ABC123 */
export function normalizeCallCode(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/^DEV-?/i, '')
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8);
}

export function formatCallCode(code: string): string {
  const n = normalizeCallCode(code);
  return n ? `DEV-${n}` : '';
}

/** Ключ комнаты для joinCallRoom (без ::call суффикса). */
export function callRoomKeyFromCode(code: string): string {
  const n = normalizeCallCode(code);
  if (!n) throw new Error('Неверный код созвона');
  return `call-${n}`;
}

export function buildCallShareUrl(code: string): string {
  const n = normalizeCallCode(code);
  if (typeof window === 'undefined') return `/calls?code=${n}`;
  return `${window.location.origin}/calls?code=${n}`;
}
