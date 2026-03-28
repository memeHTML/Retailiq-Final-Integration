import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, RefreshCcw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageFrame } from '@/components/layout/PageFrame';
import { ChartCard } from '@/components/shared/ChartCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useProduct, useStockUpdate, usePriceHistory } from '@/hooks/useInventory';
import { useCategoriesQuery } from '@/hooks/store';
import { InventoryDetailSkeleton } from '@/features/inventory/loading';
import { authStore } from '@/stores/authStore';
import { uiStore } from '@/stores/uiStore';
import { formatCurrency } from '@/utils/numbers';
import { formatDisplayDateTime, toApiDate } from '@/utils/dates';
import { normalizeApiError } from '@/utils/errors';
import { stockUpdateSchema, type StockUpdateFormValues } from '@/types/schemas';
import { inventoryQuantityState } from '@/features/inventory/utils';
import type { InventoryPriceHistoryEntry } from '@/types/api';

function PriceHistoryChart({ history }: { history: InventoryPriceHistoryEntry[] }) {
  const chartData = useMemo(() => history.slice().reverse().map((entry, index) => ({
    label: entry.changed_at ? formatDisplayDateTime(entry.changed_at) : `Entry ${index + 1}`,
    selling_price: Number(entry.selling_price ?? 0),
    cost_price: Number(entry.cost_price ?? 0),
  })), [history]);

  if (!chartData.length) {
    return <EmptyState title="No price history yet" body="Price updates will appear here once the product changes." />;
  }

  return (
    <div className="space-y-3">
      {chartData.map((entry) => {
        const max = Math.max(entry.selling_price, entry.cost_price, 1);
        const sellingPct = Math.round((entry.selling_price / max) * 100);
        const costPct = Math.round((entry.cost_price / max) * 100);
        return (
          <div key={entry.label} className="rounded-lg border border-border bg-muted/10 p-3">
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>{entry.label}</span>
              <span>{formatCurrency(entry.selling_price)}</span>
            </div>
            <div className="mt-2 space-y-2">
              <div>
                <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Selling price</span>
                  <span>{formatCurrency(entry.selling_price)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${sellingPct}%` }} />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Cost price</span>
                  <span>{formatCurrency(entry.cost_price)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-slate-500" style={{ width: `${costPct}%` }} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ProductDetailPage() {
  const { productId = '' } = useParams();
  const navigate = useNavigate();
  const addToast = uiStore((state) => state.addToast);
  const role = authStore((state) => state.role);
  const owner = role === 'owner';
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const productQuery = useProduct(productId);
  const stockUpdateMutation = useStockUpdate();
  const priceHistoryQuery = usePriceHistory(productId);
  const categoriesQuery = useCategoriesQuery();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<StockUpdateFormValues>({
    resolver: zodResolver(stockUpdateSchema),
    defaultValues: {
      quantity_added: 1,
      purchase_price: 0,
      date: toApiDate(new Date()),
      supplier_name: '',
      update_cost_price: true,
    },
  });

  if (productQuery.isError) {
    return <ErrorState error={normalizeApiError(productQuery.error)} onRetry={() => void productQuery.refetch()} />;
  }

  if (productQuery.isLoading) {
    return (
      <PageFrame title="Inventory detail" subtitle="Loading product details...">
        <InventoryDetailSkeleton />
      </PageFrame>
    );
  }

  const product = productQuery.data;
  if (!product) {
    return <ErrorState error={{ message: 'Product not found.', status: 404 }} onRetry={() => navigate('/inventory')} />;
  }

  const categoryName = categoriesQuery.data?.categories?.find((category) => category.category_id === product.category_id)?.name ?? 'Uncategorized';
  const stockState = inventoryQuantityState(product);
  const priceHistory = priceHistoryQuery.data?.history ?? [];

  const onSubmit = handleSubmit(async (values) => {
    setServerMessage(null);
    try {
      await stockUpdateMutation.mutateAsync({ productId: product.product_id, payload: values });
      addToast({ title: 'Stock updated', message: 'The stock movement has been recorded.', variant: 'success' });
      void productQuery.refetch();
      void priceHistoryQuery.refetch();
    } catch (error) {
      const apiError = normalizeApiError(error);
      setServerMessage(apiError.message);
    }
  });

  return (
    <PageFrame
      title={product.name}
      subtitle={`SKU ${product.sku_code || '—'} • ${categoryName}`}
      actions={(
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate('/inventory')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {owner ? (
            <Link className="button" to={`/inventory/${product.product_id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit product
            </Link>
          ) : null}
        </div>
      )}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>{product.name}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Product #{product.product_id}</p>
              </div>
              <Badge variant={stockState.variant}>{stockState.label}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <Detail label="Category" value={categoryName} />
              <Detail label="Status" value={product.is_active ? 'Active' : 'Inactive'} />
              <Detail label="Selling price" value={formatCurrency(product.selling_price)} />
              <Detail label="Cost price" value={formatCurrency(product.cost_price)} />
              <Detail label="Current stock" value={String(product.current_stock)} />
              <Detail label="Reorder level" value={String(product.reorder_level ?? '—')} />
              <Detail label="UOM" value={product.uom ?? '—'} />
              <Detail label="Barcode" value={product.barcode ?? '—'} />
              <Detail label="Supplier" value={product.supplier_name ?? '—'} />
              <Detail label="HSN code" value={product.hsn_code ?? '—'} />
            </div>
            {product.image_url ? (
              <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
                <img src={product.image_url} alt={product.name} className="max-h-56 w-full rounded-md object-contain" />
              </div>
            ) : null}
            {product.description ? (
              <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                {product.description}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick stock update</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="Quantity change" type="number" min="1" {...register('quantity_added', { valueAsNumber: true })} error={errors.quantity_added?.message} />
                  <Input label="Purchase price" type="number" step="0.01" min="0" {...register('purchase_price', { valueAsNumber: true })} error={errors.purchase_price?.message} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="Date" type="date" {...register('date')} error={errors.date?.message} />
                  <Input label="Supplier" placeholder="Supplier name" {...register('supplier_name')} error={errors.supplier_name?.message} />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4 rounded border-border" {...register('update_cost_price')} />
                  Update cost price from purchase price
                </label>
                {serverMessage ? <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">{serverMessage}</div> : null}
                <Button type="submit" loading={isSubmitting || stockUpdateMutation.isPending}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Save stock update
                </Button>
              </form>
            </CardContent>
          </Card>

          <ChartCard title="Price history" subtitle="Recent price changes for this product.">
            <PriceHistoryChart history={priceHistory} />
          </ChartCard>
        </div>
      </div>
    </PageFrame>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
