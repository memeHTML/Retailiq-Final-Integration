/* @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePurchaseOrderHydration } from '@/hooks/purchaseOrders';

const mocks = vi.hoisted(() => ({
  getPurchaseOrder: vi.fn(),
}));

vi.mock('@/api/purchaseOrders', async () => {
  const actual = await vi.importActual<typeof import('@/api/purchaseOrders')>('@/api/purchaseOrders');
  return {
    ...actual,
    getPurchaseOrder: mocks.getPurchaseOrder,
  };
});

describe('usePurchaseOrderHydration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prefetches missing purchase order details and returns hydrated cache data', async () => {
    mocks.getPurchaseOrder.mockResolvedValue({
      id: 'po-1',
      supplier_id: 'supplier-1',
      status: 'DRAFT',
      expected_delivery_date: '2026-03-31',
      notes: null,
      created_at: '2026-03-26T00:00:00Z',
      updated_at: '2026-03-26T00:00:00Z',
      items: [{ line_item_id: 'line-1', product_id: 11, ordered_qty: 2, received_qty: 0, unit_price: 25 }],
    });

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => usePurchaseOrderHydration(['po-1']), { wrapper });

    await waitFor(() => expect(result.current.isHydrating).toBe(false));
    await waitFor(() => expect(result.current.purchaseOrderDetails['po-1']?.items.length).toBe(1));
    expect(mocks.getPurchaseOrder).toHaveBeenCalledWith('po-1');
  });
});
