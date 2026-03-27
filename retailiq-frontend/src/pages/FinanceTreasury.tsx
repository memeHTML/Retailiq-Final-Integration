import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  useFinancialAccountsQuery,
  useTreasuryBalanceQuery,
  useTreasuryConfigQuery,
  useTreasuryTransactionsQuery,
  useUpdateTreasuryConfigMutation,
} from '@/hooks/finance';
import { routes } from '@/routes/routes';
import { formatCurrency } from '@/utils/numbers';
import { formatDate } from '@/utils/dates';
import { normalizeApiError } from '@/utils/errors';
import type { TreasuryTransaction } from '@/api/finance';

export default function FinanceTreasuryPage() {
  const navigate = useNavigate();
  const accountsQuery = useFinancialAccountsQuery();
  const balanceQuery = useTreasuryBalanceQuery();
  const configQuery = useTreasuryConfigQuery();
  const transactionsQuery = useTreasuryTransactionsQuery();
  const updateConfigMutation = useUpdateTreasuryConfigMutation();

  const [form, setForm] = useState({
    auto_transfer_enabled: false,
    daily_transfer_limit: '0',
  });

  useEffect(() => {
    if (configQuery.data) {
      setForm({
        auto_transfer_enabled: configQuery.data.auto_transfer_enabled,
        daily_transfer_limit: String(configQuery.data.daily_transfer_limit ?? 0),
      });
    }
  }, [configQuery.data]);

  const blockingError = accountsQuery.error ?? balanceQuery.error ?? configQuery.error ?? transactionsQuery.error;
  if (blockingError) {
    return (
      <PageFrame title="Treasury" subtitle="Treasury controls and history from `/api/v2/finance/treasury/*`.">
        <ErrorState error={normalizeApiError(blockingError)} />
      </PageFrame>
    );
  }

  const isLoading = accountsQuery.isLoading || balanceQuery.isLoading || configQuery.isLoading || transactionsQuery.isLoading;
  const transactions = transactionsQuery.data ?? [];
  const accounts = accountsQuery.data ?? [];

  const transactionColumns: Column<TreasuryTransaction>[] = [
    { key: 'id', header: 'Transaction', render: (txn) => txn.id },
    { key: 'type', header: 'Type', render: (txn) => <Badge variant={txn.type === 'TRANSFER_OUT' ? 'warning' : 'success'}>{txn.type}</Badge> },
    { key: 'amount', header: 'Amount', render: (txn) => formatCurrency(txn.amount) },
    { key: 'status', header: 'Status', render: (txn) => <Badge variant={txn.status === 'COMPLETED' ? 'success' : txn.status === 'FAILED' ? 'danger' : 'secondary'}>{txn.status}</Badge> },
    { key: 'description', header: 'Description', render: (txn) => txn.description },
    { key: 'created_at', header: 'Created', render: (txn) => formatDate(txn.created_at) },
  ];

  const saveConfig = async () => {
    await updateConfigMutation.mutateAsync({
      auto_transfer_enabled: form.auto_transfer_enabled,
      daily_transfer_limit: Number(form.daily_transfer_limit),
    });
  };

  return (
    <PageFrame
      title="Treasury"
      subtitle="Review treasury balances, sweep settings, and treasury transaction history."
      actions={
        <>
          <Button variant="secondary" size="sm" onClick={() => navigate(routes.financeAccounts)}>Accounts</Button>
          <Button variant="secondary" size="sm" onClick={() => navigate(routes.financeCreditScore)}>Credit score</Button>
          <Button variant="secondary" size="sm" onClick={() => navigate(routes.financeLoans)}>Loans</Button>
        </>
      }
    >
      {isLoading ? (
        <div className="space-y-6">
          <SkeletonLoader variant="rect" height={180} />
          <SkeletonLoader variant="rect" height={280} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium text-gray-500">Available balance</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-semibold">{formatCurrency(balanceQuery.data?.available_balance ?? 0)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium text-gray-500">Total balance</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-semibold">{formatCurrency(balanceQuery.data?.total_balance ?? balanceQuery.data?.available_balance ?? 0)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium text-gray-500">Reserved amount</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-semibold">{formatCurrency(balanceQuery.data?.reserved_amount ?? 0)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium text-gray-500">Yield</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{balanceQuery.data?.yield_bps ?? 0} bps</div>
                <div className="text-sm text-gray-500">{balanceQuery.data?.currency ?? 'INR'}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Sweep settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.auto_transfer_enabled}
                    onChange={(event) => setForm((current) => ({ ...current, auto_transfer_enabled: event.target.checked }))}
                  />
                  Enable auto sweep
                </label>
                <Input
                  label="Daily transfer limit"
                  type="number"
                  value={form.daily_transfer_limit}
                  onChange={(event) => setForm((current) => ({ ...current, daily_transfer_limit: event.target.value }))}
                />
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  The backend stores sweep rules through the treasury sweep-config endpoint. The current strategy is {configQuery.data?.strategy ?? 'OFF'}.
                </div>
                <Button onClick={() => void saveConfig()} loading={updateConfigMutation.isPending}>Save sweep settings</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Linked accounts</CardTitle></CardHeader>
              <CardContent>
                {accounts.length ? (
                  <div className="space-y-3">
                    {accounts.map((account) => (
                      <div key={String(account.id)} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
                        <div>
                          <div className="font-medium">{account.name}</div>
                          <div className="text-sm text-gray-500">{account.type}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(account.balance)}</div>
                          <div className="text-sm text-gray-500">{account.currency}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No linked accounts" body="The backend did not return any finance accounts for this store." />
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Treasury transactions</CardTitle></CardHeader>
            <CardContent>
              {transactions.length ? (
                <DataTable columns={transactionColumns} data={transactions} emptyMessage="No treasury transactions available." />
              ) : (
                <EmptyState title="No treasury transactions" body="Treasury activity will appear here once the backend records sweep events and transfers." />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </PageFrame>
  );
}
