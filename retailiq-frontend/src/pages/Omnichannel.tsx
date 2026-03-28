import { useMemo, useState } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  useMarketAlertsQuery,
  useMarketSummaryQuery,
  usePriceSignalsQuery,
  useRecommendationsQuery,
} from '@/hooks/marketIntelligence';
import { normalizeApiError } from '@/utils/errors';
import type { MarketAlert, MarketRecommendation, MarketSignal, MarketSummary } from '@/api/marketIntelligence';

type TabId = 'signals' | 'marketplace' | 'whatsapp';

export default function OmnichannelPage() {
  const [activeTab, setActiveTab] = useState<TabId>('signals');

  const summaryQuery = useMarketSummaryQuery();
  const signalsQuery = usePriceSignalsQuery();
  const alertsQuery = useMarketAlertsQuery();
  const recommendationsQuery = useRecommendationsQuery();

  const signalColumns = useMemo<Column<MarketSignal>[]>(() => [
    { key: 'signal_type', header: 'Signal', render: (row) => row.signal_type },
    { key: 'category_id', header: 'Category', render: (row) => row.category_id ?? 'All categories' },
    { key: 'region_code', header: 'Region', render: (row) => row.region_code ?? 'All regions' },
    { key: 'value', header: 'Value', render: (row) => Number(row.value ?? 0).toLocaleString() },
    {
      key: 'confidence',
      header: 'Confidence',
      render: (row) => (
        <Badge variant={Number(row.confidence ?? 0) >= 0.8 ? 'success' : Number(row.confidence ?? 0) >= 0.5 ? 'warning' : 'secondary'}>
          {(Number(row.confidence ?? 0) * 100).toFixed(0)}%
        </Badge>
      ),
    },
    { key: 'quality_score', header: 'Quality', render: (row) => `${Math.round(Number(row.quality_score ?? 0))}` },
  ], []);

  const alertColumns = useMemo<Column<MarketAlert>[]>(() => [
    { key: 'alert_type', header: 'Alert', render: (row) => row.alert_type },
    { key: 'severity', header: 'Severity', render: (row) => <Badge variant={row.severity === 'CRITICAL' ? 'danger' : row.severity === 'HIGH' ? 'warning' : 'secondary'}>{row.severity}</Badge> },
    { key: 'message', header: 'Message', render: (row) => row.message },
    { key: 'status', header: 'Status', render: (row) => (row.acknowledged ? 'Acknowledged' : 'Open') },
  ], []);

  const recommendationColumns = useMemo<Column<MarketRecommendation>[]>(() => [
    { key: 'title', header: 'Recommendation', render: (row) => row.title },
    { key: 'type', header: 'Type', render: (row) => row.type },
    { key: 'priority', header: 'Priority', render: (row) => <Badge variant={row.priority === 'HIGH' ? 'danger' : row.priority === 'MEDIUM' ? 'warning' : 'secondary'}>{row.priority}</Badge> },
    { key: 'status', header: 'Status', render: (row) => row.status },
  ], []);

  const summary = summaryQuery.data as MarketSummary | undefined;
  const signals = signalsQuery.data ?? [];
  const alerts = alertsQuery.data ?? [];
  const recommendations = recommendationsQuery.data ?? [];

  if (activeTab === 'signals' && summaryQuery.isError) {
    return <ErrorState error={normalizeApiError(summaryQuery.error)} onRetry={() => void summaryQuery.refetch()} />;
  }

  return (
    <PageFrame
      title="Omnichannel"
      subtitle="A shared shell for marketplace, WhatsApp, and market-signal workflows. Branch B will own the commerce surfaces."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          <Button variant={activeTab === 'signals' ? 'primary' : 'secondary'} onClick={() => setActiveTab('signals')}>Market Signals</Button>
          <Button variant={activeTab === 'marketplace' ? 'primary' : 'secondary'} onClick={() => setActiveTab('marketplace')}>Marketplace</Button>
          <Button variant={activeTab === 'whatsapp' ? 'primary' : 'secondary'} onClick={() => setActiveTab('whatsapp')}>WhatsApp</Button>
        </div>

        {activeTab === 'signals' ? (
          summaryQuery.isLoading ? (
            <SkeletonLoader variant="rect" height={320} />
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {Object.entries(summary?.signals_last_24h ?? {}).slice(0, 4).map(([key, value]) => (
                  <Card key={key}>
                    <CardHeader>
                      <CardTitle className="text-base">{key}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-center justify-between"><span className="text-muted-foreground">Signals</span><span>{Number(value?.count ?? 0)}</span></div>
                      <div className="flex items-center justify-between"><span className="text-muted-foreground">Avg value</span><span>{Number(value?.avg_value ?? 0).toLocaleString()}</span></div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Price signals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {signalsQuery.isLoading ? <SkeletonLoader variant="rect" height={220} /> : <DataTable columns={signalColumns} data={signals} emptyMessage="No market signals were returned." />}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Open alerts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {alertsQuery.isLoading ? <SkeletonLoader variant="rect" height={220} /> : <DataTable columns={alertColumns} data={alerts} emptyMessage="No active market alerts." />}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  {recommendationsQuery.isLoading ? <SkeletonLoader variant="rect" height={220} /> : <DataTable columns={recommendationColumns} data={recommendations} emptyMessage="No omnichannel recommendations available." />}
                </CardContent>
              </Card>
            </div>
          )
        ) : null}

        {activeTab === 'marketplace' ? (
          <EmptyState
            title="Marketplace tab coming soon"
            body="Branch B will wire marketplace commerce flows into this hub. For now the shell stays in place."
          />
        ) : null}

        {activeTab === 'whatsapp' ? (
          <EmptyState
            title="WhatsApp tab coming soon"
            body="Branch B will connect outbound messaging and contact status here."
          />
        ) : null}
      </div>
    </PageFrame>
  );
}
