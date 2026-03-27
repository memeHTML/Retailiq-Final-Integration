/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LoginPage from '@/pages/Login';
import { Sidebar } from '@/components/layout/Sidebar';
import { authStore } from '@/stores/authStore';
import { uiStore } from '@/stores/uiStore';
import AiToolsPage from '@/pages/AiTools';
import SecurityPage from '@/pages/Security';

const mocks = vi.hoisted(() => ({
  loginMutateAsync: vi.fn(),
}));

vi.mock('@/hooks/auth', () => ({
  useLoginMutation: () => ({ mutateAsync: mocks.loginMutateAsync, isPending: false }),
}));

describe('Prompt 00 step 9 shell verification', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    window.localStorage.clear();
    authStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      role: null,
    });
    uiStore.setState({ sidebarCollapsed: false });
  });

  it('renders the login page cleanly', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/sign in with your email address/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /email otp/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /mobile password/i })).toBeTruthy();
  });

  it('renders the sidebar with the full navigation surface', () => {
    authStore.setState({
      accessToken: 'token',
      refreshToken: 'refresh',
      user: {
        user_id: 1,
        role: 'owner',
        store_id: 1,
        mobile_number: '9999999999',
        full_name: 'Owner User',
      },
      isAuthenticated: true,
      role: 'owner',
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar />
      </MemoryRouter>,
    );

    [
      'Overview',
      'Smart Alerts',
      'Reports',
      'Financial Calendar',
      'Products',
      'Stock Audit',
      'Inventory Sync',
      'Receipts & Barcodes',
      'Vision OCR',
      'Pricing',
      'Forecasting',
      'POS / New Sale',
      'Transactions',
      'Returns',
      'Purchase Orders',
      'Suppliers',
      'Marketplace',
      'All Customers',
      'Loyalty',
      'Credit',
      'WhatsApp',
      'Business Analytics',
      'Market Intelligence',
      'Decisions',
      'Staff Performance',
      'Offline Data',
      'Finance Dashboard',
      'Ledger',
      'Treasury',
      'Loans',
      'GST / Tax',
      'E-Invoicing',
      'Chat',
      'AI Tools',
      'Chain Management',
      'Developer Platform',
      'KYC',
      'Store Profile',
      'Categories',
      'Tax Config',
      'Language / i18n',
      'Security / MFA',
    ].forEach((label) => {
      expect(screen.getByText(label)).toBeTruthy();
    });
  });

  it('renders representative route stubs without crashing', () => {
    const routeEntries = [
      { path: '/ai-assistant/tools', element: <AiToolsPage />, title: 'AI Tools' },
      { path: '/security', element: <SecurityPage />, title: 'Security / MFA' },
    ] as const;

    for (const route of routeEntries) {
      cleanup();
      render(
        <MemoryRouter initialEntries={[route.path]}>
          <Routes>
            <Route path={route.path} element={route.element} />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getAllByText(route.title).length).toBeGreaterThan(0);
    }
  });

  it('rehydrates the persisted auth store from localStorage', async () => {
    const snapshot = {
      state: {
        accessToken: 'persisted-access',
        refreshToken: 'persisted-refresh',
        user: {
          user_id: 9,
          role: 'owner',
          store_id: 7,
          mobile_number: '8888888888',
          full_name: 'Persisted User',
        },
        isAuthenticated: true,
        role: 'owner',
      },
      version: 0,
    };

    window.localStorage.setItem('retailiq-auth', JSON.stringify(snapshot));

    await act(async () => {
      vi.resetModules();
      const { authStore: freshStore } = await import('@/stores/authStore');
      expect(freshStore.getState().accessToken).toBe('persisted-access');
      expect(freshStore.getState().isAuthenticated).toBe(true);
      expect(freshStore.getState().user?.full_name).toBe('Persisted User');
    });
  });
});
