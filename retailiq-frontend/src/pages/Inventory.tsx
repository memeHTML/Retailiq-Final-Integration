/**
 * src/pages/Inventory.tsx
 * Oracle Document sections consumed: 3, 7, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useDeleteProductMutation, useProductsQuery } from '@/hooks/inventory';
import { normalizeApiError } from '@/utils/errors';
import { uiStore } from '@/stores/uiStore';

export default function InventoryPage() {
  const addToast = uiStore((state) => state.addToast);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [categoryId, setCategoryId] = useState('');
  const [deleteId, setDeleteId] = useState<number | string | null>(null);
  const query = useProductsQuery({ page, page_size: pageSize, category_id: categoryId || undefined });
  const deleteMutation = useDeleteProductMutation();

  if (query.isError) {
    return <ErrorState error={normalizeApiError(query.error)} onRetry={() => void query.refetch()} />;
  }

  if (query.isLoading) {
    return (
      <PageFrame title="Inventory" subtitle="Review products, stock levels, and activation state.">
        <SkeletonLoader variant="rect" height={64} />
        <SkeletonLoader variant="rect" height={420} />
      </PageFrame>
    );
  }

  const rows = query.data?.data ?? [];
  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / (query.data?.page_size ?? pageSize)));

  const onDelete = async () => {
    if (deleteId === null) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(deleteId);
      addToast({ title: 'Product deactivated', message: 'The product was deactivated.', variant: 'success' });
      setDeleteId(null);
      void query.refetch();
    } catch (error) {
      addToast({ title: 'Delete failed', message: normalizeApiError(error).message, variant: 'error' });
    }
  };

  return (
    <PageFrame
      title="Inventory"
      subtitle="Review products, stock levels, and activation state."
      actions={(
        <div className="grid grid--2" style={{ alignItems: 'end' }}>
          <label className="field">
            <span>Category ID</span>
            <input className="input" type="number" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} />
          </label>
          <label className="field">
            <span>Page size</span>
            <select className="select" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
          </label>
        </div>
      )}
    >
      <div className="button-row">
        <Link className="button" to="/inventory/new">Create product</Link>
        <Link className="button button--secondary" to="/inventory/stock-audit">Stock audit</Link>
      </div>
      {rows.length ? (
        <DataTable
          columns={[
            { key: 'name', header: 'Product', render: (row) => <Link to={`/inventory/${row.product_id}`}>{row.name}</Link> },
            { key: 'sku', header: 'SKU', render: (row) => row.sku_code },
            { key: 'stock', header: 'Stock', render: (row) => row.current_stock },
            { key: 'price', header: 'Selling price', render: (row) => row.selling_price },
            { key: 'status', header: 'Status', render: (row) => (row.is_active ? 'Active' : 'Inactive') },
            { key: 'actions', header: 'Actions', render: (row) => <button className="button button--danger" type="button" onClick={() => setDeleteId(row.product_id)}>Delete</button> },
          ]}
          data={rows}
        />
      ) : (
        <EmptyState title="No inventory found" body="Create your first product to start selling." />
      )}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete product?"
        body="This will deactivate the product and should only be used when the item is no longer sold."
        confirmLabel={deleteMutation.isPending ? 'Deleting…' : 'Delete product'}
        destructive
        requireTypedConfirmation="DELETE"
        onConfirm={() => void onDelete()}
        onCancel={() => setDeleteId(null)}
      />
    </PageFrame>
  );
}
