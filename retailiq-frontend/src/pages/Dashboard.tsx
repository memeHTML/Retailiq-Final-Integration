import { PageFrame } from '@/components/layout/PageFrame';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useStoreProfileQuery } from '@/hooks/store';
import {
  useDashboardOverviewQuery,
  useDashboardAlertsQuery,
  useDashboardSignalsQuery,
  useDashboardIncidentsQuery,
} from '@/hooks/dashboard';
import { normalizeApiError } from '@/utils/errors';
import type { DashboardAlert, DashboardSignal, DashboardIncident } from '@/types/models';

export default function DashboardPage() {
  const storeProfile = useStoreProfileQuery();
  const overviewQuery = useDashboardOverviewQuery();
  const alertsQuery = useDashboardAlertsQuery();
  const signalsQuery = useDashboardSignalsQuery();
  const incidentsQuery = useDashboardIncidentsQuery();

  const store = storeProfile.data;
  const overview = overviewQuery.data;
  const alerts: DashboardAlert[] = alertsQuery.data?.alerts ?? [];
  const signals: DashboardSignal[] = signalsQuery.data?.signals ?? [];
  const incidents: DashboardIncident[] = (Array.isArray(incidentsQuery.data) ? incidentsQuery.data : []) as DashboardIncident[];

  if (overviewQuery.isError) {
    return <ErrorState error={normalizeApiError(overviewQuery.error)} onRetry={() => void overviewQuery.refetch()} />;
  }

  const kpiCards = overview ? [
    { label: 'Sales', value: `₹${overview.sales?.toLocaleString() ?? 0}`, delta: overview.sales_delta },
    { label: 'Gross Margin', value: `${overview.gross_margin ?? 0}%`, delta: overview.gross_margin_delta },
    { label: 'Inventory at Risk', value: String(overview.inventory_at_risk ?? 0), delta: overview.inventory_at_risk_delta },
    { label: 'Outstanding POs', value: String(overview.outstanding_pos ?? 0), delta: overview.outstanding_pos_delta },
    { label: 'Loyalty Redemptions', value: String(overview.loyalty_redemptions ?? 0), delta: overview.loyalty_redemptions_delta },
    { label: 'Online Orders', value: String(overview.online_orders ?? 0), delta: overview.online_orders_delta },
  ] : [];

  const getSeverityVariant = (s: string): 'danger' | 'warning' | 'info' => {
    if (s === 'high') return 'danger';
    if (s === 'medium') return 'warning';
    return 'info';
  };

  return (
    <PageFrame
      title="Dashboard"
      subtitle={store ? `Welcome back to ${store.store_name}.` : 'Executive dashboard — auto-refreshes every 30s.'}
    >
      {/* Active Incidents Banner */}
      {incidents.length > 0 && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1.5rem' }}>
          <strong style={{ color: '#991b1b' }}>Active Incidents ({incidents.length})</strong>
          {incidents.map((inc) => (
            <div key={inc.id} style={{ marginTop: '0.25rem', fontSize: '0.875rem' }}>
              <Badge variant="danger">{inc.severity}</Badge>{' '}
              <strong>{inc.title}</strong> — {inc.description}{' '}
              <span className="muted">ETA: {inc.estimated_resolution}</span>
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      {overviewQuery.isLoading ? (
        <div className="grid grid--3">
          {[1,2,3,4,5,6].map((i) => <SkeletonLoader key={i} variant="rect" height={110} />)}
        </div>
      ) : (
        <div className="grid grid--3" style={{ marginBottom: '1.5rem' }}>
          {kpiCards.map((kpi) => (
            <Card key={kpi.label}>
              <CardContent>
                <div className="muted" style={{ fontSize: '0.85rem' }}>{kpi.label}</div>
                <h2 style={{ marginBottom: 0, marginTop: '0.25rem' }}>{kpi.value}</h2>
                {kpi.delta && (
                  <span style={{ fontSize: '0.8rem', color: kpi.delta.startsWith('-') ? '#dc2626' : '#16a34a' }}>
                    {kpi.delta}
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Alerts Panel */}
        <Card>
          <CardHeader><CardTitle>Alerts</CardTitle></CardHeader>
          <CardContent>
            {alertsQuery.isLoading ? <SkeletonLoader variant="rect" height={150} /> : alerts.length === 0 ? (
              <p className="muted">No active alerts.</p>
            ) : (
              <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {alerts.map((alert) => (
                  <div key={alert.id} style={{ padding: '0.5rem', background: '#f9fafb', borderRadius: '0.375rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <Badge variant={getSeverityVariant(alert.severity)}>{alert.severity}</Badge>
                    <div>
                      <strong style={{ fontSize: '0.875rem' }}>{alert.title}</strong>
                      <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }}>{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Market Signals */}
        <Card>
          <CardHeader><CardTitle>Live Market Signals</CardTitle></CardHeader>
          <CardContent>
            {signalsQuery.isLoading ? <SkeletonLoader variant="rect" height={150} /> : signals.length === 0 ? (
              <p className="muted">No market signals at this time.</p>
            ) : (
              <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {signals.map((sig) => (
                  <div key={sig.id} style={{ padding: '0.5rem', background: '#f9fafb', borderRadius: '0.375rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.875rem' }}>{sig.product_name}</strong>
                      <Badge variant={sig.delta.startsWith('-') ? 'danger' : 'success'}>{sig.delta}</Badge>
                    </div>
                    <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }}>{sig.insight}</p>
                    {sig.recommendation && <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#2563eb' }}>{sig.recommendation}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageFrame>
  );
}
