import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Select } from '@/components/ui/Select';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useFinancialAccountsQuery, useLedgerEntriesQuery } from '@/hooks/finance';
import { routes } from '@/routes/routes';
import { formatCurrency } from '@/utils/numbers';
import { formatDate } from '@/utils/dates';
import { normalizeApiError } from '@/utils/errors';
import type { FinancialAccount, LedgerEntry } from '@/api/finance';

export default function FinanceAccountsPage() {
  const navigate = useNavigate();
  const accountsQuery = useFinancialAccountsQuery();
  const [selectedAccountId, setSelectedAccountId] = useState('');

  useEffect(() => {
    if (!selectedAccountId && accountsQuery.data?.length) {
      setSelectedAccountId(String(accountsQuery.data[0].id));
    }
  }, [accountsQuery.data, selectedAccountId]);

  const selectedAccount = useMemo(
    () => accountsQuery.data?.find((account) => String(account.id) === selectedAccountId) ?? accountsQuery.data?.[0],
    [accountsQuery.data, selectedAccountId],
  );

  const ledgerQuery = useLedgerEntriesQuery(selectedAccount ? String(selectedAccount.id) : undefined);

  if (accountsQuery.error || ledgerQuery.error) {
    return (
      <PageFrame title="Accounts" subtitle="Financial accounts and selected ledger preview.">
        <ErrorState error={normalizeApiError(accountsQuery.error ?? ledgerQuery.error)} />
      </PageFrame>
    );
  }

  const accounts = accountsQuery.data ?? [];
  const ledgerEntries = ledgerQuery.data ?? [];

  const accountColumns: Column<FinancialAccount>[] = [
    { key: 'name', header: 'Account', render: (account) => account.name },
    { key: 'id', header: 'ID', render: (account) => account.id },
    { key: 'type', header: 'Type', render: (account) => <Badge variant="secondary">{account.type}</Badge> },
    { key: 'balance', header: 'Balance', render: (account) => formatCurrency(account.balance) },
    { key: 'currency', header: 'Currency', render: (account) => account.currency },
    { key: 'is_active', header: 'Status', render: (account) => <Badge variant={account.is_active ? 'success' : 'secondary'}>{account.is_active ? 'Active' : 'Inactive'}</Badge> },
  ];

  const ledgerColumns: Column<LedgerEntry>[] = [
    { key: 'id', header: 'Entry', render: (entry) => entry.id },
    { key: 'created_at', header: 'Created', render: (entry) => formatDate(entry.created_at) },
    { key: 'entry_type', header: 'Type', render: (entry) => <Badge variant={entry.entry_type === 'DEBIT' ? 'warning' : 'success'}>{entry.entry_type}</Badge> },
    { key: 'amount', header: 'Amount', render: (entry) => formatCurrency(entry.amount) },
    { key: 'balance_after', header: 'Balance after', render: (entry) => formatCurrency(entry.balance_after) },
    { key: 'description', header: 'Description', render: (entry) => entry.description },
  ];

  return (
    <PageFrame
      title="Accounts"
      subtitle="Track merchant finance accounts and preview ledger activity."
      actions={
        <>
          <Button variant="secondary" size="sm" onClick={() => navigate(routes.financeLedger)}>Ledger</Button>
          <Button variant="secondary" size="sm" onClick={() => navigate(routes.financeTreasury)}>Treasury</Button>
          <Button variant="secondary" size="sm" onClick={() => navigate(routes.financeCreditScore)}>Credit score</Button>
        </>
      }
    >
      {accountsQuery.isLoading ? (
        <div className="space-y-6">
          <SkeletonLoader variant="rect" height={180} />
          <SkeletonLoader variant="rect" height={320} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium text-gray-500">Accounts</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-semibold">{accounts.length}</div></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium text-gray-500">Total balance</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-semibold">{formatCurrency(accounts.reduce((sum, account) => sum + Number(account.balance ?? 0), 0))}</div></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium text-gray-500">Selected account</CardTitle></CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">{selectedAccount?.name ?? 'All accounts'}</div>
                <div className="text-sm text-gray-500">{selectedAccount ? `${selectedAccount.type} · ${formatCurrency(selectedAccount.balance)}` : 'Select an account to preview its ledger.'}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Select an account</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <label className="space-y-2 text-sm font-medium text-gray-700">
                <span>Account</span>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={selectedAccountId}
                  onChange={(event) => setSelectedAccountId(event.target.value)}
                >
                  {accounts.map((account) => (
                    <option key={String(account.id)} value={String(account.id)}>
                      {account.name} ({account.type})
                    </option>
                  ))}
                </select>
              </label>
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                The backend returns account id, type, and balance. Ledger rows below provide the detailed entry history.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Accounts table</CardTitle></CardHeader>
            <CardContent>
              {accounts.length ? <DataTable columns={accountColumns} data={accounts} emptyMessage="No finance accounts returned." /> : (
                <EmptyState title="No accounts" body="The backend did not return any finance accounts for this store." />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Ledger preview</CardTitle></CardHeader>
            <CardContent>
              {ledgerEntries.length ? <DataTable columns={ledgerColumns} data={ledgerEntries} emptyMessage="No ledger entries available." /> : (
                <EmptyState title="No ledger entries" body="Select a different account or wait for the backend to record ledger activity." />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </PageFrame>
  );
}
