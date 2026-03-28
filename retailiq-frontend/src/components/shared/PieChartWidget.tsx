import type { ReactNode } from 'react';
import { ChartCard } from '@/components/shared/ChartCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { parseApiError } from '@/utils/errors';

interface PieChartWidgetProps<T extends object> {
  title: string;
  subtitle?: string;
  data: T[];
  nameKey: keyof T & string;
  valueKey: keyof T & string;
  loading?: boolean;
  error?: unknown;
  emptyMessage?: string;
  colors?: string[];
  valueFormatter?: (value: number) => string;
  labelFormatter?: (value: unknown) => string;
  legendFormatter?: (row: T, value: number, percentage: number) => ReactNode;
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

export function PieChartWidget<T extends object>({
  title,
  subtitle,
  data,
  nameKey,
  valueKey,
  loading,
  error,
  emptyMessage = 'No data was returned for this chart.',
  colors = ['#2563eb', '#0ea5e9', '#10b981', '#f59e0b', '#a855f7', '#ef4444', '#14b8a6'],
  valueFormatter,
  labelFormatter,
  legendFormatter,
  actions,
}: PieChartWidgetProps<T>) {
  if (loading) {
    return (
      <ChartCard title={title} subtitle={subtitle} actions={actions}>
        <div className="space-y-3">
          <SkeletonLoader variant="rect" height={220} />
          <div className="grid gap-2 sm:grid-cols-2">
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

  const values = data.map((row) => getNumber((row as Record<string, unknown>)[valueKey]));
  const total = Math.max(values.reduce((sum, value) => sum + value, 0), 1);
  let accumulated = 0;
  const segments = data.map((row, index) => {
    const record = row as Record<string, unknown>;
    const value = getNumber(record[valueKey]);
    const start = accumulated / total;
    accumulated += value;
    const end = accumulated / total;
    return {
      row,
      value,
      percentage: (value / total) * 100,
      start,
      end,
      color: colors[index % colors.length],
    };
  });

  return (
    <ChartCard title={title} subtitle={subtitle} actions={actions}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
        <div className="mx-auto flex w-full max-w-[280px] items-center justify-center">
          <div
            className="relative aspect-square w-full rounded-full shadow-sm ring-8 ring-background"
            style={{
              background: `conic-gradient(${segments
                .map((segment) => `${segment.color} ${segment.start * 360}deg ${segment.end * 360}deg`)
                .join(', ')})`,
            }}
          >
            <div className="absolute inset-[18%] flex items-center justify-center rounded-full border border-border/70 bg-background text-center shadow-sm">
              <div>
                <div className="text-2xl font-semibold text-foreground">{percentFormatter.format(100)}%</div>
                <div className="text-xs text-muted-foreground">Total mix</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {segments.map((segment, index) => {
            const record = segment.row as Record<string, unknown>;
            const name = labelFormatter ? labelFormatter(record[nameKey]) : String(record[nameKey] ?? '—');
            const formattedValue = valueFormatter ? valueFormatter(segment.value) : currencyFormatter.format(segment.value);
            return (
              <div key={`${name}-${index}`} className="rounded-2xl border border-border/70 bg-background p-3">
                <div className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="truncate text-sm font-semibold text-foreground">{name}</div>
                      <div className="text-sm font-medium text-muted-foreground">{formattedValue}</div>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full" style={{ width: `${Math.max(segment.percentage, 4)}%`, backgroundColor: segment.color }} />
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {legendFormatter ? legendFormatter(segment.row, segment.value, segment.percentage) : `${percentFormatter.format(segment.percentage)}% share`}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ChartCard>
  );
}

export default PieChartWidget;
