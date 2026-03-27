import { useMemo } from 'react';
import { format } from 'date-fns';
import { Activity, CalendarDays, CircleDollarSign, Percent, RefreshCw, TrendingUp, Users } from 'lucide-react';
import { PageFrame } from '@/components/layout/PageFrame';
import { AreaChartWidget } from '@/components/shared/AreaChartWidget';
import { BarChartWidget } from '@/components/shared/BarChartWidget';
import { PieChartWidget } from '@/components/shared/PieChartWidget';
import { StatCard } from '@/components/shared/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  useAnalyticsDashboard,
  useAnalyticsDiagnostics,
  useCategoryBreakdown,
  useCustomerSummaryAnalytics,
  usePaymentModes,
  useProfit,
  useRevenue,
  useTopProducts,
} from '@/hooks/useAnalytics';
import type { AnalyticsPresetPeriod, AnalyticsWindow } from '@/types/analytics';
import { normalizeApiError } from '@/utils/errors';
import { parseMoney } from '@/utils/numbers';
import { useSearchParams } from 'react-router-dom';
import { resolveAnalyticsWindow } from '@/lib/analytics';

const PERIOD_OPTIONS: Array<{ value: AnalyticsPresetPeriod; label: string }> = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '1y', label: '1 Year' },
  { value: 'custom', label: 'Custom' },
];

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const compact = new Intl.NumberFormat('en-IN', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const percent = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 1,
});

const formatTrendLabel = (value: unknown) => {
  const raw = typeof value === 'string' ? value : String(value ?? '');
  if (!raw) {
    return '-';
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return format(date, 'MMM d');
};

const defaultCustomWindow = (): Pick<AnalyticsWindow, 'start' | 'end'> => {
  const resolved = resolveAnalyticsWindow('30d');
  return {
    start: resolved.start,
    end: resolved.end,
  };
};

const readPeriod = (value: string | null): AnalyticsPresetPeriod => {
  if (value === '7d' || value === '30d' || value === '90d' || value === '1y' || value === 'custom') {
    return value;
  }
  return '30d';
};

export default function AnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const period = readPeriod(searchParams.get('period'));
  const customWindow = useMemo(() => {
    if (period !== 'custom') {
      return defaultCustomWindow();
    }

    const fallback = defaultCustomWindow();
    return {
      start: searchParams.get('start') ?? fallback.start,
      end: searchParams.get('end') ?? fallback.end,
    };
  }, [period, searchParams]);

  const scope = useMemo<AnalyticsWindow>(() => {
    if (period === 'custom') {
      return {
        period,
        start: customWindow.start,
        end: customWindow.end,
      };
    }

    return { period };
  }, [customWindow.end, customWindow.start, period]);

  const dashboardQuery = useAnalyticsDashboard(scope);
  const revenueQuery = useRevenue(scope);
  const profitQuery = useProfit(scope);
  const topProductsQuery = useTopProducts(scope, { limit: 8, metric: 'revenue' });
  const categoryBreakdownQuery = useCategoryBreakdown(scope);
  const paymentModesQuery = usePaymentModes(scope);
  const customerSummaryQuery = useCustomerSummaryAnalytics(scope);
  const diagnosticsQuery = useAnalyticsDiagnostics(scope);

  const resolvedScope = resolveAnalyticsWindow(scope);
  const activePeriodLabel = PERIOD_OPTIONS.find((option) => option.value === period)?.label ?? '30 Days';

  const isLoading = dashboardQuery.isLoading || revenueQuery.isLoading || profitQuery.isLoading;
  const firstError = dashboardQuery.error ?? revenueQuery.error ?? profitQuery.error;

  const updateParams = (next: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => {
      if (value == null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    setSearchParams(params, { replace: true });
  };

  const applyPeriod = (nextPeriod: AnalyticsPresetPeriod) => {
    if (nextPeriod === 'custom') {
      const fallback = defaultCustomWindow();
      updateParams({
        period: nextPeriod,
        start: searchParams.get('start') ?? fallback.start,
        end: searchParams.get('end') ?? fallback.end,
      });
      return;
    }

    updateParams({
      period: nextPeriod,
      start: undefined,
      end: undefined,
    });
  };

  const handleCustomRangeChange = (field: 'start' | 'end', value: string) => {
    updateParams({
      period: 'custom',
      [field]: value,
    });
  };

  const topKpis = dashboardQuery.data?.today_kpis;
  const insights = dashboardQuery.data?.insights ?? [];
  const customerSummary = customerSummaryQuery.data;
  const diagnostics = diagnosticsQuery.data;

  return (
    <PageFrame
      title="Analytics"
      subtitle={`Chart-first analytics across ${resolvedScope.start} to ${resolvedScope.end}.`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {PERIOD_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={period === option.value ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => applyPeriod(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      }
    >
      <div className="space-y-6">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Period Controls</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                The URL keeps this selection bookmarkable and shareable.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{activePeriodLabel}</Badge>
              <Badge variant="secondary">
                {resolvedScope.start} → {resolvedScope.end}
              </Badge>
            </div>
          </CardHeader>
          {period === 'custom' ? (
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  type="date"
                  label="Start date"
                  value={customWindow.start ?? ''}
                  onChange={(event) => handleCustomRangeChange('start', event.target.value)}
                />
                <Input
                  type="date"
                  label="End date"
                  value={customWindow.end ?? ''}
                  onChange={(event) => handleCustomRangeChange('end', event.target.value)}
                />
              </div>
            </CardContent>
          ) : null}
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {isLoading ? (
            <>
              <SkeletonLoader variant="rect" height={130} />
              <SkeletonLoader variant="rect" height={130} />
              <SkeletonLoader variant="rect" height={130} />
              <SkeletonLoader variant="rect" height={130} />
            </>
          ) : firstError ? (
            <div className="md:col-span-2 xl:col-span-4">
              <ErrorState error={normalizeApiError(firstError)} onRetry={() => void dashboardQuery.refetch()} />
            </div>
          ) : (
            <>
              <StatCard
                label="Revenue Today"
                value={money.format(Number(topKpis?.revenue ?? 0))}
                icon={<CircleDollarSign className="h-5 w-5 text-sky-600" />}
                description={`Daily total across ${resolvedScope.start}`}
              />
              <StatCard
                label="Profit Today"
                value={money.format(Number(topKpis?.profit ?? 0))}
                icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
                description={`Trend window: ${activePeriodLabel}`}
              />
              <StatCard
                label="Transactions"
                value={compact.format(Number(topKpis?.transactions ?? 0))}
                icon={<Activity className="h-5 w-5 text-violet-600" />}
                description={`${compact.format(Number(topKpis?.units_sold ?? 0))} units moved`}
              />
              <StatCard
                label="Avg Basket"
                value={money.format(Number(topKpis?.avg_basket ?? 0))}
                icon={<Percent className="h-5 w-5 text-amber-600" />}
                description="Customer spend per transaction"
              />
            </>
          )}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Executive Snapshot</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Backend insights and the current trend window.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {dashboardQuery.isLoading ? (
                <div className="space-y-3">
                  <SkeletonLoader variant="rect" height={80} />
                  <SkeletonLoader variant="rect" height={80} />
                </div>
              ) : dashboardQuery.error ? (
                <ErrorState error={normalizeApiError(dashboardQuery.error)} onRetry={() => void dashboardQuery.refetch()} />
              ) : insights.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {insights.map((insight) => (
                    <div key={`${insight.type}-${insight.title}`} className="rounded-2xl border border-border/70 bg-background p-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{insight.type}</Badge>
                        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Insight</span>
                      </div>
                      <div className="mt-2 font-semibold text-foreground">{insight.title}</div>
                      <p className="mt-1 text-sm text-muted-foreground">{insight.body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-border/70 bg-background p-4 text-sm text-muted-foreground">
                  No executive insights were returned for the selected window.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Customer Summary</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Identified customers and repeat behaviour for the selected range.</p>
            </CardHeader>
            <CardContent>
              {customerSummaryQuery.isLoading ? (
                <SkeletonLoader variant="rect" height={224} />
              ) : customerSummaryQuery.error ? (
                <ErrorState error={normalizeApiError(customerSummaryQuery.error)} onRetry={() => void customerSummaryQuery.refetch()} />
              ) : customerSummary ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <StatCard
                    label="Identified Customers"
                    value={compact.format(customerSummary.identified_customers)}
                    icon={<Users className="h-5 w-5 text-sky-600" />}
                    description={`${compact.format(customerSummary.identified_transactions)} identified transactions`}
                  />
                  <StatCard
                    label="New Customers"
                    value={compact.format(customerSummary.new_customers)}
                    icon={<CalendarDays className="h-5 w-5 text-emerald-600" />}
                    description={`${compact.format(customerSummary.returning_customers)} returning`}
                  />
                  <StatCard
                    label="Total Revenue"
                    value={money.format(customerSummary.total_revenue)}
                    icon={<CircleDollarSign className="h-5 w-5 text-violet-600" />}
                    description={`${compact.format(customerSummary.total_transactions)} total transactions`}
                  />
                  <StatCard
                    label="Avg / Customer"
                    value={money.format(customerSummary.avg_revenue_per_customer)}
                    icon={<RefreshCw className="h-5 w-5 text-amber-600" />}
                    description={`${compact.format(customerSummary.anonymous_transactions)} anonymous transactions`}
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-border/70 bg-background p-4 text-sm text-muted-foreground">
                  Customer summary was empty for the selected range.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <AreaChartWidget
            title="Revenue Trend"
            subtitle="Daily revenue across the current analytics window."
            data={revenueQuery.data ?? []}
            xKey="date"
            yKey="revenue"
            loading={revenueQuery.isLoading}
            error={revenueQuery.error}
            color="#2563eb"
            valueFormatter={(value) => money.format(Number(parseMoney(value).toNumber()))}
            labelFormatter={formatTrendLabel}
            emptyMessage="No revenue series is available for the selected range."
          />

          <AreaChartWidget
            title="Profit Trend"
            subtitle="Profit evolution with the same backend period window."
            data={profitQuery.data ?? []}
            xKey="date"
            yKey="profit"
            loading={profitQuery.isLoading}
            error={profitQuery.error}
            color="#059669"
            valueFormatter={(value) => money.format(Number(parseMoney(value).toNumber()))}
            labelFormatter={formatTrendLabel}
            emptyMessage="No profit series is available for the selected range."
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <BarChartWidget
            title="Top Products"
            subtitle="Highest-revenue products in the selected range."
            data={topProductsQuery.data ?? []}
            xKey="name"
            yKey="revenue"
            loading={topProductsQuery.isLoading}
            error={topProductsQuery.error}
            horizontal
            color="#8b5cf6"
            valueFormatter={(value) => money.format(value)}
            labelFormatter={formatTrendLabel}
            detailFormatter={(row) => `Quantity: ${compact.format(Number(row.quantity ?? 0))} · Profit: ${money.format(Number(row.profit ?? 0))}`}
            emptyMessage="No top-product rows were returned."
          />

          <PieChartWidget
            title="Category Breakdown"
            subtitle="Revenue mix by category."
            data={categoryBreakdownQuery.data ?? []}
            nameKey="name"
            valueKey="revenue"
            loading={categoryBreakdownQuery.isLoading}
            error={categoryBreakdownQuery.error}
            valueFormatter={(value) => money.format(value)}
            labelFormatter={(value) => String(value ?? 'Uncategorised')}
            legendFormatter={(row, value, percentage) => (
              <span>
                {compact.format(Number(row.units ?? 0))} units · {money.format(value)} · {percent.format(percentage)}%
              </span>
            )}
            emptyMessage="No category breakdown rows were returned."
          />

          <BarChartWidget
            title="Payment Modes"
            subtitle="Transaction and revenue split by payment method."
            data={paymentModesQuery.data ?? []}
            xKey="mode"
            yKey="revenue"
            loading={paymentModesQuery.isLoading}
            error={paymentModesQuery.error}
            horizontal={false}
            color="#f97316"
            valueFormatter={(value) => money.format(value)}
            labelFormatter={(value) => String(value ?? 'UNKNOWN')}
            detailFormatter={(row) => `Txn: ${compact.format(Number(row.txn_count ?? 0))} · Revenue share: ${percent.format(Number(row.rev_share_pct ?? 0))}%`}
            emptyMessage="No payment-mode rows were returned."
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Diagnostics</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Trend deviation, SKU variance, and margin drift signals.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {diagnosticsQuery.isLoading ? (
                <SkeletonLoader variant="rect" height={220} />
              ) : diagnosticsQuery.error ? (
                <ErrorState error={normalizeApiError(diagnosticsQuery.error)} onRetry={() => void diagnosticsQuery.refetch()} />
              ) : diagnostics ? (
                <>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-border/70 bg-background p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Trend deviations</div>
                      <div className="mt-2 text-2xl font-semibold">{compact.format(diagnostics.trend_deviations.filter((item) => item.flagged).length)}</div>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-background p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">SKU variance</div>
                      <div className="mt-2 text-2xl font-semibold">{compact.format(diagnostics.sku_rolling_variance.filter((item) => item.flagged).length)}</div>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-background p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Margin drift</div>
                      <div className="mt-2 text-2xl font-semibold">
                        {diagnostics.margin_drift?.delta_pct == null ? '—' : `${percent.format(diagnostics.margin_drift.delta_pct)}%`}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-border/70 bg-background p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="font-semibold text-foreground">Flagged trend deviations</div>
                        <Badge variant="secondary">{diagnostics.trend_deviations.length}</Badge>
                      </div>
                      {diagnostics.trend_deviations.length ? (
                        <div className="space-y-2">
                          {diagnostics.trend_deviations.slice(0, 4).map((row) => (
                            <div key={row.date} className="flex items-center justify-between gap-3 text-sm">
                              <span className="font-medium text-foreground">{formatTrendLabel(row.date)}</span>
                              <span className={row.flagged ? 'text-rose-600' : 'text-muted-foreground'}>
                                {percent.format(row.deviation_pct)}% vs MA
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No deviations were returned.</p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-background p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="font-semibold text-foreground">Top variance SKUs</div>
                        <Badge variant="secondary">{diagnostics.sku_rolling_variance.length}</Badge>
                      </div>
                      {diagnostics.sku_rolling_variance.length ? (
                        <div className="space-y-2">
                          {diagnostics.sku_rolling_variance.slice(0, 4).map((row) => (
                            <div key={String(row.product_id)} className="flex items-center justify-between gap-3 text-sm">
                              <span className="truncate font-medium text-foreground">{row.name}</span>
                              <span className={row.flagged ? 'text-rose-600' : 'text-muted-foreground'}>
                                {row.cv_14d == null ? '—' : `${percent.format(row.cv_14d)}% cv`}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No SKU variance rows were returned.</p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-border/70 bg-background p-4 text-sm text-muted-foreground">
                  Diagnostics were empty for the selected range.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Supporting Signals</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Quick readout from the backend dashboard snapshot.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboardQuery.isLoading ? (
                <SkeletonLoader variant="rect" height={220} />
              ) : dashboardQuery.error ? (
                <ErrorState error={normalizeApiError(dashboardQuery.error)} onRetry={() => void dashboardQuery.refetch()} />
              ) : (
                <>
                  <div className="rounded-2xl border border-border/70 bg-background p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Today</div>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      <div>
                        <div className="text-sm text-muted-foreground">Revenue</div>
                        <div className="text-xl font-semibold">{money.format(Number(topKpis?.revenue ?? 0))}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Profit</div>
                        <div className="text-xl font-semibold">{money.format(Number(topKpis?.profit ?? 0))}</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-background p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Alert summary</div>
                    <div className="mt-3 space-y-2">
                      {Object.entries(dashboardQuery.data?.alerts_summary ?? {}).length ? (
                        Object.entries(dashboardQuery.data?.alerts_summary ?? {}).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between gap-3 text-sm">
                            <span className="font-medium text-foreground">{key}</span>
                            <span className="text-muted-foreground">{compact.format(Number(value ?? 0))}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No alert summary returned for this range.</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageFrame>
  );
}

