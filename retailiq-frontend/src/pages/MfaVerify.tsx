/**
 * src/pages/MfaVerify.tsx
 * Oracle Document sections consumed: 2, 3, 8, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthShell } from '@/components/layout/AuthShell';
import { routes } from '@/routes/routes';
import { mfaVerifySchema, type MfaVerifyFormValues } from '@/types/schemas';
import { useMfaVerifyMutation } from '@/hooks/auth';
import { normalizeApiError } from '@/utils/errors';
import { extractFieldErrors } from '@/utils/errors';
import { uiStore } from '@/stores/uiStore';

export default function MfaVerifyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') ?? routes.dashboard;
  const addToast = uiStore((state) => state.addToast);
  const mutation = useMfaVerifyMutation();
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<MfaVerifyFormValues>({
    resolver: zodResolver(mfaVerifySchema),
    defaultValues: { mfa_code: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerMessage(null);
    try {
      const result = await mutation.mutateAsync(values);
      addToast({ title: 'MFA enabled', message: result.message, variant: 'success' });
      navigate(redirect, { replace: true });
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
    <AuthShell title="Verify MFA" subtitle="Enter the authenticator code to complete setup.">
      <form className="stack" onSubmit={onSubmit} noValidate>
        <label className="field">
          <span>MFA code</span>
          <input className="input" inputMode="numeric" autoComplete="one-time-code" {...register('mfa_code')} />
          {errors.mfa_code ? <span className="muted">{errors.mfa_code.message}</span> : null}
        </label>
        {serverMessage ? <div className="muted">{serverMessage}</div> : null}
        <div className="button-row">
          <button className="button" type="submit" disabled={isSubmitting || mutation.isPending}>{isSubmitting || mutation.isPending ? 'Verifying…' : 'Verify MFA'}</button>
          <button className="button button--ghost" type="button" onClick={() => navigate(routes.dashboard)}>Cancel</button>
        </div>
      </form>
    </AuthShell>
  );
}
