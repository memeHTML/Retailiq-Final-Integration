import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/Dialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useProductQuery, useProductsQuery } from '@/hooks/inventory';
import type { Product } from '@/types/models';
import { normalizeApiError } from '@/utils/errors';

export interface ProductResolution {
  product: Product | null;
  isLoading: boolean;
  isError: boolean;
}

interface ProductPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  helperText?: string;
  error?: string | null;
  disabled?: boolean;
  pageSize?: number;
  onResolutionChange?: (resolution: ProductResolution) => void;
}

const DEFAULT_PAGE_SIZE = 25;
const PRODUCT_ID_RE = /^\d+$/;

const formatProductSummary = (product: Product) =>
  `${product.name} | SKU ${product.sku_code || '-'} | Stock ${product.current_stock} | Rs ${product.selling_price}`;

export function ProductPicker({
  value,
  onChange,
  label = 'Product',
  helperText,
  error,
  disabled = false,
  pageSize = DEFAULT_PAGE_SIZE,
  onResolutionChange,
}: ProductPickerProps) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [exactProductId, setExactProductId] = useState(value);
  const [exactError, setExactError] = useState<string | null>(null);

  const productsQuery = useProductsQuery({ page, page_size: pageSize });
  const selectedProductQuery = useProductQuery(value || null);

  const products = useMemo(() => productsQuery.data?.data ?? [], [productsQuery.data]);
  const totalPages = useMemo(() => {
    const total = productsQuery.data?.total ?? 0;
    const perPage = productsQuery.data?.page_size ?? pageSize;
    return Math.max(1, Math.ceil(total / Math.max(1, perPage)));
  }, [pageSize, productsQuery.data?.page_size, productsQuery.data?.total]);

  useEffect(() => {
    setExactProductId(value);
  }, [value]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const selectedQueryProductId = selectedProductQuery.data ? String(selectedProductQuery.data.product_id) : null;
  const selectedProduct =
    selectedQueryProductId === value
      ? selectedProductQuery.data
      : products.find((product) => String(product.product_id) === value) ?? null;
  const selectedLoading = Boolean(value) && !selectedProduct && selectedProductQuery.isFetching;
  const selectedError = Boolean(value) && !selectedProduct && selectedProductQuery.isError;

  useEffect(() => {
    onResolutionChange?.({
      product: selectedProduct ?? null,
      isLoading: selectedLoading,
      isError: selectedError,
    });
  }, [onResolutionChange, selectedError, selectedLoading, selectedProduct]);

  const selectProduct = (product: Product) => {
    onChange(String(product.product_id));
    setExactProductId(String(product.product_id));
    setExactError(null);
    setOpen(false);
  };

  const loadExactProduct = () => {
    const trimmed = exactProductId.trim();
    if (!trimmed) {
      setExactError('Product ID is required.');
      return;
    }

    if (!PRODUCT_ID_RE.test(trimmed) || Number(trimmed) <= 0) {
      setExactError('Product ID must be a positive whole number.');
      return;
    }

    setExactError(null);
    onChange(trimmed);
    setOpen(false);
  };

  const currentPageColumns: Column<Product>[] = [
    { key: 'name', header: 'Product', render: (row) => row.name },
    { key: 'id', header: 'Product ID', render: (row) => row.product_id },
    { key: 'sku', header: 'SKU', render: (row) => row.sku_code || '-' },
    { key: 'stock', header: 'Stock', render: (row) => row.current_stock },
    { key: 'price', header: 'Price', render: (row) => row.selling_price },
    {
      key: 'action',
      header: 'Action',
      render: (row) => (
        <Button type="button" variant={String(row.product_id) === value ? 'secondary' : 'ghost'} size="sm" onClick={() => selectProduct(row)} disabled={disabled}>
          {String(row.product_id) === value ? 'Selected' : 'Select'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-900">{label}</div>
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          {!value ? (
            <div className="text-sm text-gray-600">No product selected yet. Browse inventory or load a product ID exactly.</div>
          ) : selectedLoading ? (
            <div className="space-y-1 text-sm">
              <div className="font-medium text-gray-900">Loading product {value}...</div>
              <div className="text-gray-600">Fetching the authoritative product record from inventory.</div>
            </div>
          ) : selectedError ? (
            <div className="space-y-1 text-sm">
              <div className="font-medium text-red-700">Selected product unavailable</div>
              <div className="text-gray-600">Product {value} could not be resolved from the backend.</div>
            </div>
          ) : selectedProduct ? (
            <div className="space-y-1 text-sm">
              <div className="font-medium text-gray-900">{selectedProduct.name}</div>
              <div className="text-gray-600">{formatProductSummary(selectedProduct)}</div>
            </div>
          ) : (
            <div className="text-sm text-gray-600">Browse the catalog or enter a product ID to resolve it exactly.</div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(true)} disabled={disabled}>
              Choose product
            </Button>
            {value ? (
              <Button type="button" variant="ghost" onClick={() => onChange('')} disabled={disabled}>
                Clear
              </Button>
            ) : null}
          </div>
          {helperText ? <p className="mt-2 text-xs text-gray-500">{helperText}</p> : null}
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl">
          <DialogTitle>Choose a product</DialogTitle>
          <DialogDescription>Browse the backend inventory list one page at a time or load a product by exact ID.</DialogDescription>

          <div className="mt-5 space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Load by exact ID</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                <Input
                  label="Product ID"
                  value={exactProductId}
                  onChange={(event) => setExactProductId(event.target.value)}
                  placeholder="Enter product ID"
                  error={exactError ?? undefined}
                  disabled={disabled}
                />
                <Button type="button" onClick={loadExactProduct} disabled={disabled}>
                  Load product
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventory page {page}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {productsQuery.isLoading ? (
                  <SkeletonLoader variant="rect" height={220} />
                ) : productsQuery.isError ? (
                  <ErrorState error={normalizeApiError(productsQuery.error)} onRetry={() => void productsQuery.refetch()} />
                ) : products.length > 0 ? (
                  <DataTable columns={currentPageColumns} data={products} emptyMessage="No products found on this page." />
                ) : (
                  <EmptyState title="No products on this page" body="The backend returned an empty inventory page." />
                )}

                {totalPages > 1 ? <Pagination page={page} totalPages={totalPages} onPageChange={setPage} /> : null}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
