import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function ChartCard({ title, subtitle, description, actions, children }: ChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            {subtitle || description ? <p className="text-sm text-muted-foreground">{subtitle ?? description}</p> : null}
          </div>
          {actions ? <div>{actions}</div> : null}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

