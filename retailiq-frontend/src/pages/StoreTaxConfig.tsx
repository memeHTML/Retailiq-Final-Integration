/**
 * src/pages/StoreTaxConfig.tsx
 * Oracle Document sections consumed: 3, 7, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SettingsLayout } from '@/components/layout/SettingsLayout';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { storeTaxConfigSchema, type StoreTaxConfigFormValues } from '@/types/schemas';
import { useStoreTaxConfigQuery, useUpdateStoreTaxConfigMutation } from '@/hooks/store';
import { normalizeApiError } from '@/utils/errors';
import { extractFieldErrors } from '@/utils/errors';
import { uiStore } from '@/stores/uiStore';

export default function StoreTaxConfigPage() {
  const addToast = uiStore((state) => state.addToast);
  const query = useStoreTaxConfigQuery();
  const mutation = useUpdateStoreTaxConfigMutation();
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const { register, reset, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<StoreTaxConfigFormValues>({
    resolver: zodResolver(storeTaxConfigSchema),
    defaultValues: { taxes: [] },
  });

  useEffect(() => {
    if (query.data?.taxes) {
      reset({ taxes: query.data.taxes.map((tax) => ({ category_id: tax.category_id, gst_rate: tax.gst_rate })) });
    }
  }, [query.data, reset]);

  if (query.isError) {
    return <ErrorState error={normalizeApiError(query.error)} onRetry={() => void query.refetch()} />;
  }

  if (query.isLoading) {
    return <SettingsLayout active="tax" title="Tax config" subtitle="Update GST mapping by category."><SkeletonLoader variant="rect" height={320} /></SettingsLayout>;
  }

  const onSubmit = handleSubmit(async (values) => {
    setServerMessage(null);
    try {
      const result = await mutation.mutateAsync(values);
      addToast({ title: 'Tax config saved', message: `Updated ${result.taxes.length} entries.`, variant: 'success' });
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
    <SettingsLayout active="tax" title="Tax config" subtitle="Update GST mapping by category.">
      <form className="stack" onSubmit={onSubmit} noValidate>
        {query.data?.taxes.map((tax, index) => (
          <div key={tax.category_id} className="grid grid--2">
            <div className="card"><div className="card__body"><strong>{tax.name}</strong><div className="muted">Category {tax.category_id}</div></div></div>
            <label className="field">
              <span>GST rate</span>
              <input className="input" type="number" step="0.01" {...register(`taxes.${index}.gst_rate`, { valueAsNumber: true })} />
              <input type="hidden" {...register(`taxes.${index}.category_id`, { valueAsNumber: true })} value={tax.category_id} />
            </label>
          </div>
        ))}
        {errors.root ? <div className="muted">{errors.root.message}</div> : null}
        {serverMessage ? <div className="muted">{serverMessage}</div> : null}
        <button className="button" type="submit" disabled={isSubmitting || mutation.isPending}>{isSubmitting || mutation.isPending ? 'Saving…' : 'Save tax config'}</button>
      </form>
    </SettingsLayout>
  );
}
