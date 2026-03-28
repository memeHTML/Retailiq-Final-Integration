import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: ReactNode;
  trend?: ReactNode;
  icon?: ReactNode;
  description?: ReactNode;
}

export function StatCard({ label, value, trend, icon, description }: StatCardProps) {
  return (
    <section className="card" style={{ padding: '1rem 1.1rem' }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="mt-1 text-2xl font-semibold">{value}</div>
          {description ? <div className="mt-1 text-xs text-muted-foreground">{description}</div> : null}
        </div>
        {icon ? <div>{icon}</div> : null}
      </div>
      {trend ? <div className="mt-3 text-xs">{trend}</div> : null}
    </section>
  );
}

export default StatCard;
