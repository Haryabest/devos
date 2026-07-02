/** Форматирует ввод в маску +7 (XXX) XXX-XX-XX */
export function formatPhoneRu(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  let d = digits;
  if (d.startsWith('8')) d = '7' + d.slice(1);
  if (d.startsWith('7')) d = d.slice(1);
  d = d.slice(0, 10);

  if (d.length === 0) return '';
  if (d.length <= 3) return `+7 (${d}`;
  if (d.length <= 6) return `+7 (${d.slice(0, 3)}) ${d.slice(3)}`;
  if (d.length <= 8) return `+7 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return `+7 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8, 10)}`;
}

export function phoneToDigits(formatted: string): string {
  const digits = formatted.replace(/\D/g, '');
  if (digits.startsWith('7')) return digits;
  if (digits.startsWith('8')) return '7' + digits.slice(1);
  return digits ? '7' + digits : '';
}
