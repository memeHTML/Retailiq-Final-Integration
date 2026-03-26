import { cn } from '@/utils/cn';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
}

export function Progress({ value, max = 100, className }: ProgressProps) {
  const clamped = Math.max(0, Math.min(value, max));
  const width = `${(clamped / max) * 100}%`;

  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-bg-muted', className)} role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={max}>
      <div className="h-full rounded-full bg-primary transition-[width]" style={{ width }} />
    </div>
  );
}
