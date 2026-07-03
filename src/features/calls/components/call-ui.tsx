import { useEffect, useRef } from 'react';
import * as Icons from '@/components/ui/icons';
import { cn } from '@/lib/utils';

export function LevelBar({ level, className }: { level: number; className?: string }) {
  const pct = Math.round(Math.min(1, level) * 100);
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-muted', className)}>
      <div
        className="h-full rounded-full bg-emerald-500 transition-[width] duration-75"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function CallVideoTile({
  stream,
  label,
  mirrored,
  micLevel,
  muted,
  micOff,
  cameraOff,
  className,
}: {
  stream: MediaStream | null;
  label: string;
  mirrored?: boolean;
  micLevel?: number;
  muted?: boolean;
  micOff?: boolean;
  cameraOff?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.srcObject = stream;
  }, [stream]);

  const showVideo = stream && !cameraOff && stream.getVideoTracks().some((t) => t.enabled);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border/60 bg-black/90 shadow-sm',
        className,
      )}
    >
      {showVideo ? (
        <video
          ref={ref}
          autoPlay
          playsInline
          muted={muted}
          className={cn('aspect-video w-full object-cover', mirrored && 'scale-x-[-1]')}
        />
      ) : (
        <div className="flex aspect-video flex-col items-center justify-center gap-2 bg-muted/10">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/30 text-lg font-semibold text-muted-foreground">
            {label.charAt(0).toUpperCase()}
          </div>
          {cameraOff && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Icons.VideoOff className="h-3.5 w-3.5" />
              Камера выкл.
            </span>
          )}
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-white">{label}</span>
          {micOff && <Icons.MicOff className="h-3.5 w-3.5 shrink-0 text-red-400" />}
        </div>
        {micLevel !== undefined && <LevelBar level={micLevel} className="mt-2" />}
      </div>
    </div>
  );
}
