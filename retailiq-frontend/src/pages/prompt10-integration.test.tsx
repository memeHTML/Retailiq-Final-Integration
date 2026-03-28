/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import PageErrorFallback from '@/components/shared/PageErrorFallback';
import OrdersPage from '@/pages/Orders';
import CustomerDetailPage from '@/pages/CustomerDetail';
import { authStore } from '@/stores/authStore';

const mocks = vi.hoisted(() => ({
  customerQuery: {
    customer_id: 42,
    name: 'Asha Kumar',
    mobile_number: '9999999999',
    email: 'asha@example.com',
    created_at: '2026-03-20T10:00:00.000Z',
    gender: 'Female',
    address: 'MG Road',
    notes: 'VIP',
    birth_date: '1992-02-14',
  },
  customerSummary: {
    total_spent: 12500,
    total_transactions: 12,
    avg_basket_size: 1042,
    last_visit: '2026-03-27T09:30:00.000Z',
    top_categories: [{ category: 'Groceries', amount: 8200 }],
  },
  recentTransactions: {
    data: [
      {
        transaction_id: 'tx-1',
        created_at: '2026-03-27T09:00:00.000Z',
        payment_mode: 'CASH',
        notes: 'Morning order',
        amount: 450,
        status: 'Completed',
        items_count: 3,
      },
    ],
    meta: { page: 1, page_size: 5, total: 1 },
  },
  loyaltyTab: vi.fn(() => <div>Loyalty tab ready</div>),
  creditTab: vi.fn(() => <div>Credit tab ready</div>),
  whatsappTab: vi.fn(() => <div>WhatsApp tab ready</div>),
}));

vi.mock('@/hooks/customers', () => ({
  useCustomerQuery: () => ({
    data: mocks.customerQuery,
    isLoading: false,
    isError: false,
  }),
  useCustomerSummaryQuery: () => ({
    data: mocks.customerSummary,
    isLoading: false,
    isError: false,
  }),
  useCustomerTransactionsQuery: () => ({
    data: mocks.recentTransactions,
    isLoading: false,
    isError: false,
  }),
  useUpdateCustomerMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@/features/customers/CustomerLoyaltyTab', () => ({
  default: mocks.loyaltyTab,
}));

vi.mock('@/features/customers/CustomerCreditTab', () => ({
  default: mocks.creditTab,
}));

vi.mock('@/features/customers/CustomerWhatsAppTab', () => ({
  default: mocks.whatsappTab,
}));

describe('Prompt 10 integration coverage', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    window.localStorage.clear();
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
  });

  it('renders the customer detail loyalty, credit, and WhatsApp tabs', async () => {
    render(
      <MemoryRouter initialEntries={['/customers/42']}>
        <Routes>
          <Route path="/customers/:customerId" element={<CustomerDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /loyalty/i }));
    expect(await screen.findByText(/loyalty tab ready/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /credit/i }));
    expect(await screen.findByText(/credit tab ready/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /whatsapp/i }));
    expect(await screen.findByText(/whatsapp tab ready/i)).toBeTruthy();
  });

  it('shows the page error fallback with recovery actions', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const Boom = () => {
      throw new Error('boom');
    };

    render(
      <MemoryRouter initialEntries={['/orders']}>
        <ErrorBoundary fallback={<PageErrorFallback />}>
          <Boom />
        </ErrorBoundary>
      </MemoryRouter>,
    );

    expect(screen.getAllByText(/something went wrong/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /go to dashboard/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /reload page/i })).toBeTruthy();

    errorSpy.mockRestore();
  });

  it('renders the orders hub without crashing', () => {
    render(
      <MemoryRouter initialEntries={['/orders']}>
        <OrdersPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /orders hub/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /open pos/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /view transactions/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /purchase orders/i }));
    expect(screen.getByRole('link', { name: /open purchase orders/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /marketplace orders/i }));
    expect(screen.getByRole('link', { name: /open marketplace/i })).toBeTruthy();
  });
});
