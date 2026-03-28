/**
 * src/pages/InventoryDetail.tsx
 * Oracle Document sections consumed: 3, 7, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { stockUpdateSchema, type StockUpdateFormValues } from '@/types/schemas';
import { useProductQuery, useStockUpdateMutation } from '@/hooks/inventory';
import { normalizeApiError } from '@/utils/errors';
import { extractFieldErrors } from '@/utils/errors';
import { toApiDate } from '@/utils/dates';
import { uiStore } from '@/stores/uiStore';

const productNotFoundError = { message: 'Product not found.', status: 404 };

export default function InventoryDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const addToast = uiStore((state) => state.addToast);
  const productQuery = useProductQuery(productId ?? '');
  const stockUpdateMutation = useStockUpdateMutation();
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<StockUpdateFormValues>({
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
    return <PageFrame title="Inventory detail" subtitle="View product details and update stock."><SkeletonLoader variant="rect" height={320} /></PageFrame>;
  }

  const product = productQuery.data;

  if (!product) {
    return <ErrorState error={productNotFoundError} onRetry={() => navigate('/inventory')} />;
  }

  const onSubmit = handleSubmit(async (values) => {
    setServerMessage(null);
    try {
      await stockUpdateMutation.mutateAsync({ productId: product.product_id, payload: values });
      addToast({ title: 'Stock updated', message: 'The stock movement was recorded.', variant: 'success' });
      void productQuery.refetch();
    } catch (error) {
      const apiError = normalizeApiError(error);
      if (apiError.status === 422) {
        extractFieldErrors(apiError.fields, setError);
        return;
      }
      setServerMessage(apiError.message);
    }
  });

  return (
    <PageFrame title={product.name} subtitle={`SKU ${product.sku_code}`} actions={<button className="button button--secondary" type="button" onClick={() => navigate('/inventory')}>Back</button>}>
      <section className="card">
        <div className="card__body stack">
          <div><strong>Category:</strong> {product.category_id ?? '—'}</div>
          <div><strong>Cost price:</strong> {product.cost_price}</div>
          <div><strong>Selling price:</strong> {product.selling_price}</div>
          <div><strong>Current stock:</strong> {product.current_stock}</div>
          <div><strong>Status:</strong> {product.is_active ? 'Active' : 'Inactive'}</div>
        </div>
      </section>

      <section className="card">
        <div className="card__header"><strong>Stock update</strong></div>
        <div className="card__body">
          <form className="stack" onSubmit={onSubmit} noValidate>
            <div className="grid grid--2">
              <label className="field">
                <span>Quantity added</span>
                <input className="input" type="number" {...register('quantity_added', { valueAsNumber: true })} />
                {errors.quantity_added ? <span className="muted">{errors.quantity_added.message}</span> : null}
              </label>
              <label className="field">
                <span>Purchase price</span>
                <input className="input" type="number" step="0.01" {...register('purchase_price', { valueAsNumber: true })} />
                {errors.purchase_price ? <span className="muted">{errors.purchase_price.message}</span> : null}
              </label>
            </div>
            <div className="grid grid--2">
              <label className="field">
                <span>Date</span>
                <input className="input" {...register('date')} />
              </label>
              <label className="field">
                <span>Supplier name</span>
                <input className="input" {...register('supplier_name')} />
              </label>
            </div>
            <label className="field">
              <span>Update cost price</span>
              <input type="checkbox" {...register('update_cost_price')} />
            </label>
            {serverMessage ? <div className="muted">{serverMessage}</div> : null}
            <button className="button" type="submit" disabled={isSubmitting || stockUpdateMutation.isPending}>
              {isSubmitting || stockUpdateMutation.isPending ? 'Updating…' : 'Save stock update'}
            </button>
          </form>
        </div>
      </section>
    </PageFrame>
  );
}
