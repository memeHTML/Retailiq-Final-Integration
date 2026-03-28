/**
 * src/pages/StoreCategories.tsx
 * Oracle Document sections consumed: 3, 7, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageFrame } from '@/components/layout/PageFrame';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { categorySchema, type CategoryFormValues } from '@/types/schemas';
import { useCategoriesQuery, useCreateCategoryMutation, useDeleteCategoryMutation } from '@/hooks/store';
import { normalizeApiError } from '@/utils/errors';
import { extractFieldErrors } from '@/utils/errors';
import { uiStore } from '@/stores/uiStore';

export default function StoreCategoriesPage() {
  const addToast = uiStore((state) => state.addToast);
  const categoriesQuery = useCategoriesQuery();
  const createMutation = useCreateCategoryMutation();
  const deleteMutation = useDeleteCategoryMutation();
  const [deleteId, setDeleteId] = useState<number | string | null>(null);
  const { register, handleSubmit, setError, reset, formState: { errors, isSubmitting } } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', color_tag: '', is_active: true, gst_rate: 0 },
  });

  const onCreate = handleSubmit(async (values) => {
    try {
      const result = await createMutation.mutateAsync(values);
      addToast({ title: 'Category created', message: result.name, variant: 'success' });
      reset({ name: '', color_tag: '', is_active: true, gst_rate: 0 });
      void categoriesQuery.refetch();
    } catch (error) {
      const apiError = normalizeApiError(error);
      if (apiError.status === 422) {
        extractFieldErrors(apiError.fields, setError);
        return;
      }
      addToast({ title: 'Create failed', message: apiError.message, variant: 'error' });
    }
  });

  const onDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      addToast({ title: 'Category deactivated', message: 'The category was deactivated.', variant: 'success' });
      setDeleteId(null);
      void categoriesQuery.refetch();
    } catch (error) {
      addToast({ title: 'Delete failed', message: normalizeApiError(error).message, variant: 'error' });
    }
  };

  if (categoriesQuery.isError) {
    return <ErrorState error={normalizeApiError(categoriesQuery.error)} onRetry={() => void categoriesQuery.refetch()} />;
  }

  if (categoriesQuery.isLoading) {
    return <PageFrame title="Categories" subtitle="Manage store categories and GST tags."><SkeletonLoader variant="rect" height={300} /></PageFrame>;
  }

  const categories = categoriesQuery.data?.categories ?? [];

  return (
    <PageFrame title="Categories" subtitle="Manage store categories and GST tags.">
      <section className="card">
        <div className="card__header"><strong>Create category</strong></div>
        <div className="card__body">
          <form className="stack" onSubmit={onCreate} noValidate>
            <div className="grid grid--2">
              <label className="field"><span>Name</span><input className="input" {...register('name')} />{errors.name ? <span className="muted">{errors.name.message}</span> : null}</label>
              <label className="field"><span>Color tag</span><input className="input" {...register('color_tag')} /></label>
            </div>
            <div className="grid grid--2">
              <label className="field"><span>GST rate</span><input className="input" type="number" step="0.01" {...register('gst_rate', { valueAsNumber: true })} /></label>
              <label className="field"><span>Active</span><input type="checkbox" {...register('is_active')} /></label>
            </div>
            <button className="button" type="submit" disabled={isSubmitting || createMutation.isPending}>{isSubmitting || createMutation.isPending ? 'Creating…' : 'Create category'}</button>
          </form>
        </div>
      </section>

      {categories.length ? (
        <DataTable
          columns={[
            { key: 'name', header: 'Name', render: (row) => row.name },
            { key: 'color', header: 'Color', render: (row) => row.color_tag ?? '—' },
            { key: 'gst', header: 'GST', render: (row) => row.gst_rate ?? '—' },
            { key: 'active', header: 'Active', render: (row) => (row.is_active ? 'Yes' : 'No') },
            { key: 'delete', header: 'Actions', render: (row) => <button className="button button--danger" type="button" onClick={() => setDeleteId(row.category_id)}>Delete</button> },
          ]}
          data={categories}
        />
      ) : <EmptyState title="No categories yet" body="Create categories so you can organize inventory." />}

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete category?"
        body="This will deactivate the category and may be blocked if products are assigned."
        confirmLabel={deleteMutation.isPending ? 'Deleting…' : 'Delete category'}
        destructive
        requireTypedConfirmation="DELETE"
        onConfirm={() => void onDelete()}
        onCancel={() => setDeleteId(null)}
      />
    </PageFrame>
  );
}
