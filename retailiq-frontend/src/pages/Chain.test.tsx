/* @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';
import ChainPage from './Chain';
import { authStore } from '@/stores/authStore';

const createGroupMutateAsync = vi.fn(async (payload: { name: string }) => ({ group_id: 'group-9', name: payload.name }));
const updateGroupMutateAsync = vi.fn(async () => ({ group_id: 'group-1', name: 'North Chain', description: null, owner_user_id: 1, created_at: null, updated_at: null, member_store_ids: [10, 11] }));
const addStoreMutateAsync = vi.fn(async () => ({ membership_id: 'm-1' }));
const removeStoreMutateAsync = vi.fn(async () => ({ store_id: 10, removed: true }));
const createTransferMutateAsync = vi.fn(async () => ({ id: 't-1', from_store: 10, to_store: 11, product: 501, qty: 5, reason: 'Manual transfer created from chain console', status: 'PENDING', created_at: '2026-03-27T00:00:00Z' }));
const confirmTransferMutateAsync = vi.fn(async () => ({ message: 'Transfer confirmed', id: 't-1' }));
const defaultDashboardFixture = {
  total_revenue_today: 45000,
  best_store: { store_id: 11, name: 'Store 11' },
  worst_store: { store_id: 10, name: 'Store 10' },
  total_open_alerts: 2,
  per_store_today: [
    { store_id: 10, name: 'Store 10', revenue: 15000, transaction_count: 40, alert_count: 1 },
    { store_id: 11, name: 'Store 11', revenue: 30000, transaction_count: 80, alert_count: 1 },
  ],
  transfer_suggestions: [{ id: 's-1', from_store: 11, to_store: 10, product: 501, qty: 5, reason: 'Surplus identified in sibling store' }],
};
let chainDashboardFixture = defaultDashboardFixture;

vi.mock('@/api/auth', () => ({
  refreshAccessToken: vi.fn(async () => ({ access_token: 'new-access', refresh_token: 'new-refresh' })),
}));

vi.mock('@/hooks/chain', () => ({
  useChainGroupQuery: (chainId: string) => ({
    data: chainId
      ? { group_id: chainId, name: 'North Chain', description: null, owner_user_id: 1, created_at: '2026-03-27T00:00:00Z', updated_at: '2026-03-27T00:00:00Z', member_store_ids: [10, 11] }
      : undefined,
    isLoading: false,
    isError: false,
    error: null,
  }),
  useChainDashboardQuery: (chainId: string) => ({
    data: chainId ? chainDashboardFixture : undefined,
    isLoading: false,
    isError: false,
    error: null,
  }),
  useTransfersQuery: () => ({
    data: [
      { id: 't-1', from_store: 10, to_store: 11, product: 501, qty: 5, reason: 'Manual transfer created from chain console', status: 'PENDING', created_at: '2026-03-27T00:00:00Z' },
      { id: 't-2', from_store: 11, to_store: 10, product: 601, qty: 2, reason: 'Transferred already', status: 'ACTIONED', created_at: '2026-03-26T00:00:00Z' },
    ],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useChainComparisonQuery: (_chainId: string, period: string) => ({
    data: period
      ? [
          { store_id: 10, revenue: 15000, profit: 5000, relative_to_avg: 'below' },
          { store_id: 11, revenue: 30000, profit: 9000, relative_to_avg: 'above' },
        ]
      : undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useCreateChainGroupMutation: () => ({ mutateAsync: createGroupMutateAsync, isPending: false }),
  useUpdateChainGroupMutation: () => ({ mutateAsync: updateGroupMutateAsync, isPending: false }),
  useAddStoreToChainMutation: () => ({ mutateAsync: addStoreMutateAsync, isPending: false }),
  useRemoveStoreFromChainMutation: () => ({ mutateAsync: removeStoreMutateAsync, isPending: false }),
  useCreateTransferMutation: () => ({ mutateAsync: createTransferMutateAsync, isPending: false }),
  useConfirmTransferMutation: () => ({ mutateAsync: confirmTransferMutateAsync, isPending: false }),
}));

afterEach(() => {
  cleanup();
  chainDashboardFixture = defaultDashboardFixture;
});

describe('ChainPage', () => {
  beforeEach(() => {
    authStore.getState().clearAuth();
    authStore.getState().setUser({
      user_id: 1,
      role: 'owner',
      store_id: 10,
      full_name: 'Owner User',
      chain_group_id: 'group-1',
      chain_role: 'CHAIN_OWNER',
    });
  });

  it('renders dashboard, group management, transfers, compare, and confirm actions', async () => {
    const user = userEvent.setup();
    render(<ChainPage />);

    expect(screen.getByText('North Chain')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /groups/i }));
    await user.clear(screen.getByLabelText(/group name/i));
    await user.type(screen.getByLabelText(/group name/i), 'North Chain Updated');
    await user.click(screen.getByRole('button', { name: /save name/i }));
    expect(updateGroupMutateAsync).toHaveBeenCalledWith({ chainId: 'group-1', data: { name: 'North Chain Updated' } });

    await user.type(screen.getByLabelText(/store id/i), '12');
    await user.click(screen.getByRole('button', { name: /add store/i }));
    expect(addStoreMutateAsync).toHaveBeenCalledWith({ chainId: 'group-1', data: { store_id: 12 } });
    await user.click(screen.getAllByRole('button', { name: /remove/i })[0]);
    expect(removeStoreMutateAsync).toHaveBeenCalledWith({ chainId: 'group-1', storeId: 10 });

    await user.click(screen.getByRole('button', { name: /transfers/i }));
    await user.clear(screen.getByLabelText(/from store/i));
    await user.type(screen.getByLabelText(/from store/i), '10');
    await user.clear(screen.getByLabelText(/to store/i));
    await user.type(screen.getByLabelText(/to store/i), '11');
    await user.clear(screen.getByLabelText(/product id/i));
    await user.type(screen.getByLabelText(/product id/i), '501');
    await user.clear(screen.getByLabelText(/quantity/i));
    await user.type(screen.getByLabelText(/quantity/i), '5');
    await user.click(screen.getByRole('button', { name: /create transfer/i }));
    expect(createTransferMutateAsync).toHaveBeenCalledWith({
      chainId: 'group-1',
      data: { from_store_id: 10, to_store_id: 11, product_id: 501, quantity: 5, notes: undefined },
    });
    await user.click(screen.getByRole('button', { name: /confirm/i }));
    expect(confirmTransferMutateAsync).toHaveBeenCalledWith({ chainId: 'group-1', transferId: 't-1' });

    await user.click(screen.getByRole('button', { name: /compare/i }));
    expect(screen.getByText(/30,000\.00/)).toBeTruthy();
    expect(screen.getByText(/above/i)).toBeTruthy();
  });

  it('creates a chain group when no chain exists and refreshes the authenticated claims', async () => {
    const { refreshAccessToken } = await import('@/api/auth');
    authStore.getState().clearAuth();
    authStore.getState().setUser({
      user_id: 1,
      role: 'owner',
      store_id: 10,
      full_name: 'Owner User',
    });

    window.localStorage.setItem('retailiq_refresh_token', 'refresh-1');
    const user = userEvent.setup();
    render(<ChainPage />);

    await user.clear(screen.getByLabelText(/chain group name/i));
    await user.type(screen.getByLabelText(/chain group name/i), 'North Region');
    await user.click(screen.getByRole('button', { name: /create group/i }));

    expect(createGroupMutateAsync).toHaveBeenCalledWith({ name: 'North Region' });
    expect(refreshAccessToken).toHaveBeenCalled();
    expect(authStore.getState().refreshToken).toBe('new-refresh');
    expect(authStore.getState().user?.chain_group_id).toBe('group-9');
    expect(authStore.getState().user?.chain_role).toBe('CHAIN_OWNER');
  });

  it('keeps store count stable when revenue is zero', () => {
    chainDashboardFixture = {
      ...defaultDashboardFixture,
      total_revenue_today: 0,
    };

    render(<ChainPage />);

    expect(screen.getByTestId('chain-store-count').textContent).toBe('2');
  });
});
