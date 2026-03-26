import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/Card';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  helperText?: string;
}

export function StatCard({ label, value, icon, helperText }: StatCardProps) {
  return (
    <Card>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">{label}</div>
          {icon ? <div>{icon}</div> : null}
        </div>
        <div className="text-2xl font-semibold">{value}</div>
        {helperText ? <div className="text-sm text-muted-foreground">{helperText}</div> : null}
      </CardContent>
    </Card>
  );
}

