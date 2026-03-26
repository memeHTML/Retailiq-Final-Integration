import { useNavigate } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { PurchaseOrderForm } from '@/components/purchases/PurchaseOrderForm';

export default function PurchaseOrderCreatePage() {
  const navigate = useNavigate();

  return (
    <PageFrame title="Create Purchase Order" subtitle="Create a backend-backed draft PO">
      <PurchaseOrderForm onCancel={() => navigate('/purchase-orders')} onSuccess={(purchaseOrderId) => navigate(`/purchase-orders/${purchaseOrderId}`)} />
    </PageFrame>
  );
}
