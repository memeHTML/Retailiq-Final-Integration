/**
 * src/pages/InventoryForm.tsx
 * Oracle Document sections consumed: 3, 7, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { productSchema, type ProductFormValues } from '@/types/schemas';
import { useCreateProductMutation, useProductQuery, useUpdateProductMutation } from '@/hooks/inventory';
import { normalizeApiError } from '@/utils/errors';
import { extractFieldErrors } from '@/utils/errors';
import { uiStore } from '@/stores/uiStore';

export default function InventoryFormPage() {
  const { productId } = useParams();
  const isEditing = Boolean(productId);
  const navigate = useNavigate();
  const addToast = uiStore((state) => state.addToast);
  const productQuery = useProductQuery(productId ?? '');
  const createMutation = useCreateProductMutation();
  const updateMutation = useUpdateProductMutation();
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const { register, reset, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      category_id: null,
      sku_code: '',
      uom: 'pieces',
      cost_price: 0,
      selling_price: 0,
      current_stock: 0,
      reorder_level: 0,
      supplier_name: '',
      barcode: '',
      image_url: '',
      lead_time_days: 0,
      hsn_code: '',
    },
  });

  useEffect(() => {
    if (productQuery.data && isEditing) {
      reset({
        name: productQuery.data.name,
        category_id: productQuery.data.category_id,
        sku_code: productQuery.data.sku_code,
        uom: productQuery.data.uom ?? 'pieces',
        cost_price: productQuery.data.cost_price,
        selling_price: productQuery.data.selling_price,
        current_stock: productQuery.data.current_stock,
        reorder_level: productQuery.data.reorder_level,
        supplier_name: productQuery.data.supplier_name,
        barcode: productQuery.data.barcode,
        image_url: productQuery.data.image_url,
        lead_time_days: productQuery.data.lead_time_days,
        hsn_code: productQuery.data.hsn_code,
      });
    }
  }, [isEditing, productQuery.data, reset]);

  if (isEditing && productQuery.isLoading) {
    return <PageFrame title="Edit product" subtitle="Update an existing inventory item."><SkeletonLoader variant="rect" height={380} /></PageFrame>;
  }

  if (isEditing && productQuery.isError) {
    return <ErrorState error={normalizeApiError(productQuery.error)} onRetry={() => void productQuery.refetch()} />;
  }

  const onSubmit = handleSubmit(async (values) => {
    setServerMessage(null);
    try {
      if (isEditing && productId) {
        await updateMutation.mutateAsync({ productId, payload: values });
        addToast({ title: 'Product updated', message: 'The inventory item was updated.', variant: 'success' });
      } else {
        const result = await createMutation.mutateAsync(values);
        addToast({ title: 'Product created', message: `${result.name} is now in inventory.`, variant: 'success' });
      }
      navigate('/inventory', { replace: true });
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
    <PageFrame title={isEditing ? 'Edit product' : 'Create product'} subtitle={isEditing ? 'Update an existing inventory item.' : 'Add a new inventory item to your store.'} actions={<button className="button button--secondary" type="button" onClick={() => navigate('/inventory')}>Back</button>}>
      <form className="stack" onSubmit={onSubmit} noValidate>
        <div className="grid grid--2">
          <label className="field"><span>Name</span><input className="input" {...register('name')} />{errors.name ? <span className="muted">{errors.name.message}</span> : null}</label>
          <label className="field"><span>SKU</span><input className="input" {...register('sku_code')} /></label>
        </div>
        <div className="grid grid--3">
          <label className="field"><span>Category ID</span><input className="input" type="number" {...register('category_id', { valueAsNumber: true })} /></label>
          <label className="field"><span>UOM</span><select className="select" {...register('uom')}><option value="pieces">pieces</option><option value="kg">kg</option><option value="litre">litre</option><option value="pack">pack</option></select></label>
          <label className="field"><span>Current stock</span><input className="input" type="number" {...register('current_stock', { valueAsNumber: true })} /></label>
        </div>
        <div className="grid grid--2">
          <label className="field"><span>Cost price</span><input className="input" type="number" step="0.01" {...register('cost_price', { valueAsNumber: true })} />{errors.cost_price ? <span className="muted">{errors.cost_price.message}</span> : null}</label>
          <label className="field"><span>Selling price</span><input className="input" type="number" step="0.01" {...register('selling_price', { valueAsNumber: true })} />{errors.selling_price ? <span className="muted">{errors.selling_price.message}</span> : null}</label>
        </div>
        <div className="grid grid--3">
          <label className="field"><span>Reorder level</span><input className="input" type="number" {...register('reorder_level', { valueAsNumber: true })} /></label>
          <label className="field"><span>Lead time days</span><input className="input" type="number" {...register('lead_time_days', { valueAsNumber: true })} /></label>
          <label className="field"><span>HSN code</span><input className="input" {...register('hsn_code')} /></label>
        </div>
        <label className="field"><span>Supplier name</span><input className="input" {...register('supplier_name')} /></label>
        <label className="field"><span>Barcode</span><input className="input" {...register('barcode')} /></label>
        <label className="field"><span>Image URL</span><input className="input" {...register('image_url')} /></label>
        {serverMessage ? <div className="muted">{serverMessage}</div> : null}
        <button className="button" type="submit" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>{isSubmitting ? 'Saving…' : isEditing ? 'Update product' : 'Create product'}</button>
      </form>
    </PageFrame>
  );
}
