import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useOfflineSnapshotQuery } from '@/hooks/offline';
import { useCreateBatchTransactionMutation } from '@/hooks/transactions';
import { useChainDashboardQuery, useTransfersQuery } from '@/hooks/chain';
import { authStore } from '@/stores/authStore';
import { uiStore } from '@/stores/uiStore';
import { InventorySyncSkeleton } from '@/features/inventory/loading';
import { normalizeApiError } from '@/utils/errors';
import type { CreateTransactionRequest } from '@/types/api';
import type { StockTransfer } from '@/api/chain';

type BatchUploadPreview = {
  transactions: CreateTransactionRequest[];
  source: 'file' | 'paste';
};

const emptyPayload = '{\n  "transactions": []\n}';

function extractTransactions(value: unknown): CreateTransactionRequest[] {
  if (Array.isArray(value)) {
    return value as CreateTransactionRequest[];
  }

  if (value && typeof value === 'object') {
    const payload = value as Record<string, unknown>;
    if (Array.isArray(payload.transactions)) {
      return payload.transactions as CreateTransactionRequest[];
    }
  }

  return [];
}

function readFileAsText(file: File): Promise<string> {
  if (typeof file.text === 'function') {
    return file.text();
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read the selected file.'));
    reader.readAsText(file);
  });
}

export default function InventorySyncPage() {
  const addToast = uiStore((state) => state.addToast);
  const chainId = authStore((state) => state.user?.chain_group_id ?? null);
  const snapshotQuery = useOfflineSnapshotQuery();
  const batchMutation = useCreateBatchTransactionMutation();
  const chainDashboardQuery = useChainDashboardQuery(chainId ?? '');
  const transfersQuery = useTransfersQuery(chainId ?? '');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [payloadText, setPayloadText] = useState(emptyPayload);
  const [payloadError, setPayloadError] = useState<string | null>(null);
  const [uploadPreview, setUploadPreview] = useState<BatchUploadPreview | null>(null);

  const snapshot = snapshotQuery.data?.snapshot ?? null;

  const snapshotKeys = useMemo(() => {
    if (!snapshot || typeof snapshot !== 'object') {
      return [];
    }
    return Object.keys(snapshot as Record<string, unknown>).filter((key) => key !== 'generated_at' && key !== 'store_id');
  }, [snapshot]);

  const transferColumns = useMemo<Column<StockTransfer>[]>(() => [
    { key: 'transfer_id', header: 'Transfer', render: (row) => row.transfer_id },
    { key: 'route', header: 'Route', render: (row) => `${row.from_store_id} -> ${row.to_store_id}` },
    { key: 'product_id', header: 'Product', render: (row) => row.product_id },
    { key: 'quantity', header: 'Qty', render: (row) => row.quantity.toLocaleString() },
    { key: 'status', header: 'Status', render: (row) => row.status },
  ], []);

  const parsePayload = (text: string, source: BatchUploadPreview['source']) => {
    try {
      const parsed = JSON.parse(text) as unknown;
      const transactions = extractTransactions(parsed);
      if (!transactions.length) {
        setUploadPreview(null);
        setPayloadError('The JSON payload must include a transactions array.');
        return false;
      }

      setPayloadError(null);
      setUploadPreview({ transactions, source });
      return true;
    } catch {
      setUploadPreview(null);
      setPayloadError('The payload is not valid JSON.');
      return false;
    }
  };

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

  const chooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await readFileAsText(file);
      setPayloadText(text);
      if (parsePayload(text, 'file')) {
        addToast({ title: 'Payload loaded', message: `${file.name} is ready for batch sync.`, variant: 'success' });
      }
    } catch (error) {
      setUploadPreview(null);
      setPayloadError(normalizeApiError(error).message);
    } finally {
      event.target.value = '';
    }
  };

  const handlePasteParse = () => {
    if (parsePayload(payloadText, 'paste')) {
      addToast({ title: 'Payload validated', message: 'The sync payload looks ready to upload.', variant: 'success' });
    }
  };

  const handleUpload = async () => {
    if (!uploadPreview) {
      setPayloadError('Load a valid JSON payload before uploading.');
      return;
    }

    try {
      await batchMutation.mutateAsync({ transactions: uploadPreview.transactions });
      addToast({
        title: 'Sync uploaded',
        message: `${uploadPreview.transactions.length} transaction(s) synced successfully.`,
        variant: 'success',
      });
      setPayloadError(null);
      setUploadPreview(null);
      setPayloadText(emptyPayload);
      await snapshotQuery.refetch();
      await transfersQuery.refetch();
      await chainDashboardQuery.refetch();
    } catch (error) {
      addToast({ title: 'Sync upload failed', message: normalizeApiError(error).message, variant: 'error' });
    }
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
                <Button variant="secondary" onClick={chooseFile}>Open Batch Sync</Button>
              </div>
            </div>
          ) : (
            <EmptyState title="No snapshot yet" body="The backend has not generated an offline snapshot. Inventory sync will become useful once one is available." />
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Batch sync</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button onClick={chooseFile}>Choose sync JSON</Button>
            <Button
              variant="secondary"
              onClick={() => void handleUpload()}
              disabled={!uploadPreview}
              loading={batchMutation.isPending}
            >
              Upload Sync Data
            </Button>
            <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={(event) => void handleFileChange(event)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-muted-foreground" htmlFor="sync-payload">
                Payload preview
              </label>
              <textarea
                id="sync-payload"
                className="min-h-[180px] w-full rounded-lg border border-border bg-background p-3 font-mono text-sm"
                value={payloadText}
                onChange={(event) => {
                  setPayloadText(event.target.value);
                  setPayloadError(null);
                  setUploadPreview(null);
                }}
              />
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={handlePasteParse}>Validate payload</Button>
                <Badge variant={uploadPreview ? 'success' : 'secondary'}>
                  {uploadPreview ? `${uploadPreview.transactions.length} transactions ready` : 'Awaiting valid payload'}
                </Badge>
                {uploadPreview ? <Badge variant="secondary">Source: {uploadPreview.source}</Badge> : null}
              </div>
              {payloadError ? <p className="text-sm text-destructive">{payloadError}</p> : null}
            </div>

            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base">Upload rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>The JSON file should contain a `transactions` array that matches the batch sync API.</p>
                <p>Each transaction should follow the same shape used by the transaction create endpoint.</p>
                <p>The upload call uses <code>/api/v1/transactions/batch</code> and keeps the response data intact.</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Chain transfer visibility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {chainId ? (
            chainDashboardQuery.isLoading || transfersQuery.isLoading ? (
              <SkeletonLoader variant="rect" height={180} />
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <Info label="Chain stores" value={String(chainDashboardQuery.data?.total_stores ?? 0)} />
                  <Info label="Transfers" value={String(transfersQuery.data?.length ?? chainDashboardQuery.data?.recent_transfers?.length ?? 0)} />
                  <Info label="Revenue today" value={`${Number(chainDashboardQuery.data?.total_revenue ?? 0).toLocaleString()}`} />
                </div>
                <DataTable
                  columns={transferColumns}
                  data={transfersQuery.data ?? chainDashboardQuery.data?.recent_transfers ?? []}
                  emptyMessage="No chain transfers have been recorded yet."
                />
              </div>
            )
          ) : (
            <EmptyState
              title="No chain linked"
              body="If this account belongs to a chain group, recent transfers and transfer suggestions will appear here."
            />
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
