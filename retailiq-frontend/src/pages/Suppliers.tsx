import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageFrame } from '@/components/layout/PageFrame';
import { useDeleteSupplier, useSupplierHydration, useSuppliers } from '@/hooks/suppliers';
import { uiStore } from '@/stores/uiStore';
import { normalizeApiError } from '@/utils/errors';
import type { ApiError } from '@/types/api';
import type { SupplierListItem } from '@/api/suppliers';

export default function SuppliersPage() {
  const navigate = useNavigate();
  const addToast = uiStore((state) => state.addToast);
  const { data, isLoading, error, refetch } = useSuppliers();
  const supplierIds = useMemo(() => (data ?? []).map((supplier) => supplier.id), [data]);
  const { supplierDetails, isHydrating } = useSupplierHydration(supplierIds);
  const deleteMutation = useDeleteSupplier();
  const [search, setSearch] = useState('');
  const [supplierToDelete, setSupplierToDelete] = useState<SupplierListItem | null>(null);

  const filteredSuppliers = useMemo(() => {
    const suppliers = data ?? [];
    const needle = search.trim().toLowerCase();
    if (!needle) {
      return suppliers;
    }
    return suppliers.filter((supplier) =>
      [supplier.name, supplier.contact_name ?? '', supplier.email ?? '', supplier.phone ?? '']
        .join(' ')
        .toLowerCase()
        .includes(needle),
    );
  }, [data, search]);

  const handleDelete = async () => {
    if (!supplierToDelete) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(supplierToDelete.id);
      addToast({
        title: 'Supplier deleted',
        message: supplierToDelete.name,
        variant: 'success',
      });
      setSupplierToDelete(null);
    } catch {
      // surfaced by mutation error state
    }
  };

  if (isLoading) {
    return (
      <PageFrame title="Suppliers" subtitle="Manage supplier records and product links">
        <Card>
          <CardHeader>
            <SkeletonLoader width="40%" height="24px" variant="text" />
          </CardHeader>
          <CardContent className="space-y-3">
            <SkeletonLoader width="100%" height="40px" variant="rect" />
            <SkeletonLoader width="100%" height="300px" variant="rect" />
          </CardContent>
        </Card>
      </PageFrame>
    );
  }

  if (error) {
    return (
      <PageFrame title="Suppliers" subtitle="Manage supplier records and product links">
        <ErrorState error={normalizeApiError(error) as ApiError} onRetry={() => refetch()} />
      </PageFrame>
    );
  }

  return (
    <PageFrame
      title="Suppliers"
      subtitle="Manage supplier records and product links"
      actions={
        <Button type="button" onClick={() => navigate('/suppliers/new')}>
          Add Supplier
        </Button>
      }
    >
      <Card className="mb-6">
        <CardContent className="pt-6">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by supplier name, contact, email, or phone"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{filteredSuppliers.length} supplier{filteredSuppliers.length === 1 ? '' : 's'}</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSuppliers.length === 0 ? (
            <EmptyState
              title="No suppliers found"
              body={search ? 'Try a different search term.' : 'Create your first supplier to get started.'}
              action={
                search
                  ? undefined
                  : {
                      label: 'Add Supplier',
                      onClick: () => navigate('/suppliers/new'),
                    }
              }
            />
          ) : (
            <DataTable
              data={filteredSuppliers}
              emptyMessage="No suppliers available."
              columns={[
                {
                  key: 'name',
                  header: 'Name',
                  render: (supplier) => (
                    <div>
                      <div className="font-medium">{supplier.name}</div>
                      <div className="text-xs text-muted-foreground">{supplier.id}</div>
                    </div>
                  ),
                },
                {
                  key: 'contact_name',
                  header: 'Contact Person',
                  render: (supplier) => supplier.contact_name ?? '—',
                },
                {
                  key: 'email',
                  header: 'Email',
                  render: (supplier) => supplier.email ?? '—',
                },
                {
                  key: 'phone',
                  header: 'Phone',
                  render: (supplier) => supplier.phone ?? '—',
                },
                {
                  key: 'terms',
                  header: 'Payment Terms',
                  render: (supplier) => supplier.payment_terms_days ?? '—',
                },
                {
                  key: 'lead_time',
                  header: 'Avg Lead Time',
                  render: (supplier) => supplier.avg_lead_time_days ?? '—',
                },
                {
                  key: 'fill_rate',
                  header: 'Fill Rate',
                  render: (supplier) => `${supplier.fill_rate_90d.toFixed(1)}%`,
                },
                {
                  key: 'price_change',
                  header: 'Price Change',
                  render: (supplier) => (supplier.price_change_6m_pct === null ? '—' : `${supplier.price_change_6m_pct.toFixed(2)}%`),
                },
                {
                  key: 'products',
                  header: 'Products Linked',
                  render: (supplier) => {
                    const supplierDetail = supplierDetails[supplier.id];
                    if (!supplierDetail) {
                      return <span>{isHydrating ? 'Loading…' : '—'}</span>;
                    }

                    return <span>{supplierDetail.sourced_products.length} products</span>;
                  },
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (supplier) => (
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="secondary" onClick={() => navigate(`/suppliers/${supplier.id}`)}>
                        View
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => navigate(`/suppliers/${supplier.id}/edit`)}>
                        Edit
                      </Button>
                      <Button type="button" variant="destructive" onClick={() => setSupplierToDelete(supplier)}>
                        Delete
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(supplierToDelete)}
        title="Delete Supplier"
        body={`Delete ${supplierToDelete?.name}? This will soft-delete the supplier in the backend.`}
        confirmLabel={deleteMutation.isPending ? 'Deleting…' : 'Delete'}
        destructive
        onConfirm={handleDelete}
        onCancel={() => setSupplierToDelete(null)}
      />
    </PageFrame>
  );
}
