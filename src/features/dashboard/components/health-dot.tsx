export function HealthDot({ color, count }: { color: string; count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="tabular-nums">{count}</span>
    </span>
  );
}
