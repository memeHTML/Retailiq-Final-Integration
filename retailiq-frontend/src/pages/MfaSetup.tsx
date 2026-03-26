/**
 * src/pages/MfaSetup.tsx
 * Oracle Document sections consumed: 2, 3, 8, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthShell } from '@/components/layout/AuthShell';
import { routes } from '@/routes/routes';
import { mfaSetupSchema, type MfaSetupFormValues } from '@/types/schemas';
import { useMfaSetupMutation } from '@/hooks/auth';
import { normalizeApiError } from '@/utils/errors';
import { extractFieldErrors } from '@/utils/errors';
import { uiStore } from '@/stores/uiStore';

export default function MfaSetupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') ?? routes.dashboard;
  const addToast = uiStore((state) => state.addToast);
  const mutation = useMfaSetupMutation();
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<MfaSetupFormValues>({
    resolver: zodResolver(mfaSetupSchema),
    defaultValues: { password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerMessage(null);
    try {
      const result = await mutation.mutateAsync(values);
      addToast({ title: 'MFA configured', message: result.message, variant: 'success' });
      navigate(`${routes.mfaVerify}?redirect=${encodeURIComponent(redirect)}`, { replace: true });
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
    <AuthShell title="Set up MFA" subtitle="Configure a one-time authenticator for this account.">
      <form className="stack" onSubmit={onSubmit} noValidate>
        <label className="field">
          <span>Password</span>
          <input className="input" type="password" autoComplete="current-password" {...register('password')} />
          {errors.password ? <span className="muted">{errors.password.message}</span> : null}
        </label>
        {serverMessage ? <div className="muted">{serverMessage}</div> : null}
        <div className="button-row">
          <button className="button" type="submit" disabled={isSubmitting || mutation.isPending}>{isSubmitting || mutation.isPending ? 'Generating…' : 'Generate MFA secret'}</button>
          <button className="button button--ghost" type="button" onClick={() => navigate(routes.dashboard)}>Skip</button>
        </div>
      </form>
    </AuthShell>
  );
}
