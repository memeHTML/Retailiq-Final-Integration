import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { PurchaseOrderPdfRecovery } from '@/components/shared/PurchaseOrderPdfRecovery';
import {
  canCancelPurchaseOrder,
  canEditPurchaseOrder,
  canSendPurchaseOrder,
  getPurchaseOrderStatusColor,
  getPurchaseOrderStatusText,
  useCancelPurchaseOrder,
  usePurchaseOrderHydration,
  usePurchaseOrders,
  useSendPurchaseOrder,
} from '@/hooks/purchaseOrders';
import { useSupplierHydration, useSuppliers } from '@/hooks/suppliers';
import { uiStore } from '@/stores/uiStore';
import { normalizeApiError } from '@/utils/errors';
import { formatCurrency } from '@/utils/numbers';
import type { ApiError } from '@/types/api';
import type { PurchaseOrderListItem, PurchaseOrderPdfMetadata } from '@/api/purchaseOrders';

export default function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const addToast = uiStore((state) => state.addToast);
  const { data, isLoading, error, refetch } = usePurchaseOrders();
  const { data: suppliers } = useSuppliers();
  const orderIds = useMemo(() => (data ?? []).map((purchaseOrder) => purchaseOrder.id), [data]);
  const supplierIds = useMemo(() => (data ?? []).map((purchaseOrder) => purchaseOrder.supplier_id), [data]);
  const { purchaseOrderDetails, isHydrating: ordersHydrating } = usePurchaseOrderHydration(orderIds);
  const { supplierDetails, isHydrating: suppliersHydrating } = useSupplierHydration(supplierIds);
  const sendMutation = useSendPurchaseOrder();
  const cancelMutation = useCancelPurchaseOrder();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sendTarget, setSendTarget] = useState<PurchaseOrderListItem | null>(null);
  const [cancelTarget, setCancelTarget] = useState<PurchaseOrderListItem | null>(null);
  const [pdfRecovery, setPdfRecovery] = useState<{
    purchaseOrderId: string;
    metadata: PurchaseOrderPdfMetadata | null;
    errorMessage: string;
  } | null>(null);

  const supplierMap = useMemo(
    () => new Map((suppliers ?? []).map((supplier) => [supplier.id, supplier.name])),
    [suppliers],
  );

  const rows = useMemo(() => {
    const source = data ?? [];
    const needle = search.trim().toLowerCase();
    return source.filter((po) => {
      const statusMatches = !statusFilter || po.status === statusFilter;
      if (!statusMatches) {
        return false;
      }
      if (!needle) {
        return true;
      }
      const supplierName = supplierDetails[po.supplier_id]?.name ?? supplierMap.get(po.supplier_id) ?? po.supplier_id;
      return [po.id, supplierName, po.status].join(' ').toLowerCase().includes(needle);
    });
  }, [data, search, statusFilter, supplierDetails, supplierMap]);

  const handleDownload = async (poId: string) => {
    const { downloadPurchaseOrderPdfWithFallback, PurchaseOrderPdfDownloadError } = await import('@/api/purchaseOrders');

    try {
      const blob = await downloadPurchaseOrderPdfWithFallback(poId);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `purchase-order-${poId}.pdf`;
      anchor.click();
      window.URL.revokeObjectURL(url);
      setPdfRecovery(null);
    } catch (error) {
      const metadata = error instanceof PurchaseOrderPdfDownloadError ? error.metadata : null;
      setPdfRecovery({
        purchaseOrderId: poId,
        metadata,
        errorMessage: metadata
          ? `PDF job ${metadata.job_id} exists, but the file download is temporarily unavailable.`
          : 'Unable to download the purchase order PDF right now.',
      });
    }
  };

  const handleSend = async () => {
    if (!sendTarget) {
      return;
    }

    try {
      await sendMutation.mutateAsync(sendTarget.id);
      addToast({
        title: 'Purchase order sent',
        message: sendTarget.id,
        variant: 'success',
      });
      setSendTarget(null);
    } catch {
      // mutation error shown through backend response
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) {
      return;
    }

    try {
      await cancelMutation.mutateAsync(cancelTarget.id);
      addToast({
        title: 'Purchase order cancelled',
        message: cancelTarget.id,
        variant: 'success',
      });
      setCancelTarget(null);
    } catch {
      // mutation error shown through backend response
    }
  };

  if (isLoading) {
    return (
      <PageFrame title="Purchase Orders" subtitle="Backend-backed supplier orders">
        <SkeletonLoader width="100%" height="320px" variant="rect" />
      </PageFrame>
    );
  }

  if (error) {
    return (
      <PageFrame title="Purchase Orders" subtitle="Backend-backed supplier orders">
        <ErrorState error={normalizeApiError(error) as ApiError} onRetry={() => refetch()} />
      </PageFrame>
    );
  }

  return (
    <PageFrame
      title="Purchase Orders"
      subtitle="Backend-backed supplier orders"
      actions={
        <Button type="button" onClick={() => navigate('/purchase-orders/create')}>
          Create PO
        </Button>
      }
    >
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by PO ID, supplier, or status" />
            <select
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="FULFILLED">Received</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{rows.length} purchase order{rows.length === 1 ? '' : 's'}</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <EmptyState
              title="No purchase orders found"
              body={search || statusFilter ? 'Try changing the search or filter.' : 'Create your first purchase order to begin.'}
              action={
                search || statusFilter
                  ? undefined
                  : {
                      label: 'Create PO',
                      onClick: () => navigate('/purchase-orders/create'),
                    }
              }
            />
          ) : (
            <DataTable
              data={rows}
              columns={[
                {
                  key: 'id',
                  header: 'PO Number',
                  render: (po) => (
                    <Link className="font-medium text-primary underline-offset-4 hover:underline" to={`/purchase-orders/${po.id}`}>
                      {po.id}
                    </Link>
                  ),
                },
                {
                  key: 'supplier',
                  header: 'Supplier',
                  render: (po) => {
                    const supplierDetail = supplierDetails[po.supplier_id];
                    if (!supplierDetail) {
                      const fallback = supplierMap.get(po.supplier_id) ?? '—';
                      return <span>{suppliersHydrating ? 'Loading…' : fallback}</span>;
                    }

                    return <span>{supplierDetail.name}</span>;
                  },
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (po) => <Badge variant={getPurchaseOrderStatusColor(po.status) as 'gray' | 'blue' | 'indigo' | 'green' | 'red'}>{getPurchaseOrderStatusText(po.status)}</Badge>,
                },
                {
                  key: 'expected',
                  header: 'Expected Delivery',
                  render: (po) => po.expected_delivery_date ?? '—',
                },
                {
                  key: 'items',
                  header: 'Items / Total',
                  render: (po) => {
                    const purchaseOrderDetail = purchaseOrderDetails[po.id];
                    if (!purchaseOrderDetail) {
                      return <span>{ordersHydrating ? 'Loading…' : '—'}</span>;
                    }

                    const total = purchaseOrderDetail.items.reduce((sum, item) => sum + item.ordered_qty * item.unit_price, 0);
                    return (
                      <span>
                        {purchaseOrderDetail.items.length} item{purchaseOrderDetail.items.length === 1 ? '' : 's'} · {formatCurrency(total)}
                      </span>
                    );
                  },
                },
                {
                  key: 'created',
                  header: 'Created',
                  render: (po) => po.created_at,
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (po) => (
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="secondary" onClick={() => navigate(`/purchase-orders/${po.id}`)}>
                        View
                      </Button>
                      {canEditPurchaseOrder(po.status) ? (
                        <Button type="button" variant="secondary" onClick={() => navigate(`/purchase-orders/${po.id}/edit`)}>
                          Edit
                        </Button>
                      ) : null}
                      {canSendPurchaseOrder(po.status) ? (
                        <Button type="button" variant="secondary" onClick={() => setSendTarget(po)}>
                          Send
                        </Button>
                      ) : null}
                      <Button type="button" variant="secondary" onClick={() => handleDownload(po.id)}>
                        Download PDF
                      </Button>
                      {canCancelPurchaseOrder(po.status) ? (
                        <Button type="button" variant="destructive" onClick={() => setCancelTarget(po)}>
                          Cancel
                        </Button>
                      ) : null}
                    </div>
                  ),
                },
              ]}
            />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(sendTarget)}
        title="Send Purchase Order"
        body={`Send purchase order ${sendTarget?.id} to the supplier?`}
        confirmLabel={sendMutation.isPending ? 'Sending…' : 'Send'}
        onConfirm={handleSend}
        onCancel={() => setSendTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancel Purchase Order"
        body={`Cancel purchase order ${cancelTarget?.id}?`}
        confirmLabel={cancelMutation.isPending ? 'Cancelling…' : 'Cancel'}
        destructive
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />

      <PurchaseOrderPdfRecovery
        open={Boolean(pdfRecovery)}
        purchaseOrderId={pdfRecovery?.purchaseOrderId ?? ''}
        metadata={pdfRecovery?.metadata ?? null}
        errorMessage={pdfRecovery?.errorMessage ?? 'Unable to download the purchase order PDF right now.'}
        onRetry={() => {
          if (pdfRecovery) {
            void handleDownload(pdfRecovery.purchaseOrderId);
          }
        }}
        onClose={() => setPdfRecovery(null)}
      />
    </PageFrame>
  );
}
