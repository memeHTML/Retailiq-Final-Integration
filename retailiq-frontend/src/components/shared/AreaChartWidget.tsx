import type { ReactNode } from 'react';
import { ChartCard } from '@/components/shared/ChartCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { parseApiError } from '@/utils/errors';

interface AreaChartWidgetProps<T extends object> {
  title: string;
  subtitle?: string;
  data: T[];
  xKey: keyof T & string;
  yKey: keyof T & string;
  loading?: boolean;
  error?: unknown;
  emptyMessage?: string;
  color?: string;
  valueFormatter?: (value: number) => string;
  labelFormatter?: (value: unknown) => string;
  actions?: ReactNode;
}

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 1,
});

const getNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getTickIndexes = (length: number) => {
  if (length <= 1) {
    return [0];
  }

  const raw = [0, Math.floor((length - 1) / 3), Math.floor(((length - 1) * 2) / 3), length - 1];
  return Array.from(new Set(raw.filter((index) => index >= 0 && index < length)));
};

export function AreaChartWidget<T extends object>({
  title,
  subtitle,
  data,
  xKey,
  yKey,
  loading,
  error,
  emptyMessage = 'No data was returned for this chart.',
  color = '#2563eb',
  valueFormatter,
  labelFormatter,
  actions,
}: AreaChartWidgetProps<T>) {
  if (loading) {
    return (
      <ChartCard title={title} subtitle={subtitle} actions={actions}>
        <div className="space-y-3">
          <SkeletonLoader variant="rect" height={240} />
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

  const width = 760;
  const height = 300;
  const padding = { top: 20, right: 24, bottom: 52, left: 48 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const values = data.map((row) => getNumber(row[yKey]));
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const normalizedMin = Math.min(0, minValue);
  const range = Math.max(maxValue - normalizedMin, 1);
  const xTickIndexes = getTickIndexes(data.length);
  const yTicks = [0, 0.33, 0.66, 1];

  const points = data.map((row, index) => {
    const record = row as Record<string, unknown>;
    const value = getNumber(record[yKey]);
    const x = padding.left + (data.length === 1 ? innerWidth / 2 : (index / (data.length - 1)) * innerWidth);
    const y = padding.top + (1 - (value - normalizedMin) / range) * innerHeight;
    return { x, y, value, label: record[xKey] };
  });

  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = `${linePath} L ${points.at(-1)?.x ?? padding.left} ${height - padding.bottom} L ${points[0]?.x ?? padding.left} ${height - padding.bottom} Z`;

  return (
    <ChartCard title={title} subtitle={subtitle} actions={actions}>
      <div className="space-y-3">
        <div className="overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-slate-50 to-white p-3 shadow-sm">
          <svg viewBox={`0 0 ${width} ${height}`} className="h-[300px] w-full">
            <defs>
              <linearGradient id={`${title.replace(/\s+/g, '-')}-area`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.22" />
                <stop offset="100%" stopColor={color} stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {yTicks.map((tick) => {
              const y = padding.top + innerHeight * tick;
              const value = normalizedMin + range * (1 - tick);
              return (
                <g key={tick}>
                  <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="rgba(148,163,184,0.22)" strokeDasharray="4 4" />
                  <text x={padding.left - 12} y={y + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">
                    {valueFormatter ? valueFormatter(value) : currencyFormatter.format(value)}
                  </text>
                </g>
              );
            })}

            <path d={areaPath} fill={`url(#${title.replace(/\s+/g, '-')}-area)`} />
            <path d={linePath} fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

            {points.map((point) => (
              <g key={`${String(point.label)}-${point.x}`}>
                <circle cx={point.x} cy={point.y} r="4.5" fill="white" stroke={color} strokeWidth="2.5">
                  <title>
                    {labelFormatter ? labelFormatter(point.label) : String(point.label ?? '')}: {valueFormatter ? valueFormatter(point.value) : currencyFormatter.format(point.value)}
                  </title>
                </circle>
              </g>
            ))}

            {xTickIndexes.map((index) => {
              const point = points[index];
              if (!point) {
                return null;
              }

              return (
                <text key={index} x={point.x} y={height - 18} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                  {labelFormatter ? labelFormatter(point.label) : String(point.label ?? '')}
                </text>
              );
            })}
          </svg>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {points.slice(0, 3).map((point) => (
            <div key={`${String(point.label)}-summary`} className="rounded-2xl border border-border/70 bg-background px-3 py-2 text-xs text-muted-foreground">
              <div className="font-semibold text-foreground">{labelFormatter ? labelFormatter(point.label) : String(point.label ?? '')}</div>
              <div>{valueFormatter ? valueFormatter(point.value) : currencyFormatter.format(point.value)}</div>
            </div>
          ))}
          {points.length > 3 ? (
            <div className="rounded-2xl border border-border/70 bg-background px-3 py-2 text-xs text-muted-foreground">
              <div className="font-semibold text-foreground">Range</div>
              <div>{numberFormatter.format(points.length)} data points</div>
            </div>
          ) : null}
        </div>
      </div>
    </ChartCard>
  );
}

export default AreaChartWidget;
