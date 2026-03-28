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
import { formatDate } from '@/utils/dates';
import { formatCurrency } from '@/utils/numbers';
import { normalizeApiError } from '@/utils/errors';
import type { LedgerEntry } from '@/api/finance';

export default function FinanceLedgerPage() {
  const navigate = useNavigate();
  const [accountId, setAccountId] = useState('');
  const accountsQuery = useFinancialAccountsQuery();
  const ledgerQuery = useLedgerEntriesQuery(accountId || undefined);

  useEffect(() => {
    if (!accountId && accountsQuery.data?.length) {
      setAccountId(String(accountsQuery.data[0].id));
    }
  }, [accountId, accountsQuery.data]);

  const blockingError = accountsQuery.error ?? ledgerQuery.error;
  if (blockingError) {
    return (
      <PageFrame title="Ledger" subtitle="Recent account entries from `/api/v2/finance/ledger`.">
        <ErrorState error={normalizeApiError(blockingError)} />
      </PageFrame>
    );
  }

  const isLoading = accountsQuery.isLoading || ledgerQuery.isLoading;

  const accounts = accountsQuery.data ?? [];
  const entries = ledgerQuery.data ?? [];
  const selectedAccount = useMemo(
    () => accounts.find((account) => String(account.id) === accountId) ?? accounts[0],
    [accountId, accounts],
  );

  const columns: Column<LedgerEntry>[] = [
    { key: 'id', header: 'Entry', render: (entry) => entry.id },
    { key: 'account_id', header: 'Account', render: (entry) => entry.account_id },
    {
      key: 'entry_type',
      header: 'Type',
      render: (entry) => <Badge variant={entry.entry_type === 'DEBIT' ? 'warning' : 'success'}>{entry.entry_type}</Badge>,
    },
    { key: 'amount', header: 'Amount', render: (entry) => formatCurrency(entry.amount) },
    { key: 'balance_after', header: 'Balance after', render: (entry) => formatCurrency(entry.balance_after) },
    { key: 'description', header: 'Description', render: (entry) => entry.description },
    { key: 'created_at', header: 'Created', render: (entry) => formatDate(entry.created_at) },
  ];

  const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance ?? 0), 0);

  return (
    <PageFrame
      title="Ledger"
      subtitle="Review the latest finance ledger entries and filter by account."
      actions={
        <>
          <Button variant="secondary" size="sm" onClick={() => navigate(routes.financeAccounts)}>Accounts</Button>
          <Button variant="secondary" size="sm" onClick={() => navigate(routes.financeTreasury)}>Treasury</Button>
          <Button variant="secondary" size="sm" onClick={() => navigate(routes.financeLoans)}>Loans</Button>
        </>
      }
    >
      {isLoading ? (
        <div className="space-y-6">
          <SkeletonLoader variant="rect" height={180} />
          <SkeletonLoader variant="rect" height={340} />
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
              <CardContent><div className="text-3xl font-semibold">{formatCurrency(totalBalance)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium text-gray-500">Selected account</CardTitle></CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">{selectedAccount?.name ?? 'All accounts'}</div>
                <div className="text-sm text-gray-500">{selectedAccount ? formatCurrency(selectedAccount.balance) : 'Latest ledger entries'}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Filter entries</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-[minmax(0,320px)_1fr]">
              <label className="space-y-2 text-sm font-medium text-gray-700">
                <span>Account</span>
                <select
                  value={accountId}
                  onChange={(event) => setAccountId(event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  {accounts.map((account) => (
                    <option key={String(account.id)} value={String(account.id)}>
                      {account.name} ({account.type})
                    </option>
                  ))}
                </select>
              </label>
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                The backend returns the latest 50 ledger rows for the selected account. Use the treasury and accounts pages for a broader finance overview.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Ledger entries</CardTitle></CardHeader>
            <CardContent>
              {entries.length ? <DataTable columns={columns} data={entries} emptyMessage="No ledger rows returned for this account." /> : (
                <EmptyState title="No ledger entries" body="The backend did not return any ledger history for the current account filter." />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </PageFrame>
  );
}
