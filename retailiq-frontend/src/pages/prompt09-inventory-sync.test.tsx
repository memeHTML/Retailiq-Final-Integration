/* @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { authStore } from '@/stores/authStore';
import InventorySyncPage from '@/features/inventory/InventorySyncPage';

const batchUpload = vi.fn();
const queryClients: QueryClient[] = [];

vi.mock('@/hooks/offline', () => ({
  useOfflineSnapshotQuery: () => ({
    data: {
      snapshot: {
        generated_at: '2026-03-27T09:00:00Z',
        built_at: '2026-03-27T09:00:00Z',
        size_bytes: 2048,
        kpis: { today_revenue: 120000 },
        revenue_30d: [{ date: '2026-03-27', revenue: 120000 }],
        low_stock_products: [{ product_name: 'Tea', current_stock: 4 }],
      },
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/hooks/transactions', () => ({
  useCreateBatchTransactionMutation: () => ({
    mutateAsync: batchUpload,
    isPending: false,
  }),
}));

vi.mock('@/hooks/chain', () => ({
  useChainDashboardQuery: () => ({
    data: {
      total_stores: 3,
      total_revenue: 480000,
      total_transactions: 42,
      top_performing_stores: [],
      recent_transfers: [
        {
          transfer_id: 'TR-1',
          from_store_id: '1',
          to_store_id: '2',
          product_id: 'P-100',
          quantity: 6,
          status: 'PENDING',
          created_at: '2026-03-27T09:00:00Z',
        },
      ],
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useTransfersQuery: () => ({
    data: [
      {
        transfer_id: 'TR-1',
        from_store_id: '1',
        to_store_id: '2',
        product_id: 'P-100',
        quantity: 6,
        status: 'PENDING',
        created_at: '2026-03-27T09:00:00Z',
      },
    ],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

afterEach(() => {
  while (queryClients.length) {
    queryClients.pop()?.clear();
  }
});

describe('Prompt 09 inventory sync', () => {
  beforeEach(() => {
    authStore.setState({
      accessToken: 'token',
      refreshToken: 'refresh',
      user: {
        user_id: 1,
        role: 'owner',
        store_id: 1,
        mobile_number: '9999999999',
        full_name: 'Owner User',
        chain_group_id: 'chain-1',
        chain_role: 'CHAIN_OWNER',
      },
      isAuthenticated: true,
      role: 'owner',
    });
    vi.clearAllMocks();
  });

  it('renders the workspace and uploads batch data', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClients.push(queryClient);

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/inventory/sync']}>
          <Routes>
            <Route path="/inventory/sync" element={<InventorySyncPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('heading', { name: /^Inventory sync$/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /^Batch sync$/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /^Chain transfer visibility$/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Download Offline Snapshot/i })).toBeTruthy();

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(fileInput).toBeTruthy();

    const payload = {
      transactions: [
        {
          transaction_id: 'txn-100',
          timestamp: '2026-03-27T10:00:00Z',
          payment_mode: 'UPI',
          line_items: [{ product_id: 1, quantity: 2, selling_price: 100 }],
        },
      ],
    };

    await user.upload(fileInput as HTMLInputElement, new File([JSON.stringify(payload)], 'sync.json', { type: 'application/json' }));
    expect(await screen.findByText(/1 transactions ready/i)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /Upload Sync Data/i }));
    expect(batchUpload).toHaveBeenCalledWith(payload);
  });
});
