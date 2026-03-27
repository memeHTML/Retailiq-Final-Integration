import { useMemo } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useOfflineSnapshotQuery } from '@/hooks/offline';
import { normalizeApiError } from '@/utils/errors';
import type { GetOfflineSnapshotResponse, OfflineSnapshotBuildingResponse } from '@/types/api';
import type { OfflineSnapshot } from '@/types/models';

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const formatBytes = (sizeBytes: number) => {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = sizeBytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const formatMetric = (value: unknown) => {
  if (typeof value === 'number') {
    return value.toLocaleString();
  }

  if (value == null) {
    return '0';
  }

  return String(value);
};

const downloadJson = (filename: string, data: unknown) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const isBuildingSnapshot = (
  snapshot: GetOfflineSnapshotResponse | null | undefined,
): snapshot is OfflineSnapshotBuildingResponse => Boolean(snapshot && 'status' in snapshot && snapshot.status === 'building');

export default function OfflineSnapshotPage() {
  const snapshotQuery = useOfflineSnapshotQuery();

  const readySnapshot = useMemo(() => {
    if (!snapshotQuery.data || isBuildingSnapshot(snapshotQuery.data)) {
      return null;
    }

    return snapshotQuery.data as OfflineSnapshot;
  }, [snapshotQuery.data]);

  if (snapshotQuery.isError) {
    return <ErrorState error={normalizeApiError(snapshotQuery.error)} onRetry={() => void snapshotQuery.refetch()} />;
  }

  if (snapshotQuery.isLoading) {
    return (
      <PageFrame title="Offline Snapshot" subtitle="Loading snapshot...">
        <div className="grid grid--3">
          <SkeletonLoader variant="rect" height={110} />
          <SkeletonLoader variant="rect" height={110} />
          <SkeletonLoader variant="rect" height={110} />
        </div>
        <SkeletonLoader variant="rect" height={300} />
      </PageFrame>
    );
  }

  if (isBuildingSnapshot(snapshotQuery.data)) {
    return (
      <PageFrame title="Offline Snapshot" subtitle="Snapshot is still building.">
        <EmptyState
          title="Snapshot building"
          body={snapshotQuery.data.message}
          action={{ label: 'Refresh', onClick: () => void snapshotQuery.refetch() }}
        />
      </PageFrame>
    );
  }

  if (!readySnapshot) {
    return (
      <PageFrame title="Offline Snapshot" subtitle="">
        <EmptyState title="No snapshot available" body="An offline snapshot has not been generated yet." />
      </PageFrame>
    );
  }

  const snapshot = readySnapshot.snapshot ?? {};
  const generatedAt = readySnapshot.built_at;
  const safeStamp = generatedAt ? generatedAt.replace(/[^a-zA-Z0-9_-]+/g, '_') : 'latest';
  const kpis = asRecord(snapshot.kpis);
  const revenue = asArray<Record<string, unknown>>(snapshot.revenue_30d);
  const topProducts = asArray<Record<string, unknown>>(snapshot.top_products_7d);
  const alertsOpen = asArray<Record<string, unknown>>(snapshot.alerts_open);
  const lowStock = asArray<Record<string, unknown>>(snapshot.low_stock_products);

  return (
    <PageFrame
      title="Offline Snapshot"
      subtitle="Precomputed analytics snapshot for offline use."
      actions={
        <Button
          variant="secondary"
          onClick={() => downloadJson(`offline-snapshot-${safeStamp}.json`, readySnapshot)}
        >
          Download snapshot
        </Button>
      }
    >
      <div className="button-row" style={{ marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <Badge variant="info">Ready</Badge>
        {generatedAt ? <span className="muted">Built at: {generatedAt}</span> : null}
        <span className="muted">Size: {formatBytes(readySnapshot.size_bytes)}</span>
      </div>

      <div className="grid grid--3" style={{ gap: '0.75rem', marginBottom: '1.25rem' }}>
        <Card>
          <CardHeader><CardTitle>Revenue</CardTitle></CardHeader>
          <CardContent>{formatMetric(kpis?.today_revenue)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Profit</CardTitle></CardHeader>
          <CardContent>{formatMetric(kpis?.today_profit)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Transactions</CardTitle></CardHeader>
          <CardContent>{formatMetric(kpis?.today_transactions)}</CardContent>
        </Card>
      </div>

      <div className="grid grid--2" style={{ gap: '1rem' }}>
        <Card>
          <CardHeader><CardTitle>Revenue history</CardTitle></CardHeader>
          <CardContent>
            {revenue.length === 0 ? (
              <EmptyState title="No revenue history" body="The snapshot does not include a 30-day revenue history." />
            ) : (
              <DataTable
                columns={[
                  { key: 'date', header: 'Date', render: (row: Record<string, unknown>) => String(row.date ?? '-') },
                  { key: 'revenue', header: 'Revenue', render: (row: Record<string, unknown>) => formatMetric(row.revenue) },
                  { key: 'profit', header: 'Profit', render: (row: Record<string, unknown>) => formatMetric(row.profit) },
                ]}
                data={revenue}
                emptyMessage="No revenue history"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top products</CardTitle></CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <EmptyState title="No top products" body="The snapshot does not include product performance data." />
            ) : (
              <DataTable
                columns={[
                  { key: 'name', header: 'Product', render: (row: Record<string, unknown>) => String(row.name ?? '-') },
                  { key: 'revenue', header: 'Revenue', render: (row: Record<string, unknown>) => formatMetric(row.revenue) },
                  { key: 'units_sold', header: 'Units sold', render: (row: Record<string, unknown>) => formatMetric(row.units_sold) },
                ]}
                data={topProducts}
                emptyMessage="No top products"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Open alerts</CardTitle></CardHeader>
          <CardContent>
            {alertsOpen.length === 0 ? (
              <EmptyState title="No open alerts" body="There are no open alerts in the snapshot." />
            ) : (
              <div className="stack">
                {alertsOpen.map((alert, index) => (
                  <div key={String(alert.id ?? index)} className="card" style={{ padding: '0.75rem' }}>
                    <div className="button-row" style={{ justifyContent: 'space-between' }}>
                      <strong>{String(alert.message ?? 'Alert')}</strong>
                      <Badge variant="secondary">{String(alert.priority ?? 'NORMAL')}</Badge>
                    </div>
                    <p className="muted" style={{ margin: '0.35rem 0 0' }}>
                      {String(alert.created_at ?? '')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Low stock products</CardTitle></CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <EmptyState title="No low stock items" body="The snapshot does not include low-stock products." />
            ) : (
              <DataTable
                columns={[
                  { key: 'name', header: 'Product', render: (row: Record<string, unknown>) => String(row.name ?? '-') },
                  { key: 'current_stock', header: 'Current stock', render: (row: Record<string, unknown>) => formatMetric(row.current_stock) },
                  { key: 'reorder_point', header: 'Reorder point', render: (row: Record<string, unknown>) => formatMetric(row.reorder_point) },
                ]}
                data={lowStock}
                emptyMessage="No low stock items"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </PageFrame>
  );
}
