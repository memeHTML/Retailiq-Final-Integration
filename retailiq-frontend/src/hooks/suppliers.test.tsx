/* @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSupplierHydration } from '@/hooks/suppliers';

const mocks = vi.hoisted(() => ({
  getSupplier: vi.fn(),
}));

vi.mock('@/api/suppliers', async () => {
  const actual = await vi.importActual<typeof import('@/api/suppliers')>('@/api/suppliers');
  return {
    ...actual,
    getSupplier: mocks.getSupplier,
  };
});

describe('useSupplierHydration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prefetches missing supplier details and returns hydrated cache data', async () => {
    mocks.getSupplier.mockResolvedValue({
      id: 'supplier-1',
      name: 'Acme Supplies',
      contact: { name: 'Ada', phone: '555', email: 'ada@example.com', address: 'Main St' },
      payment_terms_days: 30,
      is_active: true,
      analytics: { avg_lead_time_days: 7, fill_rate_90d: 98 },
      sourced_products: [{ product_id: 11, name: 'Widget', quoted_price: 12.5, lead_time_days: 3 }],
      recent_purchase_orders: [],
    });

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useSupplierHydration(['supplier-1']), { wrapper });

    await waitFor(() => expect(result.current.isHydrating).toBe(false));
    await waitFor(() => expect(result.current.supplierDetails['supplier-1']?.name).toBe('Acme Supplies'));
    expect(mocks.getSupplier).toHaveBeenCalledWith('supplier-1');
  });
});
