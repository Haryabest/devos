import { format, parseISO, isValid } from 'date-fns';
import { ru } from 'date-fns/locale';

export function formatDate(value: string | null | undefined, pattern = 'd MMM yyyy'): string {
  if (!value) return '—';
  const d = parseISO(value);
  if (!isValid(d)) return '—';
  return format(d, pattern, { locale: ru });
}

export function formatDateTime(value: string | null | undefined): string {
  return formatDate(value, 'd MMM yyyy, HH:mm');
}

export function toDateInputValue(value: string | null | undefined): string {
  if (!value) return '';
  const d = parseISO(value);
  if (!isValid(d)) return '';
  return format(d, 'yyyy-MM-dd');
}

export function fromDateInputValue(value: string): string | null {
  if (!value) return null;
  return `${value}T00:00:00.000Z`;
}
