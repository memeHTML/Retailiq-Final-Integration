import { useEffect, useMemo, useState } from 'react';
import type { GstHsnMapping } from '@/api/gst';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { authStore } from '@/stores/authStore';
import { useCategoriesQuery } from '@/hooks/store';
import { useCreateHsnMapping, useDeleteHsnMapping, useHsnMappings, useHsnSearch, useUpdateHsnMapping } from '@/hooks/useGst';
import { normalizeApiError } from '@/utils/errors';

const defaultHsnForm = (categoryId = ''): GstHsnMapping => ({ hsn_code: '', category_id: categoryId, tax_rate: 0, description: '' });

const validateHsnForm = (form: GstHsnMapping) => {
  if (!form.hsn_code.trim()) return 'HSN code is required.';
  if (!form.category_id.trim()) return 'Category is required.';
  const rate = Number(form.tax_rate);
  if (!Number.isFinite(rate) || rate < 0) return 'Tax rate must be a non-negative number.';
  return null;
};

export function GstHsnTab() {
  const isOwner = authStore((state) => state.user?.role === 'owner');
  const categoriesQuery = useCategoriesQuery();
  const hsnMappingsQuery = useHsnMappings();
  const [search, setSearch] = useState('');
  const [hsnForm, setHsnForm] = useState<GstHsnMapping>(defaultHsnForm());
  const [editingHsnCode, setEditingHsnCode] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const categories = categoriesQuery.data?.categories ?? [];
  const firstCategoryId = String(categories[0]?.category_id ?? '');
  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [String(category.category_id), category.name])),
    [categories],
  );

  const hsnSearchQuery = useHsnSearch(search.trim());
  const createHsnMapping = useCreateHsnMapping();
  const updateHsnMapping = useUpdateHsnMapping();
  const deleteHsnMapping = useDeleteHsnMapping();

  useEffect(() => {
    setHsnForm((current) => ({ ...current, category_id: current.category_id || firstCategoryId }));
  }, [firstCategoryId]);

  const hsnError = useMemo(() => validateHsnForm(hsnForm), [hsnForm]);
  const searchError = hsnSearchQuery.error ? normalizeApiError(hsnSearchQuery.error) : null;
  const hsnMappingsError = hsnMappingsQuery.error ? normalizeApiError(hsnMappingsQuery.error) : null;
  const categoriesError = categoriesQuery.error ? normalizeApiError(categoriesQuery.error) : null;

  const saveMapping = async () => {
    if (hsnError) {
      return;
    }

    const payload = {
      hsn_code: hsnForm.hsn_code.trim(),
      category_id: hsnForm.category_id.trim(),
      tax_rate: Number(hsnForm.tax_rate),
      description: hsnForm.description.trim(),
    };

    try {
      if (editingHsnCode) {
        await updateHsnMapping.mutateAsync({ hsnCode: editingHsnCode, payload });
        setEditingHsnCode(null);
      } else {
        await createHsnMapping.mutateAsync(payload);
      }
      setHsnForm(defaultHsnForm(firstCategoryId));
    } catch {
      // surfaced via mutation state
    }
  };

  const removeMapping = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteHsnMapping.mutateAsync(deleteTarget);
      setDeleteTarget(null);
    } catch {
      // surfaced via mutation state
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>HSN Search</CardTitle>
            <Input label="Search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by HSN or description" className="max-w-md" />
          </div>
        </CardHeader>
        <CardContent>
          {hsnSearchQuery.isLoading ? <SkeletonLoader variant="rect" height={96} /> : null}
          {searchError ? (
            <ErrorState error={searchError} onRetry={() => void hsnSearchQuery.refetch()} />
          ) : hsnSearchQuery.data?.length ? (
            <div className="space-y-2">
              {hsnSearchQuery.data.map((item) => (
                <div key={item.hsn_code} className="flex items-center justify-between gap-3 rounded-md border border-gray-200 p-3">
                  <div>
                    <div className="font-medium text-gray-900">{item.hsn_code}</div>
                    <div className="text-sm text-gray-500">{item.description}</div>
                  </div>
                  <div className="text-sm text-gray-500">{item.default_gst_rate ?? 0}%</div>
                </div>
              ))}
            </div>
          ) : search.trim() ? (
            <EmptyState title="No HSN matches" body="Try a different code or description." />
          ) : (
            <EmptyState title="Search HSN codes" body="Start typing to search the backend HSN master." />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>HSN Mappings</CardTitle>
            {isOwner ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingHsnCode(null);
                  setHsnForm(defaultHsnForm(firstCategoryId));
                }}
              >
                Reset form
              </Button>
            ) : (
              <Badge variant="secondary">Read only</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isOwner ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="HSN Code"
                value={hsnForm.hsn_code}
                onChange={(event) => setHsnForm((current) => ({ ...current, hsn_code: event.target.value }))}
                disabled={Boolean(editingHsnCode)}
                placeholder="1001"
              />
              <Input
                label="Tax Rate"
                type="number"
                value={hsnForm.tax_rate}
                onChange={(event) => setHsnForm((current) => ({ ...current, tax_rate: Number(event.target.value || 0) }))}
                min={0}
                max={100}
                step="0.01"
              />
              <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                Category
                <select
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={hsnForm.category_id}
                  onChange={(event) => setHsnForm((current) => ({ ...current, category_id: event.target.value }))}
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.category_id} value={String(category.category_id)}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <Input
                label="Description"
                value={hsnForm.description}
                onChange={(event) => setHsnForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Mapped description"
              />
            </div>
          ) : null}
          {categoriesError ? <ErrorState error={categoriesError} /> : null}
          {isOwner && hsnError ? <p className="text-sm text-red-600">{hsnError}</p> : null}
          {isOwner ? (
            <div className="flex gap-3">
              <Button onClick={() => void saveMapping()} loading={createHsnMapping.isPending || updateHsnMapping.isPending} disabled={Boolean(hsnError) || !categories.length}>
                {editingHsnCode ? 'Update mapping' : 'Create mapping'}
              </Button>
              {editingHsnCode ? (
                <Button variant="secondary" onClick={() => setEditingHsnCode(null)}>
                  Cancel edit
                </Button>
              ) : null}
              {!categories.length ? <Badge variant="warning">Load categories first</Badge> : null}
            </div>
          ) : null}
          {categoriesQuery.isLoading && !categoriesQuery.data ? <SkeletonLoader variant="rect" height={96} /> : null}
          {hsnMappingsQuery.isLoading && !hsnMappingsQuery.data ? <SkeletonLoader variant="rect" height={120} /> : null}
          {hsnMappingsError ? <ErrorState error={hsnMappingsError} onRetry={() => void hsnMappingsQuery.refetch()} /> : null}
          {hsnMappingsQuery.data?.length ? (
            <div className="overflow-hidden rounded-md border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">HSN Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Tax Rate</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Description</th>
                    {isOwner ? <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">Actions</th> : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {hsnMappingsQuery.data.map((mapping) => (
                    <tr key={mapping.hsn_code}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{mapping.hsn_code}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{categoryNameById.get(String(mapping.category_id)) ?? mapping.category_id}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{mapping.tax_rate}%</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{mapping.description}</td>
                      {isOwner ? (
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setEditingHsnCode(mapping.hsn_code);
                                setHsnForm(mapping);
                              }}
                            >
                              Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(mapping.hsn_code)}>
                              Delete
                            </Button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No HSN mappings" body="Create mappings to connect GST rates with store categories." />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete HSN Mapping"
        body={deleteTarget ? `Delete HSN mapping ${deleteTarget}? This action cannot be undone.` : 'Delete mapping?'}
        confirmLabel="Delete"
        destructive
        onConfirm={() => void removeMapping()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
