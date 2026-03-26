import { useNavigate } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { SupplierForm } from '@/components/suppliers/SupplierForm';

export default function SupplierCreatePage() {
  const navigate = useNavigate();

  return (
    <PageFrame title="Create Supplier" subtitle="Add a new supplier to the store">
      <SupplierForm onCancel={() => navigate('/suppliers')} onSuccess={(supplierId) => navigate(`/suppliers/${supplierId}`)} />
    </PageFrame>
  );
}
