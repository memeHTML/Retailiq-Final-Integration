import type { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function ChartCard({ title, subtitle, children, actions }: ChartCardProps) {
  return (
    <section className="card" style={{ padding: '1rem 1.1rem' }}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="m-0 text-base font-semibold">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {actions ? <div>{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

export default ChartCard;
