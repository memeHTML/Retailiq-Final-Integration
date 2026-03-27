import { useMemo } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useOfflineSnapshotQuery } from '@/hooks/offline';
import { InventorySyncSkeleton } from '@/features/inventory/loading';
import { normalizeApiError } from '@/utils/errors';

export default function InventorySyncPage() {
  const snapshotQuery = useOfflineSnapshotQuery();

  const snapshot = snapshotQuery.data?.snapshot ?? null;

  const snapshotKeys = useMemo(() => {
    if (!snapshot || typeof snapshot !== 'object') {
      return [];
    }
    return Object.keys(snapshot as Record<string, unknown>).filter((key) => key !== 'generated_at' && key !== 'store_id');
  }, [snapshot]);

  const downloadSnapshot = () => {
    if (!snapshot) {
      return;
    }
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'retailiq-offline-snapshot.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  if (snapshotQuery.isError) {
    return <ErrorState error={normalizeApiError(snapshotQuery.error)} onRetry={() => void snapshotQuery.refetch()} />;
  }

  if (snapshotQuery.isLoading) {
    return (
      <PageFrame title="Inventory sync" subtitle="Loading offline snapshot...">
        <InventorySyncSkeleton />
      </PageFrame>
    );
  }

  return (
    <PageFrame
      title="Inventory sync"
      subtitle="Monitor the offline snapshot used to keep inventory data available during sync windows."
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Snapshot status</CardTitle>
            <Badge variant={snapshot ? 'success' : 'secondary'}>{snapshot ? 'Ready' : 'Not available'}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {snapshot ? (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 md:grid-cols-3">
                <Info label="Last built" value={String(snapshot.built_at ?? 'Unknown')} />
                <Info label="Size" value={`${Number(snapshot.size_bytes ?? 0).toLocaleString()} bytes`} />
                <Info label="Modules" value={`${snapshotKeys.length} sections`} />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={downloadSnapshot}>Download Offline Snapshot</Button>
                <Button variant="secondary" disabled title="Upload support is not exposed by the current backend.">
                  Upload Sync Data
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState title="No snapshot yet" body="The backend has not generated an offline snapshot. Inventory sync will become useful once one is available." />
          )}
        </CardContent>
      </Card>

      {snapshot && snapshotKeys.length ? (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Snapshot contents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {snapshotKeys.map((key) => (
                <Badge key={key} variant="secondary">{key.replace(/_/g, ' ')}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </PageFrame>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
