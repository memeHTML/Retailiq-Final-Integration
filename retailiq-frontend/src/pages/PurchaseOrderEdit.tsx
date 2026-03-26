import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { PurchaseOrderForm } from '@/components/purchases/PurchaseOrderForm';
import { usePurchaseOrder } from '@/hooks/purchaseOrders';
import { normalizeApiError } from '@/utils/errors';
import type { ApiError } from '@/types/api';

export default function PurchaseOrderEditPage() {
  const navigate = useNavigate();
  const { poId, id } = useParams<{ poId?: string; id?: string }>();
  const purchaseOrderId = poId ?? id ?? '';
  const { data: purchaseOrder, isLoading, error, refetch } = usePurchaseOrder(purchaseOrderId);

  const initialValues = useMemo(
    () =>
      purchaseOrder
        ? {
            supplier_id: purchaseOrder.supplier_id,
            expected_delivery_date: purchaseOrder.expected_delivery_date ?? '',
            notes: purchaseOrder.notes ?? '',
            items: purchaseOrder.items.map((item) => ({
              product_id: String(item.product_id),
              ordered_qty: String(item.ordered_qty),
              unit_price: String(item.unit_price),
            })),
          }
        : undefined,
    [purchaseOrder],
  );

  if (isLoading) {
    return (
      <PageFrame title="Edit Purchase Order" subtitle="Update draft PO details">
        <SkeletonLoader width="100%" height="360px" variant="rect" />
      </PageFrame>
    );
  }

  if (error) {
    return (
      <PageFrame title="Edit Purchase Order" subtitle="Update draft PO details">
        <ErrorState error={normalizeApiError(error) as ApiError} onRetry={() => refetch()} />
      </PageFrame>
    );
  }

  if (!purchaseOrder || !initialValues) {
    return (
      <PageFrame title="Edit Purchase Order" subtitle="Update draft PO details">
        <EmptyState title="Purchase order not found" body="The purchase order may have been deleted." />
      </PageFrame>
    );
  }

  if (purchaseOrder.status !== 'DRAFT') {
    return (
      <PageFrame title="Edit Purchase Order" subtitle="Only draft POs are editable">
        <EmptyState
          title="PO is locked"
          body="The backend only allows draft purchase orders to be edited."
          action={{
            label: 'Back to Purchase Orders',
            onClick: () => navigate(`/purchase-orders/${purchaseOrderId}`),
          }}
        />
      </PageFrame>
    );
  }

  return (
    <PageFrame title={`Edit Purchase Order ${purchaseOrderId}`} subtitle="Update draft PO details">
      <PurchaseOrderForm
        purchaseOrderId={purchaseOrderId}
        initialValues={initialValues}
        onCancel={() => navigate(`/purchase-orders/${purchaseOrderId}`)}
        onSuccess={(updatedPurchaseOrderId) => navigate(`/purchase-orders/${updatedPurchaseOrderId}`)}
      />
    </PageFrame>
  );
}
