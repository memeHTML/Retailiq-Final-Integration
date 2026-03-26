/**
 * src/pages/ResetPassword.tsx
 * Oracle Document sections consumed: 2, 3, 8, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthShell } from '@/components/layout/AuthShell';
import { routes } from '@/routes/routes';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/types/schemas';
import { useResetPasswordMutation } from '@/hooks/auth';
import { normalizeApiError } from '@/utils/errors';
import { extractFieldErrors } from '@/utils/errors';
import { uiStore } from '@/stores/uiStore';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const addToast = uiStore((state) => state.addToast);
  const resetPasswordMutation = useResetPasswordMutation();
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, new_password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerMessage(null);
    try {
      const result = await resetPasswordMutation.mutateAsync(values);
      addToast({ title: 'Password updated', message: result.message, variant: 'success' });
      navigate(routes.login, { replace: true });
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
    <AuthShell title="Reset password" subtitle="Choose a new password for your account.">
      <form className="stack" onSubmit={onSubmit} noValidate>
        <label className="field">
          <span>Reset token</span>
          <input className="input" {...register('token')} />
          {errors.token ? <span className="muted">{errors.token.message}</span> : null}
        </label>
        <label className="field">
          <span>New password</span>
          <input className="input" type="password" autoComplete="new-password" {...register('new_password')} />
          {errors.new_password ? <span className="muted">{errors.new_password.message}</span> : null}
        </label>
        {serverMessage ? <div className="muted">{serverMessage}</div> : null}
        <div className="button-row">
          <button className="button" type="submit" disabled={isSubmitting || resetPasswordMutation.isPending}>
            {isSubmitting || resetPasswordMutation.isPending ? 'Updating…' : 'Update password'}
          </button>
          <button className="button button--ghost" type="button" onClick={() => navigate(routes.login)}>
            Back to login
          </button>
        </div>
      </form>
    </AuthShell>
  );
}
