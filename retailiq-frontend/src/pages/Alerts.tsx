import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Filter, Package, TriangleAlert, X } from 'lucide-react';
import { PageFrame } from '@/components/layout/PageFrame';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { normalizeApiError } from '@/utils/errors';
import { useDashboardAlerts } from '@/hooks/dashboard';
import { useDismissInventoryAlertMutation, useInventoryAlertsQuery } from '@/hooks/inventory';

type AlertSource = 'all' | 'dashboard' | 'inventory';
type SeverityFilter = 'all' | 'high' | 'medium' | 'low';

type UnifiedAlert = {
  id: string;
  source: 'dashboard' | 'inventory';
  severity: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  timestamp: string;
  href?: string;
  productId?: number | null;
  alertId?: number | string;
};

const sourceLabels: Record<Exclude<AlertSource, 'all'>, string> = {
  dashboard: 'Dashboard',
  inventory: 'Inventory',
};

const severityVariant: Record<'high' | 'medium' | 'low', 'danger' | 'warning' | 'info'> = {
  high: 'danger',
  medium: 'warning',
  low: 'info',
};

export default function AlertsPage() {
  const navigate = useNavigate();
  const [source, setSource] = useState<AlertSource>('all');
  const [severity, setSeverity] = useState<SeverityFilter>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const dashboardAlertsQuery = useDashboardAlerts();
  const inventoryAlertsQuery = useInventoryAlertsQuery();
  const dismissInventoryAlertMutation = useDismissInventoryAlertMutation();

  const unifiedAlerts = useMemo<UnifiedAlert[]>(() => {
    const dashboardAlerts: UnifiedAlert[] = (dashboardAlertsQuery.data?.alerts ?? []).map((alert) => ({
      id: `dashboard-${alert.id}`,
      source: 'dashboard' as const,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      timestamp: alert.timestamp,
      href: alert.source === 'inventory' ? '/inventory' : '/dashboard',
    }));

    const inventoryAlerts: UnifiedAlert[] = (inventoryAlertsQuery.data ?? []).map((alert) => ({
      id: `inventory-${alert.alert_id}`,
      source: 'inventory' as const,
      severity: (alert.priority === 'CRITICAL' || alert.priority === 'HIGH'
        ? 'high'
        : alert.priority === 'MEDIUM'
          ? 'medium'
          : 'low') as UnifiedAlert['severity'],
      title: `${alert.alert_type}${alert.product_id ? ` - Product ${alert.product_id}` : ''}`,
      message: alert.message,
      timestamp: alert.created_at ?? new Date().toISOString(),
      href: alert.product_id ? `/inventory/${alert.product_id}` : '/inventory',
      alertId: alert.alert_id,
      productId: alert.product_id,
    }));

    return [...dashboardAlerts, ...inventoryAlerts].sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime());
  }, [dashboardAlertsQuery.data, inventoryAlertsQuery.data]);

  const visibleAlerts = useMemo(() => {
    return unifiedAlerts
      .filter((alert) => !dismissedIds.includes(alert.id))
      .filter((alert) => source === 'all' || alert.source === source)
      .filter((alert) => severity === 'all' || alert.severity === severity)
      .filter((alert) => (fromDate ? new Date(alert.timestamp) >= new Date(fromDate) : true))
      .filter((alert) => (toDate ? new Date(alert.timestamp) <= new Date(`${toDate}T23:59:59`) : true));
  }, [dismissedIds, fromDate, severity, source, toDate, unifiedAlerts]);

  const dismissAlert = (alert: UnifiedAlert) => {
    if (alert.source !== 'inventory' || alert.alertId == null) {
      return;
    }

    setDismissedIds((current) => [...current, alert.id]);

    dismissInventoryAlertMutation.mutate(alert.alertId, {
      onError: () => {
        setDismissedIds((current) => current.filter((id) => id !== alert.id));
      },
    });
  };

  const loading = dashboardAlertsQuery.isLoading || inventoryAlertsQuery.isLoading;
  const error = dashboardAlertsQuery.error ?? inventoryAlertsQuery.error;

  return (
    <PageFrame
      title="Smart Alerts"
      subtitle="Unified dashboard and inventory alerts with quick filters, clear priorities, and one-click dismissals."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{visibleAlerts.length} visible</Badge>
          <Badge variant="info">{unifiedAlerts.length} total</Badge>
          <Badge variant={visibleAlerts.some((alert) => alert.severity === 'high') ? 'danger' : 'secondary'}>
            {visibleAlerts.filter((alert) => alert.severity === 'high').length} critical
          </Badge>
        </div>
      }
    >
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Alert Center</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {visibleAlerts.length} visible of {unifiedAlerts.length} total alerts.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary"><Filter className="mr-1 h-3.5 w-3.5" /> Filters</Badge>
            <Badge variant="info"><Bell className="mr-1 h-3.5 w-3.5" /> Live feed</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Source</label>
            <select value={source} onChange={(event) => setSource(event.target.value as AlertSource)} className="w-full rounded-2xl border border-border bg-white px-3 py-2 text-sm">
              <option value="all">All sources</option>
              <option value="dashboard">Dashboard</option>
              <option value="inventory">Inventory</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Severity</label>
            <select value={severity} onChange={(event) => setSeverity(event.target.value as SeverityFilter)} className="w-full rounded-2xl border border-border bg-white px-3 py-2 text-sm">
              <option value="all">All severities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <Input label="From" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          <Input label="To" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-4">
          <SkeletonLoader variant="rect" height={100} />
          <SkeletonLoader variant="rect" height={100} />
          <SkeletonLoader variant="rect" height={100} />
        </div>
      ) : error ? (
        <ErrorState error={normalizeApiError(error)} onRetry={() => { void dashboardAlertsQuery.refetch(); void inventoryAlertsQuery.refetch(); }} />
      ) : visibleAlerts.length ? (
        <div className="space-y-4">
          {visibleAlerts.map((alert) => (
            <Card key={alert.id} className="border-border/60 shadow-sm">
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={severityVariant[alert.severity]}>{alert.severity}</Badge>
                      <Badge variant="secondary">{sourceLabels[alert.source]}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="text-base font-semibold text-foreground">{alert.title}</div>
                    <p className="max-w-3xl text-sm text-muted-foreground">{alert.message}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {alert.href ? (
                      <Button variant="secondary" size="sm" onClick={() => navigate(alert.href!)} className="rounded-xl">
                        Open
                      </Button>
                    ) : null}
                    {alert.source === 'inventory' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={dismissInventoryAlertMutation.isPending}
                        onClick={() => dismissAlert(alert)}
                        className="rounded-xl"
                      >
                        <X className="mr-1 h-4 w-4" />
                        Dismiss
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No alerts match your filters"
          body="Try clearing the source, severity, or date filters to surface more alerts."
          action={{ label: 'Reset filters', onClick: () => { setSource('all'); setSeverity('all'); setFromDate(''); setToDate(''); } }}
        />
      )}

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Alert Insights</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <TriangleAlert className="h-3.5 w-3.5" />
              Critical
            </div>
            <div className="mt-2 text-2xl font-semibold text-foreground">{visibleAlerts.filter((alert) => alert.severity === 'high').length}</div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <Package className="h-3.5 w-3.5" />
              Inventory
            </div>
            <div className="mt-2 text-2xl font-semibold text-foreground">{visibleAlerts.filter((alert) => alert.source === 'inventory').length}</div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <Bell className="h-3.5 w-3.5" />
              Dashboard
            </div>
            <div className="mt-2 text-2xl font-semibold text-foreground">{visibleAlerts.filter((alert) => alert.source === 'dashboard').length}</div>
          </div>
        </CardContent>
      </Card>
    </PageFrame>
  );
}
