/**
 * src/pages/Security.tsx
 * Oracle Document sections consumed: 2, 3, 7, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SettingsLayout } from '@/components/layout/SettingsLayout';
import ProvisioningQr from '@/components/shared/ProvisioningQr';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { authStore } from '@/stores/authStore';
import { useForgotPasswordMutation, useMfaSetupMutation, useMfaVerifyMutation, useResetPasswordMutation } from '@/hooks/auth';
import { normalizeApiError } from '@/utils/errors';
import { uiStore } from '@/stores/uiStore';

export default function SecurityPage() {
  const navigate = useNavigate();
  const addToast = uiStore((state) => state.addToast);
  const user = authStore((state) => state.user);
  const forgotPasswordMutation = useForgotPasswordMutation();
  const resetPasswordMutation = useResetPasswordMutation();
  const mfaSetupMutation = useMfaSetupMutation();
  const mfaVerifyMutation = useMfaVerifyMutation();

  const [resetEmail, setResetEmail] = useState(user?.email ?? '');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [provisioningUri, setProvisioningUri] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [mfaMessage, setMfaMessage] = useState<string | null>(null);
  const [showDisableDialog, setShowDisableDialog] = useState(false);

  const mfaEnabled = Boolean(user?.mfa_enabled);
  const handleSendResetToken = async () => {
    setResetMessage(null);
    try {
      const payload = resetEmail.includes('@')
        ? { email: resetEmail.trim() }
        : { mobile_number: resetEmail.trim() };
      const result = await forgotPasswordMutation.mutateAsync(payload);
      addToast({ title: 'Reset token requested', message: result.message, variant: 'success' });
      setResetMessage(result.message);
    } catch (error) {
      const apiError = normalizeApiError(error);
      setResetMessage(apiError.message);
    }
  };

  const handlePasswordReset = async () => {
    setResetMessage(null);
    try {
      const result = await resetPasswordMutation.mutateAsync({ token: resetToken.trim(), new_password: newPassword });
      addToast({ title: 'Password updated', message: result.message, variant: 'success' });
      setResetToken('');
      setNewPassword('');
      setResetMessage(result.message);
    } catch (error) {
      setResetMessage(normalizeApiError(error).message);
    }
  };

  const handleMfaSetup = async () => {
    setMfaMessage(null);
    try {
      const result = await mfaSetupMutation.mutateAsync({ password: setupPassword });
      setMfaSecret(result.secret);
      setProvisioningUri(result.provisioning_uri);
      setMfaMessage(result.message);
      addToast({ title: 'MFA secret generated', message: result.message, variant: 'success' });
    } catch (error) {
      setMfaMessage(normalizeApiError(error).message);
    }
  };

  const handleMfaVerify = async () => {
    setMfaMessage(null);
    try {
      const code = mfaCode.trim();
      const result = await mfaVerifyMutation.mutateAsync({ code, mfa_code: code });
      addToast({ title: 'MFA enabled', message: result.message, variant: 'success' });
      setMfaMessage(result.message);
      setMfaCode('');
      setProvisioningUri('');
      setMfaSecret('');
      if (user) {
        authStore.getState().setUser({ ...user, mfa_enabled: true });
      }
    } catch (error) {
      setMfaMessage(normalizeApiError(error).message);
    }
  };

  if (!user) {
    return <ErrorState error={{ message: 'You must be signed in to manage security settings.', status: 401 }} onRetry={() => navigate('/login')} />;
  }

  const loading = forgotPasswordMutation.isPending || resetPasswordMutation.isPending || mfaSetupMutation.isPending || mfaVerifyMutation.isPending;

  return (
    <SettingsLayout
      active="security"
      title="Security / MFA"
      subtitle="Manage password updates and authenticator-based login security."
      actions={<button className="button button--ghost" type="button" onClick={() => navigate('/forgot-password')}>Open reset page</button>}
    >
      <div className="stack" style={{ gap: '1.25rem' }}>
        <section className="card">
          <div className="card__header">
            <strong>Password update</strong>
          </div>
          <div className="card__body stack">
            <p className="muted" style={{ marginTop: 0 }}>
              Request a reset token, then use it to update your password. The backend does not expose a dedicated change-password endpoint here.
            </p>
            <label className="field">
              <span>Email or mobile</span>
              <input className="input" value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} />
            </label>
            <div className="button-row">
              <button className="button button--secondary" type="button" onClick={() => void handleSendResetToken()} disabled={loading || !resetEmail.trim()}>
                Send reset token
              </button>
            </div>
            <label className="field">
              <span>Reset token</span>
              <input className="input" value={resetToken} onChange={(event) => setResetToken(event.target.value)} />
            </label>
            <label className="field">
              <span>New password</span>
              <input className="input" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            </label>
            <div className="button-row">
              <button className="button" type="button" onClick={() => void handlePasswordReset()} disabled={loading || !resetToken.trim() || !newPassword.trim()}>
                Update password
              </button>
              <button className="button button--ghost" type="button" onClick={() => navigate('/reset-password')} disabled={loading}>
                Open reset page
              </button>
            </div>
            {resetMessage ? <div className="muted">{resetMessage}</div> : null}
          </div>
        </section>

        <section className="card">
          <div className="card__header">
            <strong>MFA setup</strong>
          </div>
          <div className="card__body stack">
            <p className="muted" style={{ marginTop: 0 }}>
              Generate a provisioning URI, scan it in your authenticator app, and confirm with a 6-digit code.
            </p>
            <div className="button-row">
              <span className="muted">Status: {mfaEnabled ? 'Enabled' : 'Not enabled'}</span>
              {mfaEnabled ? <button className="button button--ghost" type="button" onClick={() => setShowDisableDialog(true)}>Disable MFA unavailable</button> : null}
            </div>
            <label className="field">
              <span>Current password</span>
              <input className="input" type="password" autoComplete="current-password" value={setupPassword} onChange={(event) => setSetupPassword(event.target.value)} />
            </label>
            <div className="button-row">
              <button className="button button--secondary" type="button" onClick={() => void handleMfaSetup()} disabled={loading || !setupPassword.trim()}>
                Generate MFA secret
              </button>
            </div>
            {mfaSecret || provisioningUri ? (
              <div className="card" style={{ marginTop: '0.5rem' }}>
                <div className="card__header"><strong>Provisioning details</strong></div>
                <div className="card__body stack">
                  {provisioningUri ? (
                    <div className="stack">
                      <div className="muted">Scan this QR code with your authenticator app</div>
                      <ProvisioningQr value={provisioningUri} />
                    </div>
                  ) : null}
                  {mfaSecret ? <div><div className="muted">Secret</div><code>{mfaSecret}</code></div> : null}
                  {provisioningUri ? <div><div className="muted">Provisioning URI</div><code style={{ wordBreak: 'break-all' }}>{provisioningUri}</code></div> : null}
                </div>
              </div>
            ) : null}
            <label className="field">
              <span>Authenticator code</span>
              <input className="input" inputMode="numeric" autoComplete="one-time-code" value={mfaCode} onChange={(event) => setMfaCode(event.target.value)} />
            </label>
            <div className="button-row">
              <button className="button" type="button" onClick={() => void handleMfaVerify()} disabled={loading || !mfaCode.trim() || (!mfaSecret && !provisioningUri)}>
                Verify MFA
              </button>
              <button className="button button--ghost" type="button" onClick={() => navigate('/mfa-setup')}>
                Open dedicated setup
              </button>
            </div>
            {mfaMessage ? <div className="muted">{mfaMessage}</div> : null}
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={showDisableDialog}
        title="Disable MFA unavailable"
        body="This build does not expose an MFA disable endpoint yet. You can still manage setup and verification from this page."
        confirmLabel="Understood"
        onConfirm={() => setShowDisableDialog(false)}
        onCancel={() => setShowDisableDialog(false)}
      />
    </SettingsLayout>
  );
}
