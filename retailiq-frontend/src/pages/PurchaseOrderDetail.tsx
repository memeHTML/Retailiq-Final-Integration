import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  canCancelPurchaseOrder,
  canConfirmPurchaseOrder,
  canEditPurchaseOrder,
  canReceivePurchaseOrder,
  canSendPurchaseOrder,
  getPurchaseOrderStatusColor,
  getPurchaseOrderStatusText,
  useCancelPurchaseOrder,
  useConfirmPurchaseOrder,
  useEmailPurchaseOrder,
  usePurchaseOrder,
  useReceivePurchaseOrder,
  useSendPurchaseOrder,
} from '@/hooks/purchaseOrders';
import { useProductsQuery } from '@/hooks/inventory';
import { useSupplier } from '@/hooks/suppliers';
import { uiStore } from '@/stores/uiStore';
import { normalizeApiError } from '@/utils/errors';
import { formatCurrency } from '@/utils/numbers';
import type { ApiError } from '@/types/api';

type ReceiveDraftItem = {
  product_id: number;
  label: string;
  ordered_qty: number;
  received_qty: number;
  remaining_qty: number;
  value: string;
};

export default function PurchaseOrderDetailPage() {
  const navigate = useNavigate();
  const { poId, id } = useParams<{ poId?: string; id?: string }>();
  const purchaseOrderId = poId ?? id ?? '';
  const addToast = uiStore((state) => state.addToast);

  const { data: purchaseOrder, isLoading, error, refetch } = usePurchaseOrder(purchaseOrderId);
  const { data: supplier } = useSupplier(purchaseOrder?.supplier_id);
  const productsQuery = useProductsQuery({ page_size: 500 });
  const sendMutation = useSendPurchaseOrder();
  const confirmMutation = useConfirmPurchaseOrder();
  const receiveMutation = useReceivePurchaseOrder();
  const cancelMutation = useCancelPurchaseOrder();
  const emailMutation = useEmailPurchaseOrder();
  const [sendOpen, setSendOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const [receiveItems, setReceiveItems] = useState<ReceiveDraftItem[]>([]);
  const [receiveNotes, setReceiveNotes] = useState('');

  const productMap = useMemo(
    () => new Map((productsQuery.data?.data ?? []).map((product) => [product.product_id, product])),
    [productsQuery.data],
  );

  useEffect(() => {
    if (!purchaseOrder || !receiveOpen) {
      return;
    }

    setReceiveItems(
      purchaseOrder.items.map((item) => {
        const product = productMap.get(item.product_id);
        const orderedQty = item.ordered_qty;
        const receivedQty = item.received_qty;
        const remainingQty = Math.max(orderedQty - receivedQty, 0);
        return {
          product_id: item.product_id,
          label: product?.name ?? `Product #${item.product_id}`,
          ordered_qty: orderedQty,
          received_qty: receivedQty,
          remaining_qty: remainingQty,
          value: remainingQty.toString(),
        };
      }),
    );
    setReceiveNotes('');
  }, [purchaseOrder, receiveOpen, productMap]);

  useEffect(() => {
    if (emailOpen && supplier?.contact.email) {
      setEmailValue(supplier.contact.email);
    }
  }, [emailOpen, supplier?.contact.email]);

  const subtotal = useMemo(
    () => (purchaseOrder?.items ?? []).reduce((sum, item) => sum + item.ordered_qty * item.unit_price, 0),
    [purchaseOrder],
  );

  const handleDownload = async () => {
    const { downloadPurchaseOrderPdf } = await import('@/api/purchaseOrders');
    const blob = await downloadPurchaseOrderPdf(purchaseOrderId);
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `purchase-order-${purchaseOrderId}.pdf`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSend = async () => {
    try {
      await sendMutation.mutateAsync(purchaseOrderId);
      addToast({ title: 'Purchase order sent', message: purchaseOrderId, variant: 'success' });
      setSendOpen(false);
    } catch {
      // backend error already surfaced
    }
  };

  const handleConfirm = async () => {
    try {
      await confirmMutation.mutateAsync(purchaseOrderId);
      addToast({ title: 'Purchase order confirmed', message: purchaseOrderId, variant: 'success' });
      setConfirmOpen(false);
    } catch {
      // backend error already surfaced
    }
  };

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync(purchaseOrderId);
      addToast({ title: 'Purchase order cancelled', message: purchaseOrderId, variant: 'success' });
      setCancelOpen(false);
    } catch {
      // backend error already surfaced
    }
  };

  const handleReceive = async () => {
    try {
      await receiveMutation.mutateAsync({
        purchaseOrderId,
        payload: {
          items: receiveItems.map((item) => ({
            product_id: item.product_id,
            received_qty: Number(item.value || 0),
          })),
          notes: receiveNotes || undefined,
        },
      });
      addToast({ title: 'Purchase order received', message: purchaseOrderId, variant: 'success' });
      setReceiveOpen(false);
    } catch {
      // backend error already surfaced
    }
  };

  const handleEmail = async () => {
    try {
      await emailMutation.mutateAsync({ purchaseOrderId, email: emailValue.trim() });
      addToast({ title: 'Purchase order emailed', message: emailValue.trim(), variant: 'success' });
      setEmailOpen(false);
    } catch {
      // backend error already surfaced
    }
  };

  if (isLoading) {
    return (
      <PageFrame title="Purchase Order Details" subtitle="Backend-backed supplier order">
        <SkeletonLoader width="100%" height="320px" variant="rect" />
      </PageFrame>
    );
  }

  if (error) {
    return (
      <PageFrame title="Purchase Order Details" subtitle="Backend-backed supplier order">
        <ErrorState error={normalizeApiError(error) as ApiError} onRetry={() => refetch()} />
      </PageFrame>
    );
  }

  if (!purchaseOrder) {
    return (
      <PageFrame title="Purchase Order Details" subtitle="Backend-backed supplier order">
        <EmptyState title="Purchase order not found" body="The purchase order may have been deleted or you may not have access." />
      </PageFrame>
    );
  }

  const statusLabel = getPurchaseOrderStatusText(purchaseOrder.status);
  const supplierName = supplier?.name ?? purchaseOrder.supplier_id;

  return (
    <PageFrame
      title={purchaseOrder.id}
      subtitle={`Purchase order for ${supplierName}`}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => navigate('/purchase-orders')}>
            Back
          </Button>
          {canEditPurchaseOrder(purchaseOrder.status) ? (
            <Button type="button" variant="secondary" onClick={() => navigate(`/purchase-orders/${purchaseOrder.id}/edit`)}>
              Edit
            </Button>
          ) : null}
          {canSendPurchaseOrder(purchaseOrder.status) ? (
            <Button type="button" onClick={() => setSendOpen(true)}>
              Send
            </Button>
          ) : null}
          {canConfirmPurchaseOrder(purchaseOrder.status) ? (
            <Button type="button" onClick={() => setConfirmOpen(true)}>
              Confirm
            </Button>
          ) : null}
          {canReceivePurchaseOrder(purchaseOrder.status) ? (
            <Button type="button" onClick={() => setReceiveOpen(true)}>
              Receive
            </Button>
          ) : null}
          {canCancelPurchaseOrder(purchaseOrder.status) ? (
            <Button type="button" variant="destructive" onClick={() => setCancelOpen(true)}>
              Cancel
            </Button>
          ) : null}
          <Button type="button" variant="secondary" onClick={handleDownload}>
            Download PDF
          </Button>
          {purchaseOrder.status === 'DRAFT' || purchaseOrder.status === 'SENT' || purchaseOrder.status === 'CONFIRMED' ? (
            <Button type="button" variant="secondary" onClick={() => setEmailOpen(true)}>
              Email PO
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          <Badge variant={getPurchaseOrderStatusColor(purchaseOrder.status) as 'gray' | 'blue' | 'indigo' | 'green' | 'red'}>
            {statusLabel}
          </Badge>
          <Badge variant="secondary">Expected: {purchaseOrder.expected_delivery_date ?? '—'}</Badge>
          <Badge variant="secondary">Created: {purchaseOrder.created_at}</Badge>
          <Badge variant="secondary">Updated: {purchaseOrder.updated_at}</Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Order Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Detail label="PO ID" value={purchaseOrder.id} />
              <Detail label="Supplier" value={supplierName} />
              <Detail label="Supplier ID" value={purchaseOrder.supplier_id} />
              <Detail label="Notes" value={purchaseOrder.notes ?? '—'} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Totals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Row label="Subtotal" value={formatCurrency(subtotal)} />
              <Row label="Tax" value={formatCurrency(0)} />
              <Row label="Discount" value={formatCurrency(0)} />
              <Row label="Total" value={formatCurrency(subtotal)} strong />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            {purchaseOrder.items.length === 0 ? (
              <EmptyState title="No items" body="This purchase order does not have any line items." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-border text-left text-sm text-muted-foreground">
                      <th className="py-3 pr-4">Product</th>
                      <th className="py-3 pr-4">Ordered</th>
                      <th className="py-3 pr-4">Received</th>
                      <th className="py-3 pr-4">Pending</th>
                      <th className="py-3 pr-4">Unit Price</th>
                      <th className="py-3 pr-4">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseOrder.items.map((item) => {
                      const product = productMap.get(item.product_id);
                      const lineTotal = item.ordered_qty * item.unit_price;
                      return (
                        <tr key={item.line_item_id} className="border-b border-border/60">
                          <td className="py-4 pr-4">
                            <div className="font-medium">{product?.name ?? `Product #${item.product_id}`}</div>
                            <div className="text-xs text-muted-foreground">ID {item.product_id}</div>
                          </td>
                          <td className="py-4 pr-4">{item.ordered_qty}</td>
                          <td className="py-4 pr-4">{item.received_qty}</td>
                          <td className="py-4 pr-4">{Math.max(item.ordered_qty - item.received_qty, 0)}</td>
                          <td className="py-4 pr-4">{formatCurrency(item.unit_price)}</td>
                          <td className="py-4 pr-4">{formatCurrency(lineTotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={sendOpen}
        title="Send Purchase Order"
        body="Send this draft purchase order to the supplier?"
        confirmLabel={sendMutation.isPending ? 'Sending…' : 'Send'}
        onConfirm={handleSend}
        onCancel={() => setSendOpen(false)}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Purchase Order"
        body="Confirm this purchase order after supplier acknowledgement?"
        confirmLabel={confirmMutation.isPending ? 'Confirming…' : 'Confirm'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel Purchase Order"
        body="Cancel this purchase order? The backend uses the current order state only."
        confirmLabel={cancelMutation.isPending ? 'Cancelling…' : 'Cancel'}
        destructive
        onConfirm={handleCancel}
        onCancel={() => setCancelOpen(false)}
      />

      {receiveOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-background p-6 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Receive Purchase Order</h3>
                <p className="text-sm text-muted-foreground">Submit the quantities actually received for each line item.</p>
              </div>
              <Button type="button" variant="secondary" onClick={() => setReceiveOpen(false)}>
                Close
              </Button>
            </div>
            <div className="mt-6 space-y-4">
              {receiveItems.map((item, index) => (
                <div key={item.product_id} className="rounded-lg border border-border p-4">
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="md:col-span-2">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground">Ordered: {item.ordered_qty} · Already received: {item.received_qty}</div>
                    </div>
                    <label className="space-y-2">
                      <span className="text-sm font-medium">Received Qty</span>
                      <Input
                        type="number"
                        min={0}
                        step="0.001"
                        value={item.value}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          setReceiveItems((current) =>
                            current.map((entry, currentIndex) => (currentIndex === index ? { ...entry, value: nextValue } : entry)),
                          );
                        }}
                      />
                    </label>
                    <div className="text-sm text-muted-foreground md:text-right">
                      Remaining after submit: {Math.max(item.remaining_qty - Number(item.value || 0), 0)}
                    </div>
                  </div>
                </div>
              ))}
              <label className="space-y-2">
                <span className="text-sm font-medium">Notes</span>
                <textarea
                  className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={receiveNotes}
                  onChange={(event) => setReceiveNotes(event.target.value)}
                  placeholder="Optional receiving notes"
                />
              </label>
            </div>
            <div className="mt-6 flex gap-3">
              <Button type="button" loading={receiveMutation.isPending} onClick={handleReceive}>
                Submit Receipt
              </Button>
              <Button type="button" variant="secondary" onClick={() => setReceiveOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {emailOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Email Purchase Order</h3>
                <p className="text-sm text-muted-foreground">The backend requires a recipient email address.</p>
              </div>
              <Button type="button" variant="secondary" onClick={() => setEmailOpen(false)}>
                Close
              </Button>
            </div>
            <div className="mt-6 space-y-4">
              <label className="space-y-2">
                <span className="text-sm font-medium">Recipient Email</span>
                <Input type="email" value={emailValue} onChange={(event) => setEmailValue(event.target.value)} placeholder="supplier@example.com" />
              </label>
            </div>
            <div className="mt-6 flex gap-3">
              <Button type="button" loading={emailMutation.isPending} onClick={handleEmail}>
                Send Email
              </Button>
              <Button type="button" variant="secondary" onClick={() => setEmailOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </PageFrame>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${strong ? 'text-lg font-semibold' : ''}`}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
