import { useCallback, useState } from 'react';
import { cn } from '@/lib/utils';

export function useResizableWidth(
  defaultWidth: number,
  storageKey: string,
  minWidth: number,
  maxWidth: number,
): [number, (width: number) => void] {
  const [width, setWidthState] = useState(() => {
    if (typeof window === 'undefined') return defaultWidth;
    const raw = localStorage.getItem(storageKey);
    if (!raw) return defaultWidth;
    const n = Number.parseInt(raw, 10);
    if (Number.isNaN(n)) return defaultWidth;
    return Math.min(maxWidth, Math.max(minWidth, n));
  });

  const setWidth = useCallback(
    (next: number) => {
      const clamped = Math.min(maxWidth, Math.max(minWidth, next));
      setWidthState(clamped);
      localStorage.setItem(storageKey, String(clamped));
    },
    [storageKey, minWidth, maxWidth],
  );

  return [width, setWidth];
}

interface ResizablePanelEdgeProps {
  side: 'left' | 'right';
  width: number;
  onWidthChange: (width: number) => void;
  minWidth: number;
  maxWidth: number;
  className?: string;
}

export function ResizablePanelEdge({
  side,
  width,
  onWidthChange,
  minWidth,
  maxWidth,
  className,
}: ResizablePanelEdgeProps) {
  function onMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = width;

    function onMove(ev: MouseEvent) {
      const delta = side === 'left' ? ev.clientX - startX : startX - ev.clientX;
      onWidthChange(Math.min(maxWidth, Math.max(minWidth, startW + delta)));
    }

    function onUp() {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-valuenow={width}
      aria-valuemin={minWidth}
      aria-valuemax={maxWidth}
      onMouseDown={onMouseDown}
      className={cn(
        'relative z-10 w-1 shrink-0 cursor-col-resize bg-border/40 transition-colors hover:bg-primary/40',
        className,
      )}
    >
      <div className="absolute inset-y-0 -left-1.5 -right-1.5" />
    </div>
  );
}
