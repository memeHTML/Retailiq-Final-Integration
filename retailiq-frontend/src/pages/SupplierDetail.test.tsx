/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SupplierDetailPage from '@/pages/SupplierDetail';

const mocks = vi.hoisted(() => ({
  addToast: vi.fn(),
  linkMutateAsync: vi.fn(),
  updateMutateAsync: vi.fn(),
  unlinkMutateAsync: vi.fn(),
}));

vi.mock('@/stores/uiStore', () => ({
  uiStore: (selector: (state: { addToast: typeof mocks.addToast }) => unknown) => selector({ addToast: mocks.addToast }),
}));

vi.mock('@/hooks/inventory', () => ({
  useProductsQuery: () => ({
    data: {
      data: [
        { product_id: 11, name: 'Widget', sku_code: 'W-11' },
        { product_id: 12, name: 'Gadget', sku_code: 'G-12' },
      ],
    },
  }),
}));

vi.mock('@/hooks/suppliers', () => ({
  useSupplier: () => ({
    data: {
      id: 'supplier-1',
      name: 'Acme Supplies',
      contact: { name: 'Ada Lovelace', phone: '555-0101', email: 'ada@example.com', address: 'Main St' },
      payment_terms_days: 30,
      is_active: true,
      analytics: { avg_lead_time_days: 7, fill_rate_90d: 98 },
      sourced_products: [{ product_id: 11, name: 'Widget', quoted_price: 12.5, lead_time_days: 3 }],
      recent_purchase_orders: [],
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useLinkSupplierProduct: () => ({ mutateAsync: mocks.linkMutateAsync, isPending: false }),
  useUpdateSupplierProductLink: () => ({ mutateAsync: mocks.updateMutateAsync, isPending: false }),
  useUnlinkSupplierProduct: () => ({ mutateAsync: mocks.unlinkMutateAsync, isPending: false }),
}));

describe('SupplierDetailPage', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('uses the update mutation for existing links without exposing preferred checkbox in edit mode', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/suppliers/supplier-1']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/suppliers/:supplierId" element={<SupplierDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /products/i }));
    await user.click(screen.getByRole('button', { name: /edit link/i }));

    expect(screen.queryByRole('checkbox', { name: /preferred supplier/i })).toBeNull();

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(mocks.updateMutateAsync).toHaveBeenCalledWith({
      supplierId: 'supplier-1',
      productId: 11,
      payload: {
        quoted_price: 12.5,
        lead_time_days: 3,
      },
    });
    expect(mocks.linkMutateAsync).not.toHaveBeenCalled();
  });
});
