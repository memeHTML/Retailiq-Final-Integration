import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Boxes, Grid2x2, Plus, RefreshCcw, Search, ShieldCheck, Table2 } from 'lucide-react';
import { PageFrame } from '@/components/layout/PageFrame';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useCategoriesQuery } from '@/hooks/store';
import { useDeleteProduct, useProducts } from '@/hooks/useInventory';
import { InventoryProductsSkeleton } from '@/features/inventory/loading';
import { normalizeApiError } from '@/utils/errors';
import { uiStore } from '@/stores/uiStore';
import { authStore } from '@/stores/authStore';
import { formatCurrency } from '@/utils/numbers';
import { inventoryQuantityState } from '@/features/inventory/utils';
import type { Product } from '@/types/models';

const PAGE_SIZE = 12;

function ProductCard({ product, categoryName, onDelete, owner }: { product: Product; categoryName: string; owner: boolean; onDelete: (product: Product) => void }) {
  const stockState = inventoryQuantityState(product);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{product.name}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{product.sku_code || 'No SKU'}</p>
          </div>
          <Badge variant={stockState.variant}>{stockState.label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Category</span>
            <span>{categoryName}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Price</span>
            <span className="font-medium">{formatCurrency(product.selling_price)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Stock</span>
            <span className="font-medium">{product.current_stock}</span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link className="button button--secondary" to={`/inventory/${product.product_id}`}>View</Link>
          {owner ? (
            <Link className="button button--ghost" to={`/inventory/${product.product_id}/edit`}>Edit</Link>
          ) : null}
          {owner ? (
            <Button variant="destructive" size="sm" onClick={() => onDelete(product)}>Delete</Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const addToast = uiStore((state) => state.addToast);
  const role = authStore((state) => state.role);
  const owner = role === 'owner';

  const [searchText, setSearchText] = useState(searchParams.get('search') ?? '');
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const categoryId = searchParams.get('category_id') ?? '';
  const lowStock = searchParams.get('low_stock') === 'true';
  const view = searchParams.get('view') === 'table' ? 'table' : 'grid';

  const categoriesQuery = useCategoriesQuery();
  const productsQuery = useProducts({
    page,
    page_size: PAGE_SIZE,
    category_id: categoryId ? Number(categoryId) : undefined,
    low_stock: lowStock || undefined,
  });
  const deleteMutation = useDeleteProduct();

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (searchText.trim()) {
        next.set('search', searchText.trim());
      } else {
        next.delete('search');
      }
      next.set('page', '1');
      setSearchParams(next, { replace: true });
    }, 400);

    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  useEffect(() => {
    setSearchText(searchParams.get('search') ?? '');
  }, [searchParams]);

  const categories = categoriesQuery.data?.categories ?? [];
  const categoryNameById = useMemo(() => new Map(categories.map((category) => [String(category.category_id), category.name])), [categories]);

  const rows = productsQuery.data?.data ?? [];
  const totalProducts = productsQuery.data?.total ?? rows.length;
  const lowStockProducts = rows.filter((product) => inventoryQuantityState(product).variant === 'warning' || inventoryQuantityState(product).variant === 'destructive');
  const activeProducts = rows.filter((product) => product.is_active).length;
  const filteredRows = useMemo(() => {
    const needle = searchText.trim().toLowerCase();
    if (!needle) {
      return rows;
    }

    return rows.filter((product) => (
      product.name.toLowerCase().includes(needle)
      || product.sku_code?.toLowerCase().includes(needle)
      || product.barcode?.toLowerCase().includes(needle)
      || String(product.product_id).includes(needle)
    ));
  }, [rows, searchText]);

  const totalPages = Math.max(1, Math.ceil((productsQuery.data?.total ?? rows.length) / (productsQuery.data?.page_size ?? PAGE_SIZE)));

  if (productsQuery.isError) {
    return <ErrorState error={normalizeApiError(productsQuery.error)} onRetry={() => void productsQuery.refetch()} />;
  }

  if (productsQuery.isLoading) {
    return (
      <PageFrame title="Inventory" subtitle="Products, stock levels, and catalog management.">
        <InventoryProductsSkeleton view={view} />
      </PageFrame>
    );
  }

  const onDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(deleteTarget.product_id);
      addToast({ title: 'Product deleted', message: `${deleteTarget.name} removed from inventory.`, variant: 'success' });
      setDeleteTarget(null);
      void productsQuery.refetch();
    } catch (error) {
      addToast({ title: 'Delete failed', message: normalizeApiError(error).message, variant: 'error' });
    }
  };

  const updateParam = (nextValues: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(nextValues).forEach(([key, value]) => {
      if (value && value.length > 0) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
    });
    setSearchParams(next, { replace: true });
  };

  const empty = filteredRows.length === 0;

  return (
    <PageFrame
      title="Inventory"
      subtitle="Browse products, edit catalog details, and keep stock healthy."
      actions={(
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="hidden sm:inline-flex">
            {totalProducts.toLocaleString()} products
          </Badge>
          <Button variant="secondary" size="sm" onClick={() => productsQuery.refetch()}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {owner ? (
            <Button size="sm" onClick={() => navigate('/inventory/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          ) : null}
        </div>
      )}
    >
      <Card className="mb-4 border-border/80 shadow-sm">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{totalProducts.toLocaleString()} total</Badge>
                <Badge variant={lowStock ? 'warning' : 'secondary'}>
                  {lowStock ? 'Low stock view' : `${lowStockProducts.length.toLocaleString()} low stock`}
                </Badge>
                <Badge variant="secondary">{activeProducts.toLocaleString()} active</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Search the catalog, switch the layout, and keep the inventory snapshot moving.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={view === 'grid' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => updateParam({ view: 'grid' })}
              >
                <Grid2x2 className="mr-2 h-4 w-4" />
                Grid
              </Button>
              <Button
                variant={view === 'table' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => updateParam({ view: 'table' })}
              >
                <Table2 className="mr-2 h-4 w-4" />
                Table
              </Button>
              {owner ? (
                <Button variant="secondary" size="sm" onClick={() => navigate('/inventory/stock-audit')}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Stock Audit
                </Button>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_180px]">
            <label className="field">
              <span>Search</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="input pl-9"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search products, SKU, barcode..."
                />
              </div>
            </label>
            <label className="field">
              <span>Category</span>
              <select
                className="input"
                value={categoryId}
                onChange={(event) => updateParam({ category_id: event.target.value, page: '1' })}
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.category_id} value={category.category_id}>{category.name}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Low stock</span>
              <button
                className={`button ${lowStock ? '' : 'button--secondary'}`}
                type="button"
                onClick={() => updateParam({ low_stock: lowStock ? undefined : 'true', page: '1' })}
              >
                {lowStock ? 'Showing low stock only' : 'Show low stock'}
              </button>
            </label>
          </div>
        </CardContent>
      </Card>

      {empty ? (
        <EmptyState
          title={searchText ? 'No matching products' : 'No products found'}
          body={searchText ? 'Try a different search term or clear filters.' : 'Create your first product to start building the catalog.'}
          action={owner ? { label: 'Add Product', onClick: () => navigate('/inventory/new') } : undefined}
        />
      ) : view === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredRows.map((product) => (
            <ProductCard
              key={product.product_id}
              product={product}
              owner={owner}
              categoryName={categoryNameById.get(String(product.category_id ?? '')) ?? 'Uncategorized'}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      ) : (
        <DataTable
          columns={[
            { key: 'name', header: 'Product', render: (product: Product) => <Link className="font-medium text-primary underline-offset-4 hover:underline" to={`/inventory/${product.product_id}`}>{product.name}</Link> },
            { key: 'sku', header: 'SKU / Barcode', render: (product: Product) => product.sku_code || product.barcode || '—' },
            { key: 'category', header: 'Category', render: (product: Product) => categoryNameById.get(String(product.category_id ?? '')) ?? 'Uncategorized' },
            { key: 'selling', header: 'Selling Price', render: (product: Product) => formatCurrency(product.selling_price) },
            { key: 'cost', header: 'Cost Price', render: (product: Product) => formatCurrency(product.cost_price) },
            { key: 'quantity', header: 'Quantity', render: (product: Product) => <Badge variant={inventoryQuantityState(product).variant}>{product.current_stock}</Badge> },
            { key: 'status', header: 'Status', render: (product: Product) => <Badge variant={product.is_active ? 'success' : 'secondary'}>{product.is_active ? 'Active' : 'Inactive'}</Badge> },
            {
              key: 'actions',
              header: 'Actions',
              render: (product: Product) => (
                <div className="flex flex-wrap gap-2">
                  <Link className="button button--ghost" to={`/inventory/${product.product_id}`}>View</Link>
                  {owner ? (
                    <Link className="button button--secondary" to={`/inventory/${product.product_id}/edit`}>Edit</Link>
                  ) : null}
                  {owner ? (
                    <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(product)}>Delete</Button>
                  ) : null}
                </div>
              ),
            },
          ]}
          data={filteredRows}
          emptyMessage="No products match your current filters."
        />
      )}

      <div className="mt-4">
        <Pagination page={page} totalPages={totalPages} onPageChange={(nextPage) => updateParam({ page: String(nextPage) })} />
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete product?"
        body={deleteTarget ? `Delete ${deleteTarget.name}? This will remove it from inventory.` : 'Delete this product?'}
        confirmLabel={deleteMutation.isPending ? 'Deleting…' : 'Delete product'}
        destructive
        requireTypedConfirmation="DELETE"
        onConfirm={() => void onDelete()}
        onCancel={() => setDeleteTarget(null)}
      />

      {!owner ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Boxes className="h-4 w-4" />
          Create, edit, and stock audit actions are reserved for owners.
        </div>
      ) : null}
    </PageFrame>
  );
}
