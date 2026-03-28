import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useLoyaltyAccountQuery, useLoyaltyTransactionsQuery } from '@/hooks/loyalty';
import { formatDate } from '@/utils/dates';

interface CustomerLoyaltyTabProps {
  customerId: string;
}

export function CustomerLoyaltyTab({ customerId }: CustomerLoyaltyTabProps) {
  const accountQuery = useLoyaltyAccountQuery(customerId);
  const transactionsQuery = useLoyaltyTransactionsQuery(customerId, { page: 1, limit: 5 });

  if (accountQuery.isLoading || transactionsQuery.isLoading) {
    return <SkeletonLoader variant="rect" height={220} />;
  }

  if (accountQuery.isError || transactionsQuery.isError) {
    return <EmptyState title="Loyalty unavailable" body="The loyalty account could not be loaded for this customer." />;
  }

  const account = accountQuery.data;
  const transactions = transactionsQuery.data?.transactions ?? [];

  const columns: Column<(typeof transactions)[number]>[] = [
    { key: 'date', header: 'Date', render: (row) => formatDate(row.created_at) },
    { key: 'type', header: 'Type', render: (row) => <Badge variant={row.type === 'REDEEMED' ? 'warning' : row.type === 'EXPIRED' ? 'danger' : row.type === 'ADJUSTED' ? 'info' : 'success'}>{row.type}</Badge> },
    { key: 'points', header: 'Points', render: (row) => row.points.toLocaleString() },
    { key: 'balance', header: 'Balance After', render: (row) => row.balance_after.toLocaleString() },
    { key: 'description', header: 'Description', render: (row) => row.description },
  ];

  if (!account) {
    return <EmptyState title="No loyalty account" body="This customer is not enrolled in loyalty yet." />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-gray-500">Tier</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{account.tier_name}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-gray-500">Current Points</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{account.current_points.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-gray-500">Lifetime Points</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{account.lifetime_points.toLocaleString()}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Loyalty Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <EmptyState title="No loyalty transactions" body="No loyalty activity was returned by the backend for this customer." />
          ) : (
            <DataTable columns={columns} data={transactions} emptyMessage="No loyalty transactions found." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CustomerLoyaltyTab;
