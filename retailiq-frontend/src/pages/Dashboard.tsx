import { useMemo, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  ArrowDownRight,
  ArrowUpRight,
  IndianRupee,
  Package,
  ShoppingCart,
  Signal,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PageFrame } from '@/components/layout/PageFrame';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { analyticsApi } from '@/api/analytics';
import { formatCurrency } from '@/utils/numbers';
import { normalizeApiError } from '@/utils/errors';
import { useDashboardAlerts, useDashboardIncidents, useDashboardOverview, useLiveSignals, useAlertFeed } from '@/hooks/dashboard';
import { useStoreProfileQuery } from '@/hooks/store';

type TrendPeriod = '7d' | '30d' | '90d';

type MetricCardProps = {
  title: string;
  value: string;
  delta?: string;
  icon: LucideIcon;
  tone: 'blue' | 'emerald' | 'amber' | 'rose';
};

const toneClasses: Record<MetricCardProps['tone'], string> = {
  blue: 'from-sky-500/12 to-sky-500/5 text-sky-700',
  emerald: 'from-emerald-500/12 to-emerald-500/5 text-emerald-700',
  amber: 'from-amber-500/12 to-amber-500/5 text-amber-700',
  rose: 'from-rose-500/12 to-rose-500/5 text-rose-700',
};

function MetricCard({ title, value, delta, icon: Icon, tone }: MetricCardProps) {
  const positive = delta ? !delta.trim().startsWith('-') : true;

  return (
    <Card className="border-border/60 bg-card/95 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{title}</div>
            <div className="text-2xl font-semibold tracking-tight text-foreground">{value}</div>
            {delta ? (
              <div className={`inline-flex items-center gap-1 text-xs font-semibold ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {delta} vs prior period
              </div>
            ) : null}
          </div>
          <div className={`rounded-2xl bg-gradient-to-br p-3 ${toneClasses[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionError({ error, retry }: { error: unknown; retry?: () => void }) {
  return (
    <ErrorState
      error={normalizeApiError(error)}
      onRetry={retry}
    />
  );
}

function RevenueChart({
  data,
  loading,
}: {
  data: Array<{ date?: string; revenue?: number }>;
  loading: boolean;
}) {
  if (loading) {
    return <SkeletonLoader variant="rect" height={280} />;
  }

  const points = data.map((row) => Number(row.revenue ?? 0));
  const max = Math.max(...points, 1);
  const width = 720;
  const height = 280;
  const padding = 28;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const stepX = data.length > 1 ? innerWidth / (data.length - 1) : innerWidth;
  const coords = data.map((row, index) => {
    const value = Number(row.revenue ?? 0);
    const x = padding + (data.length > 1 ? index * stepX : innerWidth / 2);
    const y = padding + (1 - value / max) * innerHeight;
    return { x, y, value, date: row.date ?? '' };
  });

  if (!coords.length) {
    return <EmptyState title="No trend data" body="The backend did not return enough data to draw the revenue trend yet." />;
  }

  const path = coords.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = `${path} L ${coords.at(-1)?.x ?? padding} ${height - padding} L ${coords[0]?.x ?? padding} ${height - padding} Z`;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-slate-50 to-white p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[280px] w-full">
        <defs>
          <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(15,94,255,0.28)" />
            <stop offset="100%" stopColor="rgba(15,94,255,0.02)" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1={padding}
            x2={width - padding}
            y1={padding + innerHeight * ratio}
            y2={padding + innerHeight * ratio}
            stroke="rgba(148,163,184,0.22)"
            strokeDasharray="4 4"
          />
        ))}
        <path d={areaPath} fill="url(#revenueFill)" />
        <path d={path} fill="none" stroke="rgba(15,94,255,0.95)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((point) => (
          <circle key={`${point.date}-${point.x}`} cx={point.x} cy={point.y} r="4.5" fill="white" stroke="rgba(15,94,255,0.95)" strokeWidth="3" />
        ))}
      </svg>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        {coords.slice(0, 4).map((point) => (
          <span key={point.date} className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
            {point.date ? format(new Date(point.date), 'MMM d') : '-'} | {formatCurrency(point.value)}
          </span>
        ))}
      </div>
    </div>
  );
}

function AlertList({
  items,
  emptyLabel,
}: {
  items: Array<{
    id: string;
    severity: 'high' | 'medium' | 'low';
    title: string;
    message: string;
    timestamp: string;
    source: string;
    href?: string;
  }>;
  emptyLabel: string;
}) {
  if (!items.length) {
    return <EmptyState title="Nothing to show" body={emptyLabel} />;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-2xl border border-border/60 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={item.severity === 'high' ? 'danger' : item.severity === 'medium' ? 'warning' : 'info'}>{item.severity}</Badge>
                <Badge variant="secondary">{item.source}</Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                </span>
              </div>
              <div className="font-semibold text-foreground">{item.title}</div>
              <p className="text-sm text-muted-foreground">{item.message}</p>
              {item.href ? (
                <a href={item.href} className="inline-flex text-xs font-semibold text-primary hover:underline">
                  Open related page
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<TrendPeriod>('30d');
  const storeProfile = useStoreProfileQuery();
  const overviewQuery = useDashboardOverview();
  const alertsQuery = useDashboardAlerts();
  const signalsQuery = useLiveSignals();
  const incidentsQuery = useDashboardIncidents();
  const alertFeedQuery = useAlertFeed(8);

  const analyticsQuery = useQuery({
    queryKey: ['dashboard', 'analytics', period],
    queryFn: () => analyticsApi.getAnalyticsDashboard(period),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const trendQuery = useQuery({
    queryKey: ['dashboard', 'trend', period],
    queryFn: () => analyticsApi.getRevenueTrend(period),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const dashboardOverview = overviewQuery.data;
  const analyticsDashboard = analyticsQuery.data;
  const revenueTrend = trendQuery.data ?? [];
  const store = storeProfile.data;

  const combinedAlerts = useMemo(() => {
    const dashboardAlerts = (alertsQuery.data?.alerts ?? []).map((alert) => ({
      id: `dashboard-${alert.id}`,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      timestamp: alert.timestamp,
      source: alert.source || 'dashboard',
      href: alert.source === 'inventory' ? '/inventory' : '/dashboard',
    }));

    const feedAlerts = (alertFeedQuery.data?.alerts ?? []).map((alert) => ({
      id: `feed-${alert.id}`,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      timestamp: alert.timestamp,
      source: alert.source || 'feed',
      href: alert.source === 'inventory' ? '/inventory' : '/dashboard',
    }));

    return [...dashboardAlerts, ...feedAlerts].sort((left, right) => {
      const leftTime = new Date(left.timestamp).getTime();
      const rightTime = new Date(right.timestamp).getTime();
      return rightTime - leftTime;
    });
  }, [alertsQuery.data, alertFeedQuery.data]);

  const dashboardSignals = signalsQuery.data?.signals ?? [];
  const incidents = incidentsQuery.data ?? [];
  const activeSignalCount = dashboardSignals.length;
  const activeAlertCount = combinedAlerts.length;
  const activeIncidentCount = incidents.length;

  const loadingAnyCard = overviewQuery.isLoading || analyticsQuery.isLoading;

  return (
    <PageFrame
      title="Dashboard"
      subtitle={store ? `Welcome back to ${store.store_name}.` : 'Live operations overview powered by backend aggregations and alerts.'}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{activeAlertCount} alerts</Badge>
          <Badge variant="info">{activeSignalCount} signals</Badge>
          <Badge variant={activeIncidentCount ? 'danger' : 'secondary'}>{activeIncidentCount} incidents</Badge>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {loadingAnyCard ? (
          <>
            <SkeletonLoader variant="rect" height={132} />
            <SkeletonLoader variant="rect" height={132} />
            <SkeletonLoader variant="rect" height={132} />
            <SkeletonLoader variant="rect" height={132} />
          </>
        ) : (
          <>
            <MetricCard
              title="Revenue Today"
              value={formatCurrency(dashboardOverview?.sales ?? 0)}
              delta={dashboardOverview?.sales_delta}
              icon={IndianRupee}
              tone="blue"
            />
            <MetricCard
              title="Transactions Today"
              value={String(analyticsDashboard?.today_kpis?.transactions ?? 0)}
              delta={dashboardOverview?.online_orders_delta}
              icon={ShoppingCart}
              tone="emerald"
            />
            <MetricCard
              title="Gross Margin"
              value={`${dashboardOverview?.gross_margin ?? 0}%`}
              delta={dashboardOverview?.gross_margin_delta}
              icon={TrendingUp}
              tone="amber"
            />
            <MetricCard
              title="Inventory At Risk"
              value={String(dashboardOverview?.inventory_at_risk ?? 0)}
              delta={dashboardOverview?.inventory_at_risk_delta}
              icon={Package}
              tone="rose"
            />
          </>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Revenue Trend</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Daily revenue over the selected range.</p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-white p-1">
              {(['7d', '30d', '90d'] as TrendPeriod[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPeriod(value)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                    period === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {trendQuery.isError ? (
              <SectionError error={trendQuery.error} retry={() => void trendQuery.refetch()} />
            ) : (
              <RevenueChart data={revenueTrend} loading={trendQuery.isLoading} />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Backend analytics distribution by category.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {analyticsQuery.isError ? (
              <SectionError error={analyticsQuery.error} retry={() => void analyticsQuery.refetch()} />
            ) : analyticsDashboard?.category_breakdown?.length ? (
              analyticsDashboard.category_breakdown.slice(0, 6).map((category) => {
                const percent = Number(category.percentage ?? category.share_pct ?? 0);
                return (
                  <div key={String(category.category_id ?? category.name)} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{String(category.name ?? 'Uncategorised')}</span>
                      <span className="text-muted-foreground">{percent.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(percent, 4)}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState title="No categories yet" body="The backend has not returned a category breakdown for the selected range." />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Activity Feed</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Recent alerts and operational updates from the backend feed.</p>
          </CardHeader>
          <CardContent>
            {alertFeedQuery.isLoading ? (
              <div className="space-y-3">
                <SkeletonLoader variant="rect" height={88} />
                <SkeletonLoader variant="rect" height={88} />
                <SkeletonLoader variant="rect" height={88} />
              </div>
            ) : alertFeedQuery.isError ? (
              <SectionError error={alertFeedQuery.error} retry={() => void alertFeedQuery.refetch()} />
            ) : (
              <AlertList items={combinedAlerts} emptyLabel="No alerts or feed items are available right now." />
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Active Incidents</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Unresolved high-priority incidents from the dashboard API.</p>
            </CardHeader>
            <CardContent>
              {incidentsQuery.isLoading ? (
                <SkeletonLoader variant="rect" height={180} />
              ) : incidentsQuery.isError ? (
                <SectionError error={incidentsQuery.error} retry={() => void incidentsQuery.refetch()} />
              ) : incidents.length ? (
                <div className="space-y-3">
                  {incidents.map((incident) => (
                    <div key={incident.id} className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="danger">{incident.severity}</Badge>
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">{incident.status}</span>
                      </div>
                      <div className="mt-2 font-semibold text-rose-950">{incident.title}</div>
                      <p className="mt-1 text-sm text-rose-900/80">{incident.description}</p>
                      <div className="mt-2 text-xs text-rose-700">
                        Estimated resolution {formatDistanceToNow(new Date(incident.estimated_resolution), { addSuffix: true })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No incidents" body="There are no active incidents at the moment." />
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Live Signals</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Market signals and recommendations from the backend.</p>
            </CardHeader>
            <CardContent>
              {signalsQuery.isLoading ? (
                <SkeletonLoader variant="rect" height={180} />
              ) : signalsQuery.isError ? (
                <SectionError error={signalsQuery.error} retry={() => void signalsQuery.refetch()} />
              ) : dashboardSignals.length ? (
                <div className="space-y-3">
                  {dashboardSignals.map((signal) => (
                    <div key={signal.id} className="rounded-2xl border border-border/60 bg-white p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-foreground">{signal.product_name}</div>
                        <Badge variant={signal.delta.trim().startsWith('-') ? 'danger' : 'success'}>{signal.delta}</Badge>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">{signal.insight}</div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Signal className="h-3.5 w-3.5" />
                        {formatDistanceToNow(new Date(signal.timestamp), { addSuffix: true })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No signals" body="Live market signals will appear here when the backend returns them." />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Store Snapshot</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {dashboardOverview?.last_updated ? `Last updated ${formatDistanceToNow(new Date(dashboardOverview.last_updated), { addSuffix: true })}.` : 'Snapshot is refreshed continuously from the backend.'}
          </p>
        </CardHeader>
        <CardContent>
          {overviewQuery.isError ? (
            <SectionError error={overviewQuery.error} retry={() => void overviewQuery.refetch()} />
          ) : loadingAnyCard ? (
            <SkeletonLoader variant="rect" height={88} />
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-border/60 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Outstanding POs</div>
                <div className="mt-2 text-2xl font-semibold text-foreground">{dashboardOverview?.outstanding_pos ?? 0}</div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Loyalty Redemptions</div>
                <div className="mt-2 text-2xl font-semibold text-foreground">{dashboardOverview?.loyalty_redemptions ?? 0}</div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Online Orders</div>
                <div className="mt-2 text-2xl font-semibold text-foreground">{dashboardOverview?.online_orders ?? 0}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </PageFrame>
  );
}
