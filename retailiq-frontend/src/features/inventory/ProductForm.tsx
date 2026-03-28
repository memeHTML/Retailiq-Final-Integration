import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageFrame } from '@/components/layout/PageFrame';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useCategoriesQuery } from '@/hooks/store';
import { useCreateProduct, useProduct, useUpdateProduct } from '@/hooks/useInventory';
import { authStore } from '@/stores/authStore';
import { uiStore } from '@/stores/uiStore';
import { normalizeApiError } from '@/utils/errors';
import { productSchema, type ProductFormValues } from '@/types/schemas';
import { toProductFormDefaults, pickDirtyValues } from '@/features/inventory/utils';

export default function ProductFormPage() {
  const { productId } = useParams();
  const isEditing = Boolean(productId);
  const navigate = useNavigate();
  const addToast = uiStore((state) => state.addToast);
  const role = authStore((state) => state.role);
  const owner = role === 'owner';
  const categoriesQuery = useCategoriesQuery();
  const productQuery = useProduct(productId ?? '');
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  const categories = categoriesQuery.data?.categories ?? [];

  const { register, reset, handleSubmit, formState: { errors, isSubmitting, dirtyFields } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: toProductFormDefaults(),
  });

  useEffect(() => {
    if (isEditing && productQuery.data) {
      reset(toProductFormDefaults(productQuery.data));
    }
  }, [isEditing, productQuery.data, reset]);

  const categoryOptions = useMemo(() => categories.map((category) => ({ id: category.category_id, name: category.name })), [categories]);

  if (!owner) {
    return (
      <PageFrame title={isEditing ? 'Edit product' : 'Create product'} subtitle="Owner access required.">
        <EmptyState title="Owner only" body="Create and edit inventory products are restricted to store owners." action={{ label: 'Back to inventory', onClick: () => navigate('/inventory') }} />
      </PageFrame>
    );
  }

  if (isEditing && productQuery.isLoading) {
    return (
      <PageFrame title="Edit product" subtitle="Load product details...">
        <SkeletonLoader variant="rect" height={420} />
      </PageFrame>
    );
  }

  if (isEditing && productQuery.isError) {
    return <ErrorState error={normalizeApiError(productQuery.error)} onRetry={() => void productQuery.refetch()} />;
  }

  const onSubmit = handleSubmit(async (values) => {
    setServerMessage(null);
    try {
      if (isEditing && productId) {
        const dirtyPayload = pickDirtyValues(values, dirtyFields);
        await updateMutation.mutateAsync({ productId, payload: dirtyPayload });
        addToast({ title: 'Product updated', message: 'Inventory item changes saved.', variant: 'success' });
        navigate(`/inventory/${productId}`, { replace: true });
        return;
      }

      const result = await createMutation.mutateAsync(values);
      addToast({ title: 'Product created', message: `${result.name} added to inventory.`, variant: 'success' });
      navigate(`/inventory/${result.product_id}`);
    } catch (error) {
      const apiError = normalizeApiError(error);
      setServerMessage(apiError.message);
    }
  });

  return (
    <PageFrame
      title={isEditing ? 'Edit product' : 'Create product'}
      subtitle={isEditing ? 'Update an existing inventory item.' : 'Add a new product to the catalog.'}
      actions={<Button variant="secondary" size="sm" onClick={() => navigate('/inventory')}>Back to inventory</Button>}
    >
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Product name" {...register('name')} error={errors.name?.message} />
          <Input label="SKU code" {...register('sku_code')} error={errors.sku_code?.message} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="field">
            <span>Category</span>
            <select
              className="input"
              {...register('category_id', { setValueAs: (value) => value === '' || value === null ? null : Number(value) })}
            >
              <option value="">Uncategorized</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Unit of measure</span>
            <select className="input" {...register('uom')}>
              <option value="pieces">pieces</option>
              <option value="kg">kg</option>
              <option value="litre">litre</option>
              <option value="pack">pack</option>
            </select>
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Input label="Selling price" type="number" step="0.01" min="0" {...register('selling_price', { valueAsNumber: true })} error={errors.selling_price?.message} />
          <Input label="Cost price" type="number" step="0.01" min="0" {...register('cost_price', { valueAsNumber: true })} error={errors.cost_price?.message} />
          <Input label="Current stock" type="number" min="0" {...register('current_stock', { valueAsNumber: true })} error={errors.current_stock?.message} />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Input label="Reorder level" type="number" min="0" {...register('reorder_level', { setValueAs: (value) => value === '' || value === null ? null : Number(value) })} error={errors.reorder_level?.message} />
          <Input label="Lead time days" type="number" min="0" {...register('lead_time_days', { setValueAs: (value) => value === '' || value === null ? null : Number(value) })} error={errors.lead_time_days?.message} />
          <Input label="HSN code" {...register('hsn_code')} error={errors.hsn_code?.message} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Supplier name" {...register('supplier_name')} error={errors.supplier_name?.message} />
          <Input label="Barcode" {...register('barcode')} error={errors.barcode?.message} />
        </div>
        <Input label="Image URL" {...register('image_url')} error={errors.image_url?.message} />
        <label className="field">
          <span>Description</span>
          <Textarea rows={4} {...register('description')} />
        </label>
        {serverMessage ? <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">{serverMessage}</div> : null}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" loading={isSubmitting || createMutation.isPending || updateMutation.isPending}>
            {isEditing ? 'Update product' : 'Create product'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/inventory')}>
            Cancel
          </Button>
        </div>
      </form>
    </PageFrame>
  );
}
