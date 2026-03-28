import { format, differenceInCalendarDays, subDays } from 'date-fns';

export type AnalyticsPresetPeriod = '7d' | '30d' | '90d' | '1y' | 'custom';
export type AnalyticsGroupBy = 'day' | 'week' | 'month';

export interface AnalyticsWindow {
  period?: AnalyticsPresetPeriod;
  start?: string;
  end?: string;
  groupBy?: AnalyticsGroupBy;
}

export type AnalyticsWindowInput = AnalyticsPresetPeriod | AnalyticsWindow | string | undefined;

const PRESET_LOOKBACK_DAYS: Record<Exclude<AnalyticsPresetPeriod, 'custom'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '1y': 365,
};

const isPresetPeriod = (value: unknown): value is Exclude<AnalyticsPresetPeriod, 'custom'> =>
  value === '7d' || value === '30d' || value === '90d' || value === '1y';

const inferGroupBy = (start: string, end: string): AnalyticsGroupBy => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 'day';
  }

  const span = Math.max(1, differenceInCalendarDays(endDate, startDate) + 1);
  if (span >= 180) {
    return 'month';
  }
  if (span >= 45) {
    return 'week';
  }
  return 'day';
};

const toDateString = (value: Date) => format(value, 'yyyy-MM-dd');

export function resolveAnalyticsWindow(input?: AnalyticsWindowInput): Required<Pick<AnalyticsWindow, 'period' | 'start' | 'end' | 'groupBy'>> {
  const today = new Date();
  const period: AnalyticsPresetPeriod = typeof input === 'string'
    ? (isPresetPeriod(input) ? input : '30d')
    : input?.period ?? '30d';

  if (typeof input === 'object' && input?.start && input?.end) {
    return {
      period,
      start: input.start,
      end: input.end,
      groupBy: input.groupBy ?? inferGroupBy(input.start, input.end),
    };
  }

  if (period === 'custom') {
    const fallbackDays = PRESET_LOOKBACK_DAYS['30d'];
    return {
      period,
      start: toDateString(subDays(today, fallbackDays - 1)),
      end: toDateString(today),
      groupBy: 'day',
    };
  }

  const days = isPresetPeriod(period) ? PRESET_LOOKBACK_DAYS[period] : PRESET_LOOKBACK_DAYS['30d'];
  const groupBy: AnalyticsGroupBy = period === '1y' ? 'month' : period === '90d' ? 'week' : 'day';

  return {
    period,
    start: toDateString(subDays(today, days - 1)),
    end: toDateString(today),
    groupBy,
  };
}

export function analyticsWindowKey(input?: AnalyticsWindowInput) {
  const resolved = resolveAnalyticsWindow(input);
  return [resolved.period, resolved.start, resolved.end, resolved.groupBy] as const;
}

export function formatAnalyticsWindowLabel(input?: AnalyticsWindowInput) {
  const resolved = resolveAnalyticsWindow(input);
  return `${resolved.start} → ${resolved.end}`;
}
