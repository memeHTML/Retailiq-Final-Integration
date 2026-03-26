/**
 * src/pages/Register.tsx
 * Oracle Document sections consumed: 2, 3, 8, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { AuthShell } from '@/components/layout/AuthShell';
import { routes } from '@/routes/routes';
import { registerSchema, type RegisterFormValues } from '@/types/schemas';
import { useRegisterMutation } from '@/hooks/auth';
import { normalizeApiError } from '@/utils/errors';
import { extractFieldErrors } from '@/utils/errors';
import { uiStore } from '@/stores/uiStore';
import { clearSession } from '@/utils/session';

const OTP_DELIVERY_RECOVERY_MESSAGE = 'We could not send the verification email right now. Please try again from the next screen.';

export default function RegisterPage() {
  const navigate = useNavigate();
  const addToast = uiStore((state) => state.addToast);
  const registerMutation = useRegisterMutation();
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      mobile_number: '',
      password: '',
      full_name: '',
      store_name: '',
      email: '',
      role: 'staff',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerMessage(null);
    try {
      const result = await registerMutation.mutateAsync(values);
      const otpPath = `${routes.verifyOtp}?email=${encodeURIComponent(values.email)}&redirect=${encodeURIComponent(routes.dashboard)}`;
      clearSession();
      addToast({ title: 'Registration started', message: result.message, variant: 'success' });
      navigate(otpPath, {
        replace: true,
        state: { email: values.email, mobile_number: values.mobile_number },
      });
    } catch (error) {
      const apiError = normalizeApiError(error);
      if (apiError.status === 503) {
        const otpPath = `${routes.verifyOtp}?email=${encodeURIComponent(values.email)}&redirect=${encodeURIComponent(routes.dashboard)}`;
        clearSession();
        addToast({
          title: 'Account created',
          message: OTP_DELIVERY_RECOVERY_MESSAGE,
          variant: 'warning',
        });
        navigate(otpPath, {
          replace: true,
          state: {
            email: values.email,
            notice: OTP_DELIVERY_RECOVERY_MESSAGE,
          },
        });
        return;
      }

      if (apiError.status === 422) {
        if (apiError.fields) {
          extractFieldErrors(apiError.fields, setError);
          return;
        }

        setServerMessage(apiError.message);
        return;
      }

      setServerMessage(apiError.message);
    }
  });

  return (
    <AuthShell title="Create your RetailIQ account" subtitle="Set up a store, then verify your email to continue.">
      <form className="stack" onSubmit={onSubmit} noValidate>
        <label className="field">
          <span>Full name</span>
          <input className="input" autoComplete="name" {...register('full_name')} />
          {errors.full_name ? <span className="muted">{errors.full_name.message}</span> : null}
        </label>
        <label className="field">
          <span>Mobile number</span>
          <input className="input" type="tel" autoComplete="tel" {...register('mobile_number')} />
          {errors.mobile_number ? <span className="muted">{errors.mobile_number.message}</span> : null}
        </label>
        <label className="field">
          <span>Email</span>
          <input className="input" type="email" autoComplete="email" {...register('email')} />
          {errors.email ? <span className="muted">{errors.email.message}</span> : null}
        </label>
        <label className="field">
          <span>Store name</span>
          <input className="input" autoComplete="organization" {...register('store_name')} />
          {errors.store_name ? <span className="muted">{errors.store_name.message}</span> : null}
        </label>
        <div className="grid grid--2">
          <label className="field">
            <span>Password</span>
            <input className="input" type="password" autoComplete="new-password" {...register('password')} />
            {errors.password ? <span className="muted">{errors.password.message}</span> : null}
          </label>
          <label className="field">
            <span>Role</span>
            <select className="select" {...register('role')}>
              <option value="staff">staff</option>
              <option value="owner">owner</option>
            </select>
          </label>
        </div>
        {serverMessage ? <div className="muted">{serverMessage}</div> : null}
        <div className="button-row">
          <button className="button" type="submit" disabled={isSubmitting || registerMutation.isPending}>
            {isSubmitting || registerMutation.isPending ? 'Creating account…' : 'Create account'}
          </button>
          <button className="button button--ghost" type="button" onClick={() => navigate(routes.login)}>
            Back to login
          </button>
        </div>
      </form>
    </AuthShell>
  );
}
