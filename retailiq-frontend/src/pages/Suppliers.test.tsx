/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SuppliersPage from '@/pages/Suppliers';

const mocks = vi.hoisted(() => ({
  addToast: vi.fn(),
  deleteMutateAsync: vi.fn(),
}));

vi.mock('@/stores/uiStore', () => ({
  uiStore: (selector: (state: { addToast: typeof mocks.addToast }) => unknown) => selector({ addToast: mocks.addToast }),
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
        sourced_products: [
          { product_id: 11, name: 'Widget', quoted_price: 12.5, lead_time_days: 3 },
          { product_id: 12, name: 'Gadget', quoted_price: 5.0, lead_time_days: 2 },
          { product_id: 13, name: 'Thing', quoted_price: 9.0, lead_time_days: null },
        ],
        recent_purchase_orders: [],
      },
    },
    isHydrating: false,
  }),
  useDeleteSupplier: () => ({ mutateAsync: mocks.deleteMutateAsync, isPending: false }),
}));

describe('SuppliersPage', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders linked product counts from hydrated supplier detail data', () => {
    render(
      <MemoryRouter>
        <SuppliersPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('3 products')).toBeTruthy();
  });
});
