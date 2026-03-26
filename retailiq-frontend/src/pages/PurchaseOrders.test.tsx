/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PurchaseOrdersPage from '@/pages/PurchaseOrders';

const mocks = vi.hoisted(() => ({
  addToast: vi.fn(),
  sendMutateAsync: vi.fn(),
  cancelMutateAsync: vi.fn(),
}));

vi.mock('@/stores/uiStore', () => ({
  uiStore: (selector: (state: { addToast: typeof mocks.addToast }) => unknown) => selector({ addToast: mocks.addToast }),
}));

vi.mock('@/hooks/purchaseOrders', () => ({
  usePurchaseOrders: () => ({
    data: [
      {
        id: 'po-1',
        supplier_id: 'supplier-1',
        status: 'DRAFT',
        expected_delivery_date: '2026-03-31',
        created_at: '2026-03-26T00:00:00Z',
      },
    ],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  usePurchaseOrderHydration: () => ({
    purchaseOrderDetails: {
      'po-1': {
        id: 'po-1',
        supplier_id: 'supplier-1',
        status: 'DRAFT',
        expected_delivery_date: '2026-03-31',
        notes: null,
        created_at: '2026-03-26T00:00:00Z',
        updated_at: '2026-03-26T00:00:00Z',
        items: [
          { line_item_id: 'line-1', product_id: 11, ordered_qty: 2, received_qty: 0, unit_price: 25 },
        ],
      },
    },
    isHydrating: false,
  }),
  useCancelPurchaseOrder: () => ({ mutateAsync: mocks.cancelMutateAsync, isPending: false }),
  useSendPurchaseOrder: () => ({ mutateAsync: mocks.sendMutateAsync, isPending: false }),
  canEditPurchaseOrder: () => true,
  canSendPurchaseOrder: () => false,
  canCancelPurchaseOrder: () => false,
  canConfirmPurchaseOrder: () => false,
  canReceivePurchaseOrder: () => false,
  getPurchaseOrderStatusColor: () => 'gray',
  getPurchaseOrderStatusText: () => 'Draft',
}));

vi.mock('@/hooks/suppliers', () => ({
  useSuppliers: () => ({
    data: [
      {
        id: 'supplier-1',
        name: 'Acme Supplies',
        contact_name: 'Ada Lovelace',
        email: 'ada@example.com',
        phone: '555-0101',
        payment_terms_days: 30,
        avg_lead_time_days: 7,
        fill_rate_90d: 98,
        price_change_6m_pct: 4.2,
      },
    ],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useSupplierHydration: () => ({
    supplierDetails: {
      'supplier-1': {
        id: 'supplier-1',
        name: 'Acme Supplies',
        contact: { name: 'Ada Lovelace', phone: '555-0101', email: 'ada@example.com', address: 'Main St' },
        payment_terms_days: 30,
        is_active: true,
        analytics: { avg_lead_time_days: 7, fill_rate_90d: 98 },
        sourced_products: [],
        recent_purchase_orders: [],
      },
    },
    isHydrating: false,
  }),
}));

describe('PurchaseOrdersPage', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders supplier names and totals from hydrated detail data', () => {
    render(
      <MemoryRouter>
        <PurchaseOrdersPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Acme Supplies')).toBeTruthy();
    expect(screen.getByText(/1 item .*50\.00/)).toBeTruthy();
  });
});
