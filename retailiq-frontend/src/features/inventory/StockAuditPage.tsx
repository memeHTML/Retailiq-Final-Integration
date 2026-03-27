import { useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageFrame } from '@/components/layout/PageFrame';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useProducts, useStockAudit } from '@/hooks/useInventory';
import { InventoryAuditSkeleton } from '@/features/inventory/loading';
import { authStore } from '@/stores/authStore';
import { uiStore } from '@/stores/uiStore';
import { normalizeApiError } from '@/utils/errors';
import { stockAuditSchema } from '@/types/schemas';
import type { Product } from '@/types/models';

type AuditItemForm = {
  product_id: number;
  counted_quantity: number;
};

type AuditFormValues = {
  items: AuditItemForm[];
  notes: string;
};

const makeAuditItem = (product: Product): AuditItemForm => ({
  product_id: product.product_id,
  counted_quantity: Number(product.current_stock ?? 0),
});

export default function StockAuditPage() {
  const navigate = useNavigate();
  const addToast = uiStore((state) => state.addToast);
  const role = authStore((state) => state.role);
  const owner = role === 'owner';
  const [search, setSearch] = useState('');
  const [submission, setSubmission] = useState<null | { items: Array<{ product_id: number; expected_stock: number; actual_stock: number; discrepancy: number }>; audit_id?: number; audit_date?: string }>(null);
  const productsQuery = useProducts({ page: 1, page_size: 200 });
  const stockAuditMutation = useStockAudit();

  const { control, register, handleSubmit, watch, formState: { isSubmitting } } = useForm<AuditFormValues>({
    defaultValues: { items: [], notes: '' },
    resolver: zodResolver(stockAuditSchema),
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const products = productsQuery.data?.data ?? [];
  const filteredProducts = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) {
      return products;
    }
    return products.filter((product) => (
      product.name.toLowerCase().includes(needle)
      || product.sku_code.toLowerCase().includes(needle)
      || String(product.product_id).includes(needle)
    ));
  }, [products, search]);

  if (productsQuery.isError) {
    return <ErrorState error={normalizeApiError(productsQuery.error)} onRetry={() => void productsQuery.refetch()} />;
  }

  if (productsQuery.isLoading) {
    return (
      <PageFrame title="Stock audit" subtitle="Loading inventory...">
        <InventoryAuditSkeleton />
      </PageFrame>
    );
  }

  const addProductToAudit = (product: Product) => {
    const exists = fields.some((field) => field.product_id === product.product_id);
    if (exists) {
      return;
    }
    append(makeAuditItem(product));
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await stockAuditMutation.mutateAsync({
        items: values.items.map((item) => ({
          product_id: item.product_id,
          actual_qty: Number(item.counted_quantity),
        })),
        notes: values.notes || undefined,
      });
      setSubmission({
        items: result.items ?? [],
        audit_id: result.audit_id,
        audit_date: result.audit_date,
      });
      addToast({ title: 'Audit submitted', message: 'Inventory counts have been reconciled.', variant: 'success' });
    } catch (error) {
      const apiError = normalizeApiError(error);
      addToast({ title: 'Audit failed', message: apiError.message, variant: 'error' });
    }
  });

  if (!owner) {
    return (
      <PageFrame title="Stock audit" subtitle="Owner access required.">
        <EmptyState title="Owner only" body="Stock audits can only be run by owners." action={{ label: 'Back to inventory', onClick: () => navigate('/inventory') }} />
      </PageFrame>
    );
  }

  return (
    <PageFrame
      title="Stock audit"
      subtitle="Count physical inventory, compare it with the system, and reconcile discrepancies."
      actions={<Button variant="secondary" size="sm" onClick={() => navigate('/inventory')}>Back to inventory</Button>}
    >
      {submission ? (
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Audit completed</CardTitle>
              {submission.audit_id ? <Badge variant="success">Audit #{submission.audit_id}</Badge> : null}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Recorded on {submission.audit_date ? new Date(submission.audit_date).toLocaleString() : 'just now'}.</p>
            <div className="mt-4 space-y-2">
              {submission.items.map((item) => (
                <div key={`${item.product_id}-${item.expected_stock}`} className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-3 text-sm">
                  <span>Product #{item.product_id}</span>
                  <span className={item.discrepancy === 0 ? 'text-green-600' : item.discrepancy > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                    Expected {item.expected_stock} · Actual {item.actual_stock} · Diff {item.discrepancy}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Add products</CardTitle>
          </CardHeader>
          <CardContent>
            <Input label="Search products" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or SKU..." />
            <div className="mt-4 max-h-[480px] space-y-2 overflow-auto pr-1">
              {filteredProducts.length ? (
                filteredProducts.map((product) => (
                  <button
                    key={product.product_id}
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg border border-border bg-background p-3 text-left hover:border-primary/40"
                    onClick={() => addProductToAudit(product)}
                  >
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sku_code || 'No SKU'} · System stock {product.current_stock}</p>
                    </div>
                    <Badge variant="secondary">Add</Badge>
                  </button>
                ))
              ) : (
                <EmptyState title="No products found" body="Try a different search term." />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Audit items</CardTitle>
              <Badge variant="secondary">{fields.length} items</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-3">
                {fields.length ? (
                  fields.map((field, index) => {
                    const product = products.find((item) => item.product_id === field.product_id);
                    return (
                      <div key={field.id} className="rounded-lg border border-border bg-muted/10 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{product?.name ?? `Product #${field.product_id}`}</p>
                            <p className="text-xs text-muted-foreground">{product?.sku_code ?? 'SKU unknown'} · System {product?.current_stock ?? 0}</p>
                          </div>
                          <button type="button" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => remove(index)}>Remove</button>
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <Input
                            label="Counted quantity"
                            type="number"
                            min="0"
                            {...register(`items.${index}.counted_quantity`, { valueAsNumber: true })}
                          />
                          <div className="rounded-lg border border-border bg-background p-3 text-sm">
                            Difference: {(Number(watch(`items.${index}.counted_quantity`) ?? 0) - Number(product?.current_stock ?? 0)).toLocaleString()}
                          </div>
                        </div>
                        <input type="hidden" {...register(`items.${index}.product_id`, { valueAsNumber: true })} />
                      </div>
                    );
                  })
                ) : (
                  <EmptyState title="No audit items" body="Add products from the list on the left to start a stock audit." />
                )}
              </div>
              <label className="field">
                <span>Audit notes</span>
                <Textarea rows={4} {...register('notes')} />
              </label>
              <div className="flex flex-wrap gap-3">
                <Button type="submit" loading={isSubmitting || stockAuditMutation.isPending} disabled={fields.length === 0}>
                  Submit audit
                </Button>
                <Button type="button" variant="secondary" onClick={() => navigate('/inventory')}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageFrame>
  );
}
