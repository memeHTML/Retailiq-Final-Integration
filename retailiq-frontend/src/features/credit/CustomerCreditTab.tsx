import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useCreditAccountQuery, useCreditTransactionsQuery } from '@/hooks/credit';
import { formatDate } from '@/utils/dates';
import { formatCurrency } from '@/utils/numbers';

interface CustomerCreditTabProps {
  customerId: string;
}

export function CustomerCreditTab({ customerId }: CustomerCreditTabProps) {
  const accountQuery = useCreditAccountQuery(customerId);
  const transactionsQuery = useCreditTransactionsQuery(customerId, { page: 1, page_size: 5 });

  if (accountQuery.isLoading || transactionsQuery.isLoading) {
    return <SkeletonLoader variant="rect" height={220} />;
  }

  if (accountQuery.isError || transactionsQuery.isError) {
    return <EmptyState title="Credit unavailable" body="The credit account could not be loaded for this customer." />;
  }

  const account = accountQuery.data;
  const transactions = transactionsQuery.data?.data ?? [];

  const columns: Column<(typeof transactions)[number]>[] = [
    { key: 'date', header: 'Date', render: (row) => formatDate(row.created_at) },
    { key: 'type', header: 'Type', render: (row) => <Badge variant={row.type === 'CREDIT' ? 'success' : row.type === 'DEBIT' ? 'warning' : 'info'}>{row.type}</Badge> },
    { key: 'amount', header: 'Amount', render: (row) => formatCurrency(row.amount) },
    { key: 'balance', header: 'Balance After', render: (row) => formatCurrency(row.balance_after) },
    { key: 'notes', header: 'Notes', render: (row) => row.notes ?? '—' },
  ];

  if (!account) {
    return <EmptyState title="No credit account" body="This customer does not have a credit account yet." />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-gray-500">Balance</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{formatCurrency(account.balance)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-gray-500">Credit Limit</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{formatCurrency(account.credit_limit)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-gray-500">Status</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold"><Badge variant={account.status === 'overdue' ? 'danger' : 'secondary'}>{account.status}</Badge></div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Credit Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <EmptyState title="No credit transactions" body="No credit activity was returned by the backend for this customer." />
          ) : (
            <DataTable columns={columns} data={transactions} emptyMessage="No credit transactions found." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CustomerCreditTab;
