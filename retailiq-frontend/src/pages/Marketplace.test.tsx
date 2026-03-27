/* @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MarketplacePage from './Marketplace';

const rfqMutate = vi.fn((payload, options?: { onSuccess?: (value: { rfq_id: number; status: string }) => void }) => {
  options?.onSuccess?.({ rfq_id: 77, status: 'OPEN' });
});
const orderMutate = vi.fn((payload, options?: { onSuccess?: (value: { order_id: number; order_number: string; total: number; status: string; financing_decision: string | null }) => void }) => {
  options?.onSuccess?.({ order_id: 501, order_number: 'PO-123', total: 1250, status: 'SUBMITTED', financing_decision: 'APPROVED' });
});
const supplierMutate = vi.fn((payload, options?: { onSuccess?: (value: { id: number; business_name: string }) => void }) => {
  options?.onSuccess?.({ id: 42, business_name: 'Acme Supplies' });
});
const recommendationQueryCalls: Array<Record<string, unknown>> = [];

Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
  configurable: true,
  value: vi.fn(() => false),
});
Object.defineProperty(Element.prototype, 'scrollIntoView', {
  configurable: true,
  value: vi.fn(),
});
Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
  configurable: true,
  value: vi.fn(),
});
Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
  configurable: true,
  value: vi.fn(),
});

vi.mock('@/hooks/marketplace', () => ({
  useMarketplaceSearchQuery: (_params: unknown) => ({
    data: {
      items: [
        { id: '11', sku: 'SKU-11', name: 'Herbal Tea', category: 'Beverages', unit_price: 125, moq: 10, supplier_profile_id: 42 },
        { id: '12', sku: 'SKU-12', name: 'Coffee Beans', category: 'Beverages', unit_price: 450, moq: 5, supplier_profile_id: 42 },
      ],
      total: 40,
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useMarketplaceRecommendationsQuery: (params: Record<string, unknown>) => {
    recommendationQueryCalls.push(params);
    return {
      data: [{ id: 1, product_name: 'Paper Cups', category: 'Packaging', urgency: 'HIGH', suggested_qty: 250, suggested_supplier_id: 42 }],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    };
  },
  useMarketplaceOrdersQuery: () => ({
    data: {
      orders: [
        { id: 501, order_number: 'PO-123', supplier_profile_id: 42, status: 'SUBMITTED', total: 1250, payment_status: 'PENDING', financed: true, created_at: '2026-03-27T00:00:00Z', expected_delivery: '2026-04-01T00:00:00Z' },
      ],
      total: 1,
      page: 1,
      pages: 1,
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useMarketplaceOrderQuery: (orderId: string) => ({
    data: orderId === '501' ? {
      id: 501,
      order_number: 'PO-123',
      supplier_profile_id: 42,
      status: 'SUBMITTED',
      subtotal: 1050,
      tax: 189,
      shipping_cost: 11,
      total: 1250,
      payment_status: 'PENDING',
      financed: true,
      loan_id: 9,
      created_at: '2026-03-27T00:00:00Z',
      expected_delivery: '2026-04-01T00:00:00Z',
      shipping_tracking: { tracking_number: 'TRACK-1' },
      items: [{ catalog_item_id: 11, quantity: 10, unit_price: 105, subtotal: 1050 }],
    } : undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useMarketplaceTrackingQuery: (orderId: string) => ({
    data: orderId === '501' ? {
      status: 'SHIPPED',
      tracking_events: [{ timestamp: '2026-03-27T10:00:00Z', status: 'Packed', location: 'Warehouse', description: 'Packed for dispatch' }],
      estimated_delivery: '2026-04-01T00:00:00Z',
      logistics_provider: 'BlueDart',
    } : undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useRfqQuery: (rfqId: string) => ({
    data: rfqId === '77' ? {
      id: 77,
      items: [{ category: 'Beverages', description: 'Herbal Tea', quantity: 15 }],
      status: 'OPEN',
      matched_suppliers_count: 2,
      created_at: '2026-03-27T00:00:00Z',
      responses: [{ id: 9, supplier_profile_id: 42, quoted_items: [{ rfq_item_id: 1, unit_price: 120, catalog_item_id: 11 }], total_price: 1200, delivery_days: 3, status: 'PENDING' }],
    } : undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useSupplierDashboardQuery: (supplierId: string) => ({
    data: supplierId === '42' ? { supplier_id: 42, business_name: 'Acme Supplies', rating: 4.8, total_orders: 8, revenue: 51000, active_listings: 3, fulfillment_rate: 97.5, fulfilled_orders: 7 } : undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useSupplierCatalogQuery: (supplierId: string) => ({
    data: supplierId === '42' ? { items: [{ id: 88, sku: 'CAT-88', name: 'Chai Mix', category: 'Beverages', unit_price: 90, moq: 12 }], total: 1 } : { items: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useCreateRfqMutation: () => ({ mutate: rfqMutate, isPending: false, isError: false, isSuccess: false, error: null }),
  useCreateMarketplaceOrderMutation: () => ({ mutate: orderMutate, isPending: false, isError: false, isSuccess: false, error: null }),
  useSupplierOnboardMutation: () => ({ mutate: supplierMutate, isPending: false, isError: false, isSuccess: false, error: null }),
}));

afterEach(() => {
  cleanup();
  recommendationQueryCalls.length = 0;
});

describe('MarketplacePage', () => {
  it('submits backend-shaped RFQ and order payloads', async () => {
    const user = userEvent.setup();
    render(<MarketplacePage />);

    await user.click(screen.getAllByRole('button', { name: /add to rfq/i })[0]);
    await user.click(screen.getAllByRole('button', { name: /add to order/i })[0]);

    await user.click(screen.getAllByRole('button', { name: /^procurement$/i })[0]);
    expect(screen.getByDisplayValue('Herbal Tea')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /submit rfq/i }));
    expect(rfqMutate).toHaveBeenCalled();
    expect(rfqMutate.mock.calls[0][0]).toEqual({
      items: [{
        category: 'Beverages',
        description: 'Herbal Tea',
        quantity: 1,
        catalog_item_id: '11',
        supplier_profile_id: '42',
        unit_price: 125,
      }],
    });

    expect(screen.getByDisplayValue('42')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /create order/i }));
    expect(orderMutate).toHaveBeenCalled();
    expect(orderMutate.mock.calls[0][0]).toEqual({
      supplier_id: 42,
      items: [{ catalog_item_id: 11, quantity: 1 }],
      payment_terms: 'prepaid',
      finance_requested: false,
    });
  });

  it('updates recommendation urgency and resets pagination on filter changes', async () => {
    const user = userEvent.setup();
    render(<MarketplacePage />);

    expect(recommendationQueryCalls[0]).toEqual(expect.objectContaining({ urgency: 'HIGH' }));

    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/page 2 of 2/i)).toBeTruthy();

    await user.type(screen.getByLabelText(/query/i), 'tea');
    expect(screen.getByText(/page 1 of 2/i)).toBeTruthy();

    await user.click(screen.getByRole('combobox', { name: /recommendation urgency/i }));
    await user.click(await screen.findByRole('option', { name: /^Low$/i }));
    expect(recommendationQueryCalls[recommendationQueryCalls.length - 1]).toEqual(expect.objectContaining({ urgency: 'LOW' }));
  });

  it('shows validation messages for empty RFQ and invalid order submissions', async () => {
    const user = userEvent.setup();
    render(<MarketplacePage />);

    await user.click(screen.getByRole('button', { name: /^procurement$/i }));
    await user.click(screen.getByRole('button', { name: /submit rfq/i }));
    expect(screen.getByText(/add at least one valid rfq row before submitting/i)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /create order/i }));
    expect(screen.getByText(/enter a valid supplier id before creating an order/i)).toBeTruthy();
  });

  it('renders marketplace order details, tracking, and supplier onboarding data', async () => {
    const user = userEvent.setup();
    render(<MarketplacePage />);

    await user.click(screen.getAllByRole('button', { name: /^orders$/i })[0]);
    expect(screen.getAllByText(/PO-123/)[0]).toBeTruthy();
    await user.clear(screen.getByLabelText(/open order by id/i));
    await user.type(screen.getByLabelText(/open order by id/i), '501');
    expect(screen.getByText(/bluedart/i)).toBeTruthy();
    expect(screen.getByText(/track-1/i)).toBeTruthy();

    await user.click(screen.getAllByRole('button', { name: /^suppliers$/i })[0]);
    await user.clear(screen.getAllByLabelText(/supplier id/i)[0]);
    await user.type(screen.getAllByLabelText(/supplier id/i)[0], '42');
    expect(screen.getByText(/acme supplies/i)).toBeTruthy();
    expect(screen.getByText(/chai mix/i)).toBeTruthy();
  });
});
