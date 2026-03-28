/* @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CustomerDetailPage from './CustomerDetail';

vi.mock('@/hooks/customers', () => ({
  useCustomerQuery: () => ({
    data: {
      customer_id: 12,
      name: 'Ada Lovelace',
      mobile_number: '9999999999',
      email: 'ada@example.com',
      gender: 'F',
      birth_date: '1815-12-10',
      address: 'London',
      notes: 'VIP customer',
      created_at: '2025-03-01T09:00:00.000Z',
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useCustomerSummaryQuery: () => ({
    data: {
      total_spent: 3200,
      total_transactions: 8,
      avg_basket_size: 400,
      last_visit: '2025-03-15T10:00:00.000Z',
      top_categories: [],
    },
    isLoading: false,
    isError: false,
  }),
  useCustomerTransactionsQuery: () => ({
    data: {
      data: [
        {
          transaction_id: 'txn-1',
          created_at: '2025-03-16T11:30:00.000Z',
          payment_mode: 'CASH',
          notes: 'Paid in cash',
        },
      ],
    },
    isLoading: false,
    isError: false,
  }),
  useUpdateCustomerMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
}));

vi.mock('@/features/loyalty/CustomerLoyaltyTab', () => ({
  CustomerLoyaltyTab: () => <div>Loyalty tab content</div>,
}));

vi.mock('@/features/credit/CustomerCreditTab', () => ({
  CustomerCreditTab: () => <div>Credit tab content</div>,
}));

vi.mock('@/features/whatsapp/CustomerWhatsAppTab', () => ({
  CustomerWhatsAppTab: ({ phoneNumber }: { phoneNumber: string }) => <div>WhatsApp tab content {phoneNumber}</div>,
}));

describe('CustomerDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the additional customer tabs and swaps content safely', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/customers/12']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/customers/:customerId" element={<CustomerDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Ada Lovelace' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Loyalty' }));
    expect(screen.getByText('Loyalty tab content')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Credit' }));
    expect(screen.getByText('Credit tab content')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'WhatsApp' }));
    expect(screen.getByText('WhatsApp tab content 9999999999')).toBeTruthy();
  });
});
