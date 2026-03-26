/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LoginPage from '@/pages/Login';
import RegisterPage from '@/pages/Register';
import VerifyOtpPage from '@/pages/VerifyOtp';

const mocks = vi.hoisted(() => ({
  addToast: vi.fn(),
  clearSession: vi.fn(),
  loginMutateAsync: vi.fn(),
  registerMutateAsync: vi.fn(),
  verifyMutateAsync: vi.fn(),
  resendMutateAsync: vi.fn(),
}));

vi.mock('@/hooks/auth', () => ({
  useLoginMutation: () => ({ mutateAsync: mocks.loginMutateAsync, isPending: false }),
  useRegisterMutation: () => ({ mutateAsync: mocks.registerMutateAsync, isPending: false }),
  useVerifyOtpMutation: () => ({ mutateAsync: mocks.verifyMutateAsync, isPending: false }),
  useResendOtpMutation: () => ({ mutateAsync: mocks.resendMutateAsync, isPending: false }),
}));

vi.mock('@/stores/uiStore', () => ({
  uiStore: (selector: (state: { addToast: typeof mocks.addToast }) => unknown) => selector({ addToast: mocks.addToast }),
}));

vi.mock('@/utils/session', () => ({
  clearSession: mocks.clearSession,
  persistAuthTokens: vi.fn(),
}));

const OTP_DELIVERY_RECOVERY_MESSAGE = 'We could not send the verification email right now. Please try again from the next screen.';

describe('verification email recovery', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('moves registration failures caused by email delivery into the OTP flow', async () => {
    mocks.registerMutateAsync.mockRejectedValue({
      status: 503,
      message: 'Unable to send verification email right now. Please try again later.',
    });

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/register']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/full name/i), 'Ada Lovelace');
    await user.type(screen.getByLabelText(/mobile number/i), '9999999999');
    await user.type(screen.getByLabelText(/^email$/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/store name/i), 'Ada Store');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(OTP_DELIVERY_RECOVERY_MESSAGE)).toBeTruthy();
    expect(screen.getByDisplayValue('ada@example.com')).toBeTruthy();
    expect(mocks.clearSession).toHaveBeenCalled();
    expect(mocks.addToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'warning' }));
  });

  it('moves login failures caused by email delivery into the OTP flow', async () => {
    mocks.loginMutateAsync.mockRejectedValue({
      status: 503,
      message: 'Unable to send verification email right now. Please try again later.',
    });

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/login?redirect=%2Fdashboard']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/email address/i), 'signin@example.com');
    await user.click(screen.getByRole('button', { name: /send otp/i }));

    expect(await screen.findByText(OTP_DELIVERY_RECOVERY_MESSAGE)).toBeTruthy();
    expect(screen.getByDisplayValue('signin@example.com')).toBeTruthy();
    expect(mocks.addToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'warning' }));
  });
});
