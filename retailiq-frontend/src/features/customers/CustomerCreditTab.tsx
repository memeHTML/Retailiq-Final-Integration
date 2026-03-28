import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { authStore } from '@/stores/authStore';
import { normalizeApiError } from '@/utils/errors';
import { formatDate } from '@/utils/dates';
import { useCustomerCreditAccount, useCustomerCreditTransactions } from '@/hooks/useCredit';
import { useCreditRepayMutation } from '@/hooks/credit';

interface CreditAccount {
  id: string;
  credit_limit: number;
  balance: number;
  status?: string;
  updated_at?: string;
  created_at: string;
  available_credit?: number;
}

interface CreditTransaction {
  date?: string;
  created_at?: string;
  type: string;
  amount?: number;
  credit_amount?: number;
  notes?: string | null;
  description?: string | null;
}

type Props = {
  customerId: string;
  customerName: string;
};

export default function CustomerCreditTab({ customerId, customerName }: Props) {
  const navigate = useNavigate();
  const role = authStore((state) => state.role);
  const canManage = role === 'owner';
  const [repayAmount, setRepayAmount] = useState('');

  const accountQuery = useCustomerCreditAccount(customerId);
  const transactionsQuery = useCustomerCreditTransactions(customerId);
  const repayMutation = useCreditRepayMutation();

  if (accountQuery.isError) {
    return <ErrorState error={normalizeApiError(accountQuery.error)} onRetry={() => void accountQuery.refetch()} />;
  }

  const account = accountQuery.data as CreditAccount | undefined;
  const rows = (Array.isArray(transactionsQuery.data) ? transactionsQuery.data : transactionsQuery.data?.data ?? []) as CreditTransaction[];

  if (accountQuery.isLoading) {
    return <SkeletonLoader variant="rect" height={240} />;
  }

  if (!account) {
    return (
      <EmptyState
        title="No credit account"
        body={`${customerName} does not have an active credit account.`}
        action={canManage ? { label: 'Open Credit Center', onClick: () => navigate('/finance/credit-score') } : undefined}
      />
    );
  }

  const handleRepay = async () => {
    if (!repayAmount) return;
    await repayMutation.mutateAsync({
      customerId,
      data: { amount: Number(repayAmount) },
    });
    setRepayAmount('');
  };

  const availableCredit = Number((account as CreditAccount & { available_credit?: number }).available_credit ?? account.credit_limit - account.balance);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Credit Limit</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">₹{account.credit_limit.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Configured customer limit</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Outstanding Balance</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">₹{account.balance.toLocaleString()}</div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Status</span>
              <Badge variant={account.status === 'overdue' ? 'destructive' : 'secondary'}>{account.status}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Available Credit</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">₹{availableCredit.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Ready to spend</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Repayment action</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input type="number" label="Repayment amount" value={repayAmount} onChange={(event) => setRepayAmount(event.target.value)} />
            <div className="button-row">
              <Button loading={repayMutation.isPending} onClick={() => void handleRepay()}>
                Record Payment
              </Button>
              <Button variant="secondary" onClick={() => navigate('/finance')}>
                Add Credit
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Account snapshot</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center justify-between gap-4">
              <span>Customer</span>
              <strong>{customerName}</strong>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Account ID</span>
              <strong>{account.id}</strong>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Last updated</span>
              <strong>{formatDate(account.updated_at ?? account.created_at)}</strong>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Repayment history</CardTitle></CardHeader>
        <CardContent>
          {transactionsQuery.isLoading ? (
            <SkeletonLoader variant="rect" height={180} />
          ) : rows.length === 0 ? (
            <EmptyState title="No transactions" body="No repayment history has been recorded yet." />
          ) : (
            <DataTable<CreditTransaction>
              columns={[
                { key: 'date', header: 'Date', render: (row) => formatDate(row.date ?? row.created_at ?? '') },
                { key: 'type', header: 'Type', render: (row) => <Badge variant={row.type === 'repayment' ? 'success' : 'secondary'}>{row.type}</Badge> },
                { key: 'amount', header: 'Amount', render: (row) => `₹${Number(row.amount ?? row.credit_amount ?? 0).toLocaleString()}` },
                { key: 'notes', header: 'Notes', render: (row) => row.notes ?? row.description ?? '—' },
              ]}
              data={rows}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
