import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { SupplierForm } from '@/components/suppliers/SupplierForm';
import { useSupplier } from '@/hooks/suppliers';
import { normalizeApiError } from '@/utils/errors';
import type { ApiError } from '@/types/api';

export default function SupplierEditPage() {
  const navigate = useNavigate();
  const { supplierId, id } = useParams<{ supplierId?: string; id?: string }>();
  const resolvedSupplierId = supplierId ?? id ?? '';
  const { data: supplier, isLoading, error, refetch } = useSupplier(resolvedSupplierId);

  const initialValues = useMemo(
    () =>
      supplier
        ? {
            name: supplier.name,
            contact_name: supplier.contact.name ?? '',
            phone: supplier.contact.phone ?? '',
            email: supplier.contact.email ?? '',
            address: supplier.contact.address ?? '',
            payment_terms_days: supplier.payment_terms_days === null ? '' : String(supplier.payment_terms_days),
            is_active: supplier.is_active,
          }
        : undefined,
    [supplier],
  );

  if (isLoading) {
    return (
      <PageFrame title="Edit Supplier" subtitle="Update supplier details">
        <SkeletonLoader width="100%" height="320px" variant="rect" />
      </PageFrame>
    );
  }

  if (error) {
    return (
      <PageFrame title="Edit Supplier" subtitle="Update supplier details">
        <ErrorState error={normalizeApiError(error) as ApiError} onRetry={() => refetch()} />
      </PageFrame>
    );
  }

  if (!supplier || !initialValues) {
    return (
      <PageFrame title="Edit Supplier" subtitle="Update supplier details">
        <EmptyState title="Supplier not found" body="The supplier may have been deleted." />
      </PageFrame>
    );
  }

  return (
    <PageFrame title={`Edit ${supplier.name}`} subtitle="Update supplier details">
      <SupplierForm
        supplierId={resolvedSupplierId}
        initialValues={initialValues}
        onCancel={() => navigate(`/suppliers/${resolvedSupplierId}`)}
        onSuccess={(updatedId) => navigate(`/suppliers/${updatedId}`)}
      />
    </PageFrame>
  );
}
