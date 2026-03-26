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
import { usePurchaseOrder, usePurchaseOrders, useSendPurchaseOrder, useCancelPurchaseOrder, getPurchaseOrderStatusText, getPurchaseOrderStatusColor, canEditPurchaseOrder, canSendPurchaseOrder, canCancelPurchaseOrder } from '@/hooks/purchaseOrders';
import { useSuppliers } from '@/hooks/suppliers';
import { uiStore } from '@/stores/uiStore';
import { normalizeApiError } from '@/utils/errors';
import { formatCurrency } from '@/utils/numbers';
import type { ApiError } from '@/types/api';
import type { PurchaseOrderListItem } from '@/api/purchaseOrders';

function OrderTotalsCell({ purchaseOrderId }: { purchaseOrderId: string }) {
  const { data } = usePurchaseOrder(purchaseOrderId);
  if (!data) {
    return <span>…</span>;
  }

  const total = data.items.reduce((sum, item) => sum + item.ordered_qty * item.unit_price, 0);
  return (
    <span>
      {data.items.length} item{data.items.length === 1 ? '' : 's'} · {formatCurrency(total)}
    </span>
  );
}

export default function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const addToast = uiStore((state) => state.addToast);
  const { data, isLoading, error, refetch } = usePurchaseOrders();
  const { data: suppliers } = useSuppliers();
  const sendMutation = useSendPurchaseOrder();
  const cancelMutation = useCancelPurchaseOrder();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sendTarget, setSendTarget] = useState<PurchaseOrderListItem | null>(null);
  const [cancelTarget, setCancelTarget] = useState<PurchaseOrderListItem | null>(null);

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
      const supplierName = supplierMap.get(po.supplier_id) ?? po.supplier_id;
      return [po.id, supplierName, po.status].join(' ').toLowerCase().includes(needle);
    });
  }, [data, search, statusFilter, supplierMap]);

  const handleDownload = async (poId: string) => {
    const { downloadPurchaseOrderPdf } = await import('@/api/purchaseOrders');
    const blob = await downloadPurchaseOrderPdf(poId);
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `purchase-order-${poId}.pdf`;
    anchor.click();
    window.URL.revokeObjectURL(url);
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
                  render: (po) => supplierMap.get(po.supplier_id) ?? po.supplier_id,
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
                  render: (po) => <OrderTotalsCell purchaseOrderId={po.id} />,
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
    </PageFrame>
  );
}
