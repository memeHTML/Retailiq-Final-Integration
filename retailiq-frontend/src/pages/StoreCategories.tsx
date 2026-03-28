/**
 * src/pages/StoreCategories.tsx
 * Oracle Document sections consumed: 3, 7, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SettingsLayout } from '@/components/layout/SettingsLayout';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable } from '@/components/ui/DataTable';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useProductsQuery } from '@/hooks/inventory';
import { useCategoriesQuery, useCreateCategoryMutation, useDeleteCategoryMutation, useUpdateCategoryMutation } from '@/hooks/store';
import type { Category } from '@/types/models';
import { categorySchema, type CategoryFormValues } from '@/types/schemas';
import { normalizeApiError, extractFieldErrors } from '@/utils/errors';
import { uiStore } from '@/stores/uiStore';

type EditDraft = {
  name: string;
  color_tag: string;
  gst_rate: string;
  is_active: boolean;
};

function toNullableNumber(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function StoreCategoriesPage() {
  const addToast = uiStore((state) => state.addToast);
  const categoriesQuery = useCategoriesQuery();
  const inventoryQuery = useProductsQuery({ page_size: 1000 });
  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();
  const deleteMutation = useDeleteCategoryMutation();
  const [deleteId, setDeleteId] = useState<number | string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft>({
    name: '',
    color_tag: '',
    gst_rate: '',
    is_active: true,
  });

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      color_tag: '',
      is_active: true,
      gst_rate: null,
    },
  });

  const categories = categoriesQuery.data?.categories ?? [];
  const inventoryCounts = useMemo(() => {
    const counts = new Map<number, number>();

    for (const product of inventoryQuery.data?.data ?? []) {
      if (product.category_id !== null && product.category_id !== undefined) {
        counts.set(product.category_id, (counts.get(product.category_id) ?? 0) + 1);
      }
    }

    return counts;
  }, [inventoryQuery.data?.data]);

  const openEditDialog = (category: Category) => {
    setEditError(null);
    setEditingCategory(category);
    setEditDraft({
      name: category.name,
      color_tag: category.color_tag ?? '',
      gst_rate: category.gst_rate === null || category.gst_rate === undefined ? '' : String(category.gst_rate),
      is_active: category.is_active,
    });
  };

  const closeEditDialog = () => {
    setEditingCategory(null);
    setEditError(null);
  };

  const onCreate = handleSubmit(async (values) => {
    setFormMessage(null);

    try {
      const result = await createMutation.mutateAsync({
        name: values.name.trim(),
        color_tag: values.color_tag ? values.color_tag.trim() : null,
        is_active: values.is_active ?? true,
        gst_rate: values.gst_rate ?? null,
      });

      addToast({ title: 'Category created', message: result.name, variant: 'success' });
      reset({ name: '', color_tag: '', is_active: true, gst_rate: null });
      void categoriesQuery.refetch();
    } catch (error) {
      const apiError = normalizeApiError(error);
      if (apiError.status === 422) {
        extractFieldErrors(apiError.fields, setError);
        return;
      }

      setFormMessage(apiError.message);
    }
  });

  const onEdit = async () => {
    if (!editingCategory) {
      return;
    }

    setEditError(null);

    try {
      const result = await updateMutation.mutateAsync({
        categoryId: editingCategory.category_id,
        payload: {
          name: editDraft.name.trim(),
          color_tag: editDraft.color_tag.trim() ? editDraft.color_tag.trim() : null,
          gst_rate: toNullableNumber(editDraft.gst_rate),
          is_active: editDraft.is_active,
        },
      });

      addToast({ title: 'Category updated', message: result.name, variant: 'success' });
      closeEditDialog();
      void categoriesQuery.refetch();
    } catch (error) {
      const apiError = normalizeApiError(error);
      setEditError(apiError.message);
    }
  };

  const onDelete = async () => {
    if (deleteId === null) {
      return;
    }

    setFormMessage(null);

    try {
      await deleteMutation.mutateAsync(deleteId);
      addToast({ title: 'Category deactivated', message: 'The category was deactivated.', variant: 'success' });
      setDeleteId(null);
      void categoriesQuery.refetch();
    } catch (error) {
      setFormMessage(normalizeApiError(error).message);
    }
  };

  if (categoriesQuery.isError) {
    return <ErrorState error={normalizeApiError(categoriesQuery.error)} onRetry={() => void categoriesQuery.refetch()} />;
  }

  if (categoriesQuery.isLoading) {
    return (
      <SettingsLayout active="categories" title="Categories" subtitle="Manage store categories and GST tags.">
        <SkeletonLoader variant="rect" height={300} />
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout active="categories" title="Categories" subtitle="Manage store categories and GST tags.">
      <section className="card">
        <div className="card__header">
          <strong>Create category</strong>
        </div>
        <div className="card__body">
          <form className="stack" onSubmit={onCreate} noValidate>
            <div className="grid grid--2">
              <label className="field">
                <span>Name</span>
                <input className="input" {...register('name')} />
                {errors.name ? <span className="muted">{errors.name.message}</span> : null}
              </label>
              <label className="field">
                <span>Color tag</span>
                <input
                  className="input"
                  {...register('color_tag', {
                    setValueAs: (value) => {
                      if (typeof value !== 'string') {
                        return null;
                      }

                      const trimmed = value.trim();
                      return trimmed ? trimmed : null;
                    },
                  })}
                />
              </label>
            </div>
            <div className="grid grid--2">
              <label className="field">
                <span>GST rate</span>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  {...register('gst_rate', {
                    setValueAs: (value) => {
                      if (value === '' || value === null || value === undefined) {
                        return null;
                      }

                      const parsed = Number(value);
                      return Number.isFinite(parsed) ? parsed : null;
                    },
                  })}
                />
              </label>
              <label className="field">
                <span>Active</span>
                <input type="checkbox" {...register('is_active')} />
              </label>
            </div>
            <button className="button" type="submit" disabled={isSubmitting || createMutation.isPending}>
              {isSubmitting || createMutation.isPending ? 'Creating...' : 'Create category'}
            </button>
            {formMessage ? <div className="muted">{formMessage}</div> : null}
          </form>
        </div>
      </section>

      {categories.length ? (
        <DataTable
          columns={[
            { key: 'name', header: 'Name', render: (row) => row.name },
            { key: 'color', header: 'Color', render: (row) => row.color_tag ?? '—' },
            {
              key: 'count',
              header: 'Products',
              render: (row) => {
                if (inventoryQuery.isLoading || inventoryQuery.isFetching) {
                  return 'Loading...';
                }

                if (inventoryQuery.isError) {
                  return 'Unavailable';
                }

                return inventoryCounts.get(row.category_id) ?? 0;
              },
            },
            { key: 'gst', header: 'GST', render: (row) => row.gst_rate ?? '—' },
            { key: 'active', header: 'Active', render: (row) => (row.is_active ? 'Yes' : 'No') },
            {
              key: 'actions',
              header: 'Actions',
              render: (row) => (
                <div className="button-row">
                  <button className="button button--secondary" type="button" onClick={() => openEditDialog(row)}>
                    Edit
                  </button>
                  <button className="button button--danger" type="button" onClick={() => setDeleteId(row.category_id)}>
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
          data={categories}
        />
      ) : (
        <EmptyState title="No categories yet" body="Create categories so you can organize inventory." />
      )}

      <Dialog open={Boolean(editingCategory)}>
        <DialogContent>
          <section className="stack">
            <header className="dialog__header">
              <h2 id="edit-category-title" style={{ margin: 0 }}>
                Edit category
              </h2>
            </header>
            <div className="dialog__body stack">
              <label className="field">
                <span>Name</span>
                <input
                  className="input"
                  value={editDraft.name}
                  onChange={(event) => setEditDraft((current) => ({ ...current, name: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>Color tag</span>
                <input
                  className="input"
                  value={editDraft.color_tag}
                  onChange={(event) => setEditDraft((current) => ({ ...current, color_tag: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>GST rate</span>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={editDraft.gst_rate}
                  onChange={(event) => setEditDraft((current) => ({ ...current, gst_rate: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>Active</span>
                <input
                  type="checkbox"
                  checked={editDraft.is_active}
                  onChange={(event) => setEditDraft((current) => ({ ...current, is_active: event.target.checked }))}
                />
              </label>
              {editError ? <div className="muted">{editError}</div> : null}
            </div>
            <footer className="dialog__footer">
              <button className="button button--secondary" type="button" onClick={closeEditDialog}>
                Cancel
              </button>
              <button className="button" type="button" onClick={() => void onEdit()} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save changes'}
              </button>
            </footer>
          </section>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete category?"
        body="This will deactivate the category and may be blocked if products are assigned."
        confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete category'}
        destructive
        requireTypedConfirmation="DELETE"
        onConfirm={() => void onDelete()}
        onCancel={() => setDeleteId(null)}
      />
    </SettingsLayout>
  );
}
