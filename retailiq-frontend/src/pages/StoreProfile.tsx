/**
 * src/pages/StoreProfile.tsx
 * Oracle Document sections consumed: 3, 7, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageFrame } from '@/components/layout/PageFrame';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { storeProfileSchema, type StoreProfileFormValues } from '@/types/schemas';
import { useStoreProfileQuery, useUpdateStoreProfileMutation } from '@/hooks/store';
import { normalizeApiError } from '@/utils/errors';
import { extractFieldErrors } from '@/utils/errors';
import { uiStore } from '@/stores/uiStore';

export default function StoreProfilePage() {
  const addToast = uiStore((state) => state.addToast);
  const profileQuery = useStoreProfileQuery();
  const updateMutation = useUpdateStoreProfileMutation();
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const { register, reset, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<StoreProfileFormValues>({
    resolver: zodResolver(storeProfileSchema),
    defaultValues: {
      store_name: '',
      store_type: '',
      city: '',
      state: '',
      gst_number: '',
      currency_symbol: '',
      working_days: [],
      opening_time: '',
      closing_time: '',
      timezone: '',
    },
  });

  useEffect(() => {
    if (profileQuery.data) {
      reset({
        store_name: profileQuery.data.store_name,
        store_type: profileQuery.data.store_type,
        city: profileQuery.data.city,
        state: profileQuery.data.state,
        gst_number: profileQuery.data.gst_number,
        currency_symbol: profileQuery.data.currency_symbol,
        working_days: profileQuery.data.working_days,
        opening_time: profileQuery.data.opening_time,
        closing_time: profileQuery.data.closing_time,
        timezone: profileQuery.data.timezone,
      });
    }
  }, [profileQuery.data, reset]);

  if (profileQuery.isError) {
    return <ErrorState error={normalizeApiError(profileQuery.error)} onRetry={() => void profileQuery.refetch()} />;
  }

  if (profileQuery.isLoading) {
    return <PageFrame title="Store profile" subtitle="Manage your store configuration."><SkeletonLoader variant="rect" height={340} /></PageFrame>;
  }

  const onSubmit = handleSubmit(async (values) => {
    setServerMessage(null);
    try {
      const result = await updateMutation.mutateAsync(values);
      addToast({ title: 'Store profile updated', message: result.store_name, variant: 'success' });
      void profileQuery.refetch();
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
    <PageFrame title="Store profile" subtitle="Manage your store configuration.">
      <form className="stack" onSubmit={onSubmit} noValidate>
        <div className="grid grid--2">
          <label className="field"><span>Store name</span><input className="input" {...register('store_name')} /></label>
          <label className="field"><span>Store type</span><input className="input" {...register('store_type')} /></label>
        </div>
        <div className="grid grid--2">
          <label className="field"><span>City</span><input className="input" {...register('city')} /></label>
          <label className="field"><span>State</span><input className="input" {...register('state')} /></label>
        </div>
        <div className="grid grid--2">
          <label className="field"><span>GST number</span><input className="input" {...register('gst_number')} /></label>
          <label className="field"><span>Currency symbol</span><input className="input" {...register('currency_symbol')} /></label>
        </div>
        <div className="grid grid--3">
          <label className="field"><span>Opening time</span><input className="input" {...register('opening_time')} /></label>
          <label className="field"><span>Closing time</span><input className="input" {...register('closing_time')} /></label>
          <label className="field"><span>Timezone</span><input className="input" {...register('timezone')} /></label>
        </div>
        <label className="field"><span>Working days</span><input className="input" placeholder="Mon,Tue,Wed" {...register('working_days', { setValueAs: (value) => typeof value === 'string' ? value.split(',').map((day) => day.trim()).filter(Boolean) : value })} /></label>
        {errors.root ? <div className="muted">{errors.root.message}</div> : null}
        {serverMessage ? <div className="muted">{serverMessage}</div> : null}
        <button className="button" type="submit" disabled={isSubmitting || updateMutation.isPending}>{isSubmitting || updateMutation.isPending ? 'Saving…' : 'Save store profile'}</button>
      </form>
    </PageFrame>
  );
}
