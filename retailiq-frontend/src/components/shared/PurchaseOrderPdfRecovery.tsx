import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { PurchaseOrderPdfMetadata } from '@/api/purchaseOrders';

interface PurchaseOrderPdfRecoveryProps {
  open: boolean;
  purchaseOrderId: string;
  metadata: PurchaseOrderPdfMetadata | null;
  errorMessage: string;
  onRetry: () => void;
  onClose: () => void;
}

export function PurchaseOrderPdfRecovery({
  open,
  purchaseOrderId,
  metadata,
  errorMessage,
  onRetry,
  onClose,
}: PurchaseOrderPdfRecoveryProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader>
          <CardTitle>PDF Download Recovery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
            <div className="font-medium text-foreground">Purchase Order</div>
            <div className="mt-1 font-mono text-xs text-muted-foreground">{purchaseOrderId}</div>
          </div>
          {metadata ? (
            <div className="space-y-3 rounded-lg border border-border p-4">
              <div className="text-sm font-medium">Recovery metadata</div>
              <div className="grid gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Job ID: </span>
                  <span className="font-mono">{metadata.job_id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">URL: </span>
                  <span className="break-all font-mono">{metadata.url}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Path: </span>
                  <span className="break-all font-mono">{metadata.path}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => window.open(metadata.url, '_blank', 'noopener,noreferrer')}>
                  Open Job URL
                </Button>
                <Button type="button" variant="secondary" onClick={onRetry}>
                  Retry Download
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
              <div>No recovery metadata was returned by the backend. Retry the download or try again later.</div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={onRetry}>
                  Retry Download
                </Button>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
