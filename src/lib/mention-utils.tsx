export interface MentionCandidate {
  id: string;
  name: string;
  email: string;
}

/** Извлекает @mentions из текста (латиница/кириллица/цифры/_). */
export function parseMentions(text: string): string[] {
  const matches = text.match(/@([\w\u0400-\u04FF.-]+)/g) ?? [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
}

export function resolveMentionTargets(
  text: string,
  candidates: MentionCandidate[],
  currentUserId?: string,
): MentionCandidate[] {
  const tokens = parseMentions(text);
  if (tokens.length === 0) return [];
  return candidates.filter((c) => {
    if (c.id === currentUserId) return false;
    const name = c.name.toLowerCase();
    const email = c.email.split('@')[0]?.toLowerCase() ?? '';
    return tokens.some((t) => name.includes(t) || email === t || c.email.toLowerCase() === t);
  });
}

export function renderMentionText(text: string) {
  const parts = text.split(/(@[\w\u0400-\u04FF.-]+)/g);
  return parts.map((part, i) =>
    part.startsWith('@') ? (
      <span key={i} className="font-medium text-primary">
        {part}
      </span>
    ) : (
      part
    ),
  );
}
