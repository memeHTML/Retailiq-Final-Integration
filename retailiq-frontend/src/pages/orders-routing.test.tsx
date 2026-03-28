/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import { authStore } from '@/stores/authStore';
import LoginPage from '@/pages/Login';
import PosPage from '@/pages/Pos';
import TransactionsPage from '@/pages/Transactions';
import TransactionDetailPage from '@/pages/TransactionDetail';
import OrdersPage from '@/pages/Orders';
import { uiStore } from '@/stores/uiStore';

const mocks = vi.hoisted(() => ({
  products: [{ product_id: 1, name: 'Tea', sku_code: 'TEA-01', barcode: '111', selling_price: 25, current_stock: 10 }],
  customers: [{ customer_id: 1, name: 'Asha', mobile_number: '9999999999' }],
  transactionDetail: {
    transaction_id: '11111111-1111-1111-1111-111111111111',
    created_at: '2026-03-27T10:00:00.000Z',
    payment_mode: 'CASH',
    customer_id: 1,
    notes: 'Test order',
    is_return: false,
    original_transaction_id: null,
    line_items: [
      {
        product_id: 1,
        product_name: 'Tea',
        quantity: 2,
        selling_price: 25,
        discount_amount: 0,
      },
    ],
  },
  createTransaction: vi.fn().mockResolvedValue({ transaction_id: '11111111-1111-1111-1111-111111111111' }),
  createReturn: vi.fn().mockResolvedValue({ return_transaction_id: '22222222-2222-2222-2222-222222222222' }),
}));

vi.mock('@/hooks/inventory', () => ({
  useProductsQuery: () => ({
    data: { data: mocks.products, page: 1, page_size: 50, total: 1 },
    isLoading: false,
    isError: false,
  }),
}));

vi.mock('@/hooks/customers', () => ({
  useCustomersQuery: () => ({
    data: { data: mocks.customers, page: 1, page_size: 50, total: 1 },
    isLoading: false,
    isError: false,
  }),
  useCustomerQuery: () => ({
    data: { customer_id: 1, name: 'Asha', mobile_number: '9999999999', email: 'asha@example.com' },
    isLoading: false,
    isError: false,
  }),
}));

vi.mock('@/hooks/transactions', () => ({
  useCreateTransactionMutation: () => ({
    mutateAsync: mocks.createTransaction,
    isPending: false,
  }),
  useTransactionsQuery: () => ({
    data: {
      data: [
        {
          transaction_id: '11111111-1111-1111-1111-111111111111',
          created_at: '2026-03-27T10:00:00.000Z',
          payment_mode: 'CASH',
          customer_id: 1,
          is_return: false,
        },
      ],
      page: 1,
      page_size: 10,
      total: 1,
    },
    isLoading: false,
    isError: false,
  }),
  useTransactionQuery: () => ({
    data: mocks.transactionDetail,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useDailySummaryQuery: () => ({
    data: {
      date: '2026-03-27',
      total_sales: 250,
      total_transactions: 1,
      total_returns: 0,
      net_sales: 250,
      payment_breakdown: { CASH: 250 },
    },
    isLoading: false,
    isError: false,
  }),
  useCreateTransactionReturnMutation: () => ({
    mutateAsync: mocks.createReturn,
    isPending: false,
  }),
}));

describe('orders routing and smoke coverage', () => {
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
    uiStore.setState({ sidebarCollapsed: false });
  });

  it('renders the canonical POS route', () => {
    render(
      <MemoryRouter initialEntries={['/orders/pos']}>
        <PosPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/point of sale/i)).toBeTruthy();
    expect(screen.getByText(/current cart/i)).toBeTruthy();
    expect(screen.getByText(/product search/i)).toBeTruthy();
  });

  it('renders the canonical transactions route', () => {
    render(
      <MemoryRouter initialEntries={['/orders/transactions']}>
        <TransactionsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /transactions/i })).toBeTruthy();
    expect(screen.getByText(/daily summary/i, { selector: 'strong' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: /transaction id/i })).toBeTruthy();
  });

  it('renders the canonical transaction detail route', () => {
    render(
      <MemoryRouter initialEntries={['/orders/transactions/11111111-1111-1111-1111-111111111111']}>
        <Routes>
          <Route path="/orders/transactions/:uuid" element={<TransactionDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/transaction 11111111-1111-1111-1111-111111111111/i)).toBeTruthy();
    expect(screen.getByText(/process return/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /process return/i }));
    expect(screen.getByText(/return items/i)).toBeTruthy();
  });

  it('redirects legacy order URLs to the canonical route space', async () => {
    render(
      <MemoryRouter initialEntries={['/pos']}>
        <Routes>
          <Route path="/pos" element={<Navigate to="/orders/pos" replace />} />
          <Route path="/orders/pos" element={<PosPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/point of sale/i)).toBeTruthy();
    });
  });

  it('renders the orders hub page', () => {
    render(
      <MemoryRouter initialEntries={['/orders']}>
        <OrdersPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /orders hub/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /sales/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /open pos/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /view transactions/i })).toBeTruthy();
  });
});
