/**
 * src/pages/Login.tsx
 * Oracle Document sections consumed: 2, 3, 8, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthShell } from '@/components/layout/AuthShell';
import { routes } from '@/routes/routes';
import { loginSchema, type LoginFormValues } from '@/types/schemas';
import { useLoginMutation } from '@/hooks/auth';
import { normalizeApiError } from '@/utils/errors';
import { extractFieldErrors } from '@/utils/errors';
import { uiStore } from '@/stores/uiStore';
import { persistAuthTokens } from '@/utils/session';

const OTP_DELIVERY_RECOVERY_MESSAGE = 'We could not send the verification email right now. Please try again from the next screen.';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'otp' | 'password'>('otp');
  const addToast = uiStore((state) => state.addToast);
  const loginMutation = useLoginMutation();
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      mobile_number: '',
      password: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerMessage(null);
    try {
      const payload = mode === 'otp'
        ? { email: values.email }
        : { mobile_number: values.mobile_number, password: values.password };
      const result = await loginMutation.mutateAsync(payload);
      if (result.access_token && result.refresh_token) {
        persistAuthTokens({
          access_token: result.access_token,
          refresh_token: result.refresh_token,
          user_id: result.user_id ?? 0,
          role: result.role ?? null,
          store_id: result.store_id ?? null,
        });
        addToast({ title: 'Welcome back', message: 'You are now signed in.', variant: 'success' });
        navigate(searchParams.get('redirect') || routes.dashboard, { replace: true });
        return;
      }

      if (result.requires_otp || result.message) {
        const redirect = searchParams.get('redirect') || routes.dashboard;
        const identifier = mode === 'otp' ? values.email : values.mobile_number;
        addToast({ title: 'OTP sent', message: result.message ?? 'A verification code was sent.', variant: 'success' });
        navigate(`${routes.verifyOtp}?${mode === 'otp' ? 'email' : 'mobile_number'}=${encodeURIComponent(identifier ?? '')}&redirect=${encodeURIComponent(redirect)}`, {
          replace: true,
          state: { [mode === 'otp' ? 'email' : 'mobile_number']: identifier },
        });
        return;
      }

      setServerMessage('Unable to sign in.');
    } catch (error) {
      const apiError = normalizeApiError(error);
      if (apiError.status === 503) {
        const redirect = searchParams.get('redirect') || routes.dashboard;
        addToast({
          title: 'Verification pending',
          message: OTP_DELIVERY_RECOVERY_MESSAGE,
          variant: 'warning',
        });
        navigate(`${routes.verifyOtp}?email=${encodeURIComponent(values.email ?? '')}&redirect=${encodeURIComponent(redirect)}`, {
          replace: true,
          state: {
            email: values.email,
            notice: OTP_DELIVERY_RECOVERY_MESSAGE,
          },
        });
        return;
      }

      if (apiError.status === 422) {
        extractFieldErrors(apiError.fields, setError);
        return;
      }

      if (apiError.status === 401 || apiError.status === 403 || apiError.status === 423 || apiError.status === 503) {
        setServerMessage(apiError.message);
        return;
      }

      setServerMessage(apiError.message);
    }
  });

  return (
    <AuthShell title="RetailIQ" subtitle={mode === 'otp' ? 'Sign in with your email address. We will send a one-time code.' : 'Sign in with your mobile number and password.'}>
      <form className="stack" onSubmit={onSubmit} noValidate>
        <div className="button-row">
          <button className={`button ${mode === 'otp' ? '' : 'button--ghost'}`} type="button" onClick={() => setMode('otp')}>
            Email OTP
          </button>
          <button className={`button ${mode === 'password' ? '' : 'button--ghost'}`} type="button" onClick={() => setMode('password')}>
            Mobile password
          </button>
        </div>
        {mode === 'otp' ? (
          <label className="field">
            <span>Email address</span>
            <input className="input" type="email" autoComplete="email" {...register('email')} />
            {errors.email ? <span className="muted">{errors.email.message}</span> : null}
          </label>
        ) : (
          <>
            <label className="field">
              <span>Mobile number</span>
              <input className="input" type="tel" autoComplete="tel" {...register('mobile_number')} />
              {errors.mobile_number ? <span className="muted">{errors.mobile_number.message}</span> : null}
            </label>
            <label className="field">
              <span>Password</span>
              <input className="input" type="password" autoComplete="current-password" {...register('password')} />
              {errors.password ? <span className="muted">{errors.password.message}</span> : null}
            </label>
          </>
        )}
        {errors.root ? <div className="muted">{errors.root.message}</div> : null}
        {serverMessage ? <div className="muted">{serverMessage}</div> : null}
        <div className="button-row">
          <button className="button" type="submit" disabled={isSubmitting || loginMutation.isPending}>
            {isSubmitting || loginMutation.isPending ? 'Signing in…' : mode === 'otp' ? 'Send OTP' : 'Sign in'}
          </button>
        </div>
        <p className="muted">
          Need an account? <button className="button button--ghost" type="button" onClick={() => navigate(routes.register)} style={{ padding: 0, border: 'none', background: 'transparent' }}>Register</button>
        </p>
      </form>
    </AuthShell>
  );
}
