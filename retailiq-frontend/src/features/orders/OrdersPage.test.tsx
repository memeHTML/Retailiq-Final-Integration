/* @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import OrdersPage from './OrdersPage';

vi.mock('@/hooks/transactions', () => ({
  useDailySummaryQuery: () => ({ data: { total_sales: 12400, total_transactions: 18, net_sales: 11800, total_returns: 2 }, isLoading: false }),
  useTransactionsQuery: () => ({ data: { data: [{ transaction_id: 'TX-1', created_at: '2025-03-21T10:00:00.000Z', payment_mode: 'CASH', notes: 'Walk-in' }] }, isLoading: false }),
}));

vi.mock('@/hooks/purchaseOrders', () => ({
  usePurchaseOrders: () => ({ data: [{ id: 'PO-1', supplier_id: 'SUP-1', status: 'DRAFT', expected_delivery_date: '2025-03-22', created_at: '2025-03-20T09:00:00.000Z' }], isLoading: false }),
}));

vi.mock('@/hooks/marketplace', () => ({
  useMarketplaceOrdersQuery: () => ({ data: { orders: [{ id: 1, order_number: 'MKT-1', supplier_profile_id: 9, status: 'NEW', total: 900, payment_status: 'PENDING', financed: false, created_at: '2025-03-20T10:00:00.000Z', expected_delivery: null }], total: 1, page: 1, pages: 1 }, isLoading: false }),
  useMarketplaceRecommendationsQuery: () => ({ data: [{ id: 1, product_name: 'Rice', category: 'Grocery', urgency: 'HIGH', suggested_qty: 10, suggested_supplier_id: 2 }], isLoading: false }),
}));

describe('OrdersPage', () => {
  it('renders all hub tabs and preview data', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <OrdersPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Orders' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Sales' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Purchase Orders' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Marketplace' })).toBeTruthy();
    expect(screen.getByText('TX-1')).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: 'Purchase Orders' }));
    expect(screen.getByText('PO-1')).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: 'Marketplace' }));
    expect(screen.getByText('MKT-1')).toBeTruthy();
    expect(screen.getByText('Rice')).toBeTruthy();
  });
});
