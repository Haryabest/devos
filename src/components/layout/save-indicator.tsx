import { useEffect, useRef } from 'react';
import * as Icons from '@/components/ui/icons';
import { useSaveStore } from '@/stores/save-store';
import { cn } from '@/lib/utils';

/**
 * Глобальный индикатор автосохранения в titlebar.
 * pending — есть несохранённые изменения (debounce).
 * saving — запись в localStorage.
 * saved — успешно сохранено.
 */
export function SaveIndicator() {
  const status = useSaveStore((s) => s.status);
  const lastSavedAt = useSaveStore((s) => s.lastSavedAt);

  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (status !== 'saved') return;
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => {
      useSaveStore.setState({ status: 'idle' });
    }, 2500);
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, [status, lastSavedAt]);

  if (status === 'idle' && !lastSavedAt) return null;

  const time = lastSavedAt
    ? new Date(lastSavedAt).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  if (status === 'pending' || status === 'saving') {
    return (
      <div
        className="pointer-events-none flex items-center gap-1.5 text-xs text-muted-foreground"
        title="Идёт автосохранение…"
      >
        <Icons.Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
        <span>{status === 'pending' ? 'Изменения…' : 'Сохранение…'}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'pointer-events-none flex items-center gap-1.5 text-xs transition-colors',
        status === 'saved' ? 'text-emerald-500' : 'text-muted-foreground',
      )}
      title={lastSavedAt ? `Последнее сохранение: ${new Date(lastSavedAt).toLocaleString('ru-RU')}` : 'Сохранено'}
    >
      <Icons.Cloud className="h-3.5 w-3.5" />
      <span className="tabular-nums">{time ? `Сохранено ${time}` : 'Сохранено'}</span>
    </div>
  );
}
