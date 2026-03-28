interface ProgressProps {
  value?: number;
  max?: number;
}

export function Progress({ value = 0, max = 100 }: ProgressProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default Progress;
