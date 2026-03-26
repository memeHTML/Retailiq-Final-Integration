/**
 * src/pages/ForgotPassword.tsx
 * Oracle Document sections consumed: 2, 3, 8, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { AuthShell } from '@/components/layout/AuthShell';
import { routes } from '@/routes/routes';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/types/schemas';
import { useForgotPasswordMutation } from '@/hooks/auth';
import { normalizeApiError } from '@/utils/errors';
import { extractFieldErrors } from '@/utils/errors';
import { uiStore } from '@/stores/uiStore';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const addToast = uiStore((state) => state.addToast);
  const forgotPasswordMutation = useForgotPasswordMutation();
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '', mobile_number: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerMessage(null);
    try {
      const result = await forgotPasswordMutation.mutateAsync(values);
      addToast({ title: 'Reset request sent', message: result.message, variant: 'success' });
      if (result.token) {
        navigate(`${routes.resetPassword}?token=${encodeURIComponent(result.token)}`, { replace: true });
        return;
      }
      setServerMessage(result.message);
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
    <AuthShell title="Forgot password" subtitle="Request a reset token for your email address or mobile number.">
      <form className="stack" onSubmit={onSubmit} noValidate>
        <label className="field">
          <span>Email address</span>
          <input className="input" type="email" autoComplete="email" {...register('email')} />
          {errors.email ? <span className="muted">{errors.email.message}</span> : null}
        </label>
        <label className="field">
          <span>Mobile number</span>
          <input className="input" type="tel" autoComplete="tel" {...register('mobile_number')} />
          {errors.mobile_number ? <span className="muted">{errors.mobile_number.message}</span> : null}
        </label>
        {serverMessage ? <div className="muted">{serverMessage}</div> : null}
        <div className="button-row">
          <button className="button" type="submit" disabled={isSubmitting || forgotPasswordMutation.isPending}>
            {isSubmitting || forgotPasswordMutation.isPending ? 'Sending…' : 'Send reset link'}
          </button>
          <button className="button button--ghost" type="button" onClick={() => navigate(routes.login)}>
            Back to login
          </button>
        </div>
      </form>
    </AuthShell>
  );
}
