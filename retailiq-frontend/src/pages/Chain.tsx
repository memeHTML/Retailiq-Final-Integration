import { useEffect, useState } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import * as authApi from '@/api/auth';
import type { ChainComparisonRow, ChainTransfer, CreateChainGroupRequest } from '@/api/chain';
import { authStore } from '@/stores/authStore';
import { uiStore } from '@/stores/uiStore';
import {
  useAddStoreToChainMutation,
  useChainComparisonQuery,
  useChainDashboardQuery,
  useChainGroupQuery,
  useConfirmTransferMutation,
  useCreateChainGroupMutation,
  useCreateTransferMutation,
  useRemoveStoreFromChainMutation,
  useTransfersQuery,
  useUpdateChainGroupMutation,
} from '@/hooks/chain';
import { getStoredRefreshToken } from '@/utils/tokenStorage';
import { normalizeApiError } from '@/utils/errors';

type ChainTab = 'dashboard' | 'groups' | 'transfers' | 'compare';

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value);

async function refreshChainClaims(chainGroupId: string) {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    throw new Error('Refresh token unavailable. Please sign in again to load chain permissions.');
  }

  const refreshed = await authApi.refreshAccessToken({ refresh_token: refreshToken });
  if (!refreshed.access_token || !refreshed.refresh_token) {
    throw new Error('Could not refresh session after creating the chain group.');
  }

  authStore.getState().setTokens(refreshed.access_token, refreshed.refresh_token);

  const currentUser = authStore.getState().user;
  if (currentUser) {
    authStore.getState().setUser({
      ...currentUser,
      chain_group_id: chainGroupId,
      chain_role: 'CHAIN_OWNER',
    });
  }
}

export default function ChainPage() {
  const addToast = uiStore((state) => state.addToast);
  const user = authStore((state) => state.user);
  const chainId = user?.chain_group_id ?? '';
  const isChainOwner = user?.chain_role === 'CHAIN_OWNER';

  const [activeTab, setActiveTab] = useState<ChainTab>('dashboard');
  const [newGroupName, setNewGroupName] = useState('');
  const [groupNameDraft, setGroupNameDraft] = useState('');
  const [storeIdToAdd, setStoreIdToAdd] = useState('');
  const [transferForm, setTransferForm] = useState({
    from_store_id: '',
    to_store_id: '',
    product_id: '',
    quantity: '1',
    notes: '',
  });
  const [comparisonPeriod, setComparisonPeriod] = useState('today');

  const createGroupMutation = useCreateChainGroupMutation();
  const updateGroupMutation = useUpdateChainGroupMutation();
  const addStoreMutation = useAddStoreToChainMutation();
  const removeStoreMutation = useRemoveStoreFromChainMutation();
  const createTransferMutation = useCreateTransferMutation();
  const confirmTransferMutation = useConfirmTransferMutation();

  const groupQuery = useChainGroupQuery(chainId);
  const dashboardQuery = useChainDashboardQuery(chainId);
  const transfersQuery = useTransfersQuery(chainId);
  const comparisonQuery = useChainComparisonQuery(chainId, comparisonPeriod);

  useEffect(() => {
    if (groupQuery.data?.name) {
      setGroupNameDraft(groupQuery.data.name);
    }
  }, [groupQuery.data?.name]);

  const tabs: Array<{ key: ChainTab; label: string }> = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'groups', label: 'Groups' },
    { key: 'transfers', label: 'Transfers' },
    { key: 'compare', label: 'Compare' },
  ];

  const createChainGroup = async () => {
    const name = newGroupName.trim();
    if (!name) {
      addToast({ title: 'Name required', message: 'Enter a chain group name before continuing.', variant: 'warning' });
      return;
    }

    try {
      const response = await createGroupMutation.mutateAsync({ name } satisfies CreateChainGroupRequest);
      await refreshChainClaims(response.group_id);
      setNewGroupName('');
      addToast({ title: 'Chain group created', message: `${response.name} is now active for your account.`, variant: 'success' });
    } catch (error) {
      addToast({ title: 'Creation failed', message: normalizeApiError(error).message, variant: 'error' });
    }
  };

  const saveGroupName = async () => {
    if (!chainId) return;
    const name = groupNameDraft.trim();
    if (!name) {
      addToast({ title: 'Name required', message: 'Enter a group name before saving.', variant: 'warning' });
      return;
    }
    try {
      await updateGroupMutation.mutateAsync({ chainId, data: { name } });
      addToast({ title: 'Group updated', message: 'Chain group name saved.', variant: 'success' });
    } catch (error) {
      addToast({ title: 'Update failed', message: normalizeApiError(error).message, variant: 'error' });
    }
  };

  const addStore = async () => {
    if (!chainId) return;
    const storeId = Number(storeIdToAdd);
    if (!Number.isFinite(storeId) || storeId <= 0) {
      addToast({ title: 'Store ID required', message: 'Enter a valid numeric store ID.', variant: 'warning' });
      return;
    }
    try {
      await addStoreMutation.mutateAsync({ chainId, data: { store_id: storeId } });
      setStoreIdToAdd('');
      addToast({ title: 'Store added', message: 'The store was added to the chain group.', variant: 'success' });
    } catch (error) {
      addToast({ title: 'Store add failed', message: normalizeApiError(error).message, variant: 'error' });
    }
  };

  const removeStore = async (storeId: number) => {
    if (!chainId) return;
    try {
      await removeStoreMutation.mutateAsync({ chainId, storeId });
      addToast({ title: 'Store removed', message: 'The store was removed from the chain group.', variant: 'success' });
    } catch (error) {
      addToast({ title: 'Remove failed', message: normalizeApiError(error).message, variant: 'error' });
    }
  };

  const submitTransfer = async () => {
    if (!chainId) return;
    const payload = {
      from_store_id: Number(transferForm.from_store_id),
      to_store_id: Number(transferForm.to_store_id),
      product_id: Number(transferForm.product_id),
      quantity: Number(transferForm.quantity),
      notes: transferForm.notes.trim() || undefined,
    };
    if ([payload.from_store_id, payload.to_store_id, payload.product_id, payload.quantity].some((value) => !Number.isFinite(value) || value <= 0)) {
      addToast({ title: 'Invalid transfer', message: 'Fill in valid source, destination, product, and quantity values.', variant: 'warning' });
      return;
    }
    try {
      await createTransferMutation.mutateAsync({ chainId, data: payload });
      setTransferForm({ from_store_id: '', to_store_id: '', product_id: '', quantity: '1', notes: '' });
      addToast({ title: 'Transfer created', message: 'The transfer was added to the chain group.', variant: 'success' });
    } catch (error) {
      addToast({ title: 'Transfer failed', message: normalizeApiError(error).message, variant: 'error' });
    }
  };

  const confirmTransfer = async (transferId: string) => {
    if (!chainId) return;
    try {
      await confirmTransferMutation.mutateAsync({ chainId, transferId });
      addToast({ title: 'Transfer confirmed', message: 'The backend marked this transfer as actioned.', variant: 'success' });
    } catch (error) {
      addToast({ title: 'Confirmation failed', message: normalizeApiError(error).message, variant: 'error' });
    }
  };

  if (!chainId) {
    return (
      <PageFrame title="Chain Management" subtitle="Create a chain group, then add stores and compare performance.">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader><CardTitle>Create Chain Group</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input label="Chain group name" value={newGroupName} onChange={(event) => setNewGroupName(event.target.value)} placeholder="RetailIQ North Region" />
              <Button onClick={() => void createChainGroup()} loading={createGroupMutation.isPending}>Create group</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>What happens next</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <p>1. The backend creates the chain group and links you as the owner.</p>
              <p>2. Your session is refreshed so chain-only endpoints start working immediately.</p>
              <p>3. You can then add member stores and use the dashboard, transfers, and compare tabs.</p>
            </CardContent>
          </Card>
        </div>
      </PageFrame>
    );
  }

  if (!isChainOwner) {
    return (
      <PageFrame title="Chain Management">
        <EmptyState title="Chain owner access required" body="This page currently supports chain-owner management flows only." />
      </PageFrame>
    );
  }

  if (groupQuery.isLoading || dashboardQuery.isLoading) {
    return (
      <PageFrame title="Chain Management">
        <SkeletonLoader variant="rect" height={320} />
      </PageFrame>
    );
  }

  if (groupQuery.isError || dashboardQuery.isError) {
    return (
      <PageFrame title="Chain Management">
        <ErrorState error={normalizeApiError(groupQuery.error ?? dashboardQuery.error)} />
      </PageFrame>
    );
  }

  const chainGroup = groupQuery.data!;
  const dashboard = dashboardQuery.data!;

  const transferColumns: Column<ChainTransfer>[] = [
    { key: 'id', header: 'Transfer', render: (row) => row.id },
    { key: 'route', header: 'Route', render: (row) => `${row.from_store} -> ${row.to_store}` },
    { key: 'product', header: 'Product', render: (row) => row.product },
    { key: 'qty', header: 'Qty', render: (row) => row.qty.toLocaleString() },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={row.status === 'ACTIONED' ? 'success' : 'warning'}>{row.status}</Badge> },
    { key: 'created_at', header: 'Created', render: (row) => row.created_at ? new Date(row.created_at).toLocaleString() : 'N/A' },
    { key: 'action', header: 'Action', render: (row) => row.status === 'PENDING' ? <Button variant="secondary" size="sm" onClick={() => void confirmTransfer(row.id)}>Confirm</Button> : null },
  ];

  const compareColumns: Column<ChainComparisonRow>[] = [
    { key: 'store_id', header: 'Store', render: (row) => row.store_id },
    { key: 'revenue', header: 'Revenue', render: (row) => formatMoney(row.revenue) },
    { key: 'profit', header: 'Profit', render: (row) => formatMoney(row.profit) },
    { key: 'relative_to_avg', header: 'Relative', render: (row) => row.relative_to_avg },
  ];

  return (
    <PageFrame title={chainGroup.name} subtitle="Create chain membership, review performance, and monitor transfer opportunities.">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Chain Group</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[1fr_auto]">
            <Input label="Group name" value={groupNameDraft} onChange={(event) => setGroupNameDraft(event.target.value)} />
            <div className="flex items-end gap-2">
              <Button variant="secondary" onClick={() => void saveGroupName()} loading={updateGroupMutation.isPending}>Save name</Button>
            </div>
          </CardContent>
        </Card>

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`border-b-2 px-1 py-2 text-sm font-medium capitalize ${
                  activeTab === tab.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card><CardHeader><CardTitle className="text-sm text-gray-500">Stores</CardTitle></CardHeader><CardContent><div data-testid="chain-store-count" className="text-2xl font-semibold">{chainGroup.member_store_ids.length}</div></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-sm text-gray-500">Revenue Today</CardTitle></CardHeader><CardContent><div className="text-2xl font-semibold">{formatMoney(dashboard.total_revenue_today)}</div></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-sm text-gray-500">Open Alerts</CardTitle></CardHeader><CardContent><div className="text-2xl font-semibold">{dashboard.total_open_alerts.toLocaleString()}</div></CardContent></Card>
            </div>

            <Card>
              <CardHeader><CardTitle>Top Performing Stores</CardTitle></CardHeader>
              <CardContent>
                {dashboard.per_store_today.length === 0 ? (
                  <EmptyState title="No chain activity yet" body="Add stores to start receiving aggregated chain performance." />
                ) : (
                  <DataTable
                    columns={[
                      { key: 'name', header: 'Store', render: (row) => row.name },
                      { key: 'store_id', header: 'Store ID', render: (row) => row.store_id },
                      { key: 'revenue', header: 'Revenue', render: (row) => formatMoney(row.revenue) },
                      { key: 'transactions', header: 'Transactions', render: (row) => row.transaction_count.toLocaleString() },
                      { key: 'alerts', header: 'Alerts', render: (row) => row.alert_count.toLocaleString() },
                    ]}
                    data={dashboard.per_store_today}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Transfer Suggestions</CardTitle></CardHeader>
              <CardContent>
                {dashboard.transfer_suggestions.length === 0 ? (
                  <EmptyState title="No transfer suggestions" body="The backend did not return pending transfer opportunities." />
                ) : (
                  <DataTable
                    columns={[
                      { key: 'id', header: 'Suggestion', render: (row) => row.id },
                      { key: 'route', header: 'Route', render: (row) => `${row.from_store} -> ${row.to_store}` },
                      { key: 'product', header: 'Product', render: (row) => row.product },
                      { key: 'qty', header: 'Qty', render: (row) => row.qty.toLocaleString() },
                      { key: 'reason', header: 'Reason', render: (row) => row.reason },
                    ]}
                    data={dashboard.transfer_suggestions}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Member Stores</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {chainGroup.member_store_ids.length === 0 ? (
                  <EmptyState title="No stores yet" body="Use the add-store flow below to build this chain group." />
                ) : (
                  <DataTable
                    columns={[
                      { key: 'store_id', header: 'Store ID', render: (row) => row },
                      { key: 'action', header: 'Action', render: (row) => <Button variant="destructive" size="sm" onClick={() => void removeStore(row)}>Remove</Button> },
                    ]}
                    data={chainGroup.member_store_ids}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Add Store To Chain</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-[1fr_auto]">
                <Input label="Store ID" value={storeIdToAdd} onChange={(event) => setStoreIdToAdd(event.target.value)} placeholder="Existing store ID" />
                <div className="flex items-end">
                  <Button onClick={() => void addStore()} loading={addStoreMutation.isPending}>Add store</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'transfers' && (
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Create Transfer</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <Input label="From store" value={transferForm.from_store_id} onChange={(event) => setTransferForm((form) => ({ ...form, from_store_id: event.target.value }))} />
                <Input label="To store" value={transferForm.to_store_id} onChange={(event) => setTransferForm((form) => ({ ...form, to_store_id: event.target.value }))} />
                <Input label="Product ID" value={transferForm.product_id} onChange={(event) => setTransferForm((form) => ({ ...form, product_id: event.target.value }))} />
                <Input label="Quantity" type="number" value={transferForm.quantity} onChange={(event) => setTransferForm((form) => ({ ...form, quantity: event.target.value }))} />
                <Input label="Notes" value={transferForm.notes} onChange={(event) => setTransferForm((form) => ({ ...form, notes: event.target.value }))} />
              </CardContent>
              <CardContent>
                <Button onClick={() => void submitTransfer()} loading={createTransferMutation.isPending}>Create transfer</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Transfers</CardTitle></CardHeader>
              <CardContent>
                {transfersQuery.isLoading ? (
                  <SkeletonLoader variant="rect" height={220} />
                ) : transfersQuery.isError ? (
                  <ErrorState error={normalizeApiError(transfersQuery.error)} onRetry={() => void transfersQuery.refetch()} />
                ) : transfersQuery.data?.length ? (
                  <DataTable columns={transferColumns} data={transfersQuery.data} emptyMessage="No transfer records yet." />
                ) : (
                  <EmptyState title="No transfers yet" body="Create a transfer to see it listed here." />
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'compare' && (
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Compare stores</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-[1fr_auto]">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-gray-700">Period</label>
                  <Select value={comparisonPeriod} onValueChange={setComparisonPeriod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="month">Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button variant="secondary" onClick={() => void comparisonQuery.refetch()}>Refresh</Button>
                </div>
              </CardContent>
            </Card>

            {comparisonQuery.isLoading ? (
              <SkeletonLoader variant="rect" height={220} />
            ) : comparisonQuery.isError ? (
              <ErrorState error={normalizeApiError(comparisonQuery.error)} onRetry={() => void comparisonQuery.refetch()} />
            ) : comparisonQuery.data?.length ? (
              <Card>
                <CardHeader><CardTitle>Comparison results</CardTitle></CardHeader>
                <CardContent>
                  <DataTable columns={compareColumns} data={comparisonQuery.data} emptyMessage="No comparison data available." />
                </CardContent>
              </Card>
            ) : (
              <EmptyState title="No comparison data" body="The selected comparison period returned no rows." />
            )}
          </div>
        )}
      </div>
    </PageFrame>
  );
}
