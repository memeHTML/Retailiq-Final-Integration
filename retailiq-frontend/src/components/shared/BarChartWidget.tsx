import type { ReactNode } from 'react';
import { ChartCard } from '@/components/shared/ChartCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { parseApiError } from '@/utils/errors';

interface BarChartWidgetProps<T extends object> {
  title: string;
  subtitle?: string;
  data: T[];
  xKey: keyof T & string;
  yKey: keyof T & string;
  loading?: boolean;
  error?: unknown;
  emptyMessage?: string;
  color?: string;
  horizontal?: boolean;
  valueFormatter?: (value: number) => string;
  labelFormatter?: (value: unknown) => string;
  detailFormatter?: (row: T) => ReactNode;
  actions?: ReactNode;
}

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 1,
});

const getNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function BarChartWidget<T extends object>({
  title,
  subtitle,
  data,
  xKey,
  yKey,
  loading,
  error,
  emptyMessage = 'No data was returned for this chart.',
  color = '#2563eb',
  horizontal = true,
  valueFormatter,
  labelFormatter,
  detailFormatter,
  actions,
}: BarChartWidgetProps<T>) {
  if (loading) {
    return (
      <ChartCard title={title} subtitle={subtitle} actions={actions}>
        <div className="space-y-3">
          <SkeletonLoader variant="rect" height={horizontal ? 260 : 220} />
          <div className="grid gap-2 sm:grid-cols-3">
            <SkeletonLoader variant="text" height={18} />
            <SkeletonLoader variant="text" height={18} />
            <SkeletonLoader variant="text" height={18} />
          </div>
        </div>
      </ChartCard>
    );
  }

  if (error) {
    return (
      <ChartCard title={title} subtitle={subtitle} actions={actions}>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <div className="font-semibold">Unable to load chart data</div>
          <p className="mt-1">{parseApiError(error)}</p>
        </div>
      </ChartCard>
    );
  }

  if (!data.length) {
    return (
      <ChartCard title={title} subtitle={subtitle} actions={actions}>
        <EmptyState title="No chart data" body={emptyMessage} />
      </ChartCard>
    );
  }

  const maxValue = Math.max(...data.map((row) => getNumber((row as Record<string, unknown>)[yKey])), 1);

  if (horizontal) {
    return (
      <ChartCard title={title} subtitle={subtitle} actions={actions}>
        <div className="space-y-3">
          {data.map((row, index) => {
            const record = row as Record<string, unknown>;
            const value = getNumber(record[yKey]);
            const width = `${Math.max(4, (value / maxValue) * 100)}%`;
            return (
              <div key={`${String(record[xKey])}-${index}`} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="font-medium text-foreground">{labelFormatter ? labelFormatter(record[xKey]) : String(record[xKey] ?? '—')}</div>
                  <div className="text-muted-foreground">{valueFormatter ? valueFormatter(value) : currencyFormatter.format(value)}</div>
                </div>
                <div className="h-2.5 rounded-full bg-muted">
                  <div className="h-2.5 rounded-full" style={{ width, backgroundColor: color }} title={valueFormatter ? valueFormatter(value) : currencyFormatter.format(value)} />
                </div>
                {detailFormatter ? <div className="text-xs text-muted-foreground">{detailFormatter(row)}</div> : null}
              </div>
            );
          })}
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title={title} subtitle={subtitle} actions={actions}>
      <div className="space-y-4">
        <div className="grid min-h-[220px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((row, index) => {
            const record = row as Record<string, unknown>;
            const value = getNumber(record[yKey]);
            const height = `${Math.max(8, (value / maxValue) * 100)}%`;
            return (
              <div key={`${String(record[xKey])}-${index}`} className="flex flex-col justify-end rounded-2xl border border-border/70 bg-background p-3">
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-foreground">{labelFormatter ? labelFormatter(record[xKey]) : String(record[xKey] ?? '—')}</div>
                    {detailFormatter ? <div className="text-xs text-muted-foreground">{detailFormatter(row)}</div> : null}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">{valueFormatter ? valueFormatter(value) : currencyFormatter.format(value)}</div>
                </div>
                <div className="flex h-40 items-end">
                  <div className="w-full rounded-t-2xl" style={{ height, backgroundColor: color }} title={valueFormatter ? valueFormatter(value) : currencyFormatter.format(value)} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-xs text-muted-foreground">{percentFormatter.format(data.length)} categories displayed</div>
      </div>
    </ChartCard>
  );
}

export default BarChartWidget;
