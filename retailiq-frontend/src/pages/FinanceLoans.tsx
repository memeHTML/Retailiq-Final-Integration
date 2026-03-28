import { useState } from 'react';
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
import { useApplyForLoanMutation, useDisburseLoanMutation, useLoanApplicationsQuery } from '@/hooks/finance';
import { routes } from '@/routes/routes';
import { formatCurrency } from '@/utils/numbers';
import { formatDate } from '@/utils/dates';
import { normalizeApiError } from '@/utils/errors';
import type { LoanApplication } from '@/api/finance';

export default function FinanceLoansPage() {
  const navigate = useNavigate();
  const loansQuery = useLoanApplicationsQuery();
  const applyMutation = useApplyForLoanMutation();
  const disburseMutation = useDisburseLoanMutation();
  const [form, setForm] = useState({
    product_id: '',
    amount: '',
    tenure_months: '12',
    purpose: '',
  });

  if (loansQuery.error) {
    return (
      <PageFrame title="Loans" subtitle="Apply, disburse, and monitor merchant loan applications.">
        <ErrorState error={normalizeApiError(loansQuery.error)} />
      </PageFrame>
    );
  }

  const loans = loansQuery.data ?? [];

  const columns: Column<LoanApplication>[] = [
    { key: 'id', header: 'Loan', render: (loan) => loan.id },
    { key: 'amount', header: 'Amount', render: (loan) => formatCurrency(loan.amount) },
    { key: 'status', header: 'Status', render: (loan) => <Badge variant={loan.status === 'APPROVED' ? 'success' : loan.status === 'REJECTED' ? 'danger' : loan.status === 'DISBURSED' ? 'info' : 'secondary'}>{loan.status}</Badge> },
    { key: 'submitted_at', header: 'Applied', render: (loan) => formatDate(loan.submitted_at) },
    { key: 'outstanding', header: 'Outstanding', render: (loan) => formatCurrency(loan.outstanding ?? 0) },
    {
      key: 'actions',
      header: 'Actions',
      render: (loan) => (
        loan.status === 'APPROVED' ? (
          <Button
            size="sm"
            onClick={() => void disburseMutation.mutateAsync(loan.id)}
            loading={disburseMutation.isPending}
          >
            Disburse
          </Button>
        ) : (
          <span className="text-sm text-gray-500">No action</span>
        )
      ),
    },
  ];

  const submitLoan = async () => {
    await applyMutation.mutateAsync({
      product_id: form.product_id,
      amount: Number(form.amount),
      tenure_months: form.tenure_months,
      purpose: form.purpose || undefined,
    });
    setForm({ product_id: '', amount: '', tenure_months: '12', purpose: '' });
  };

  return (
    <PageFrame
      title="Loans"
      subtitle="Submit loan applications and disburse approved loans."
      actions={
        <>
          <Button variant="secondary" size="sm" onClick={() => navigate(routes.financeLedger)}>Ledger</Button>
          <Button variant="secondary" size="sm" onClick={() => navigate(routes.financeTreasury)}>Treasury</Button>
          <Button variant="secondary" size="sm" onClick={() => navigate(routes.financeAccounts)}>Accounts</Button>
        </>
      }
    >
      {loansQuery.isLoading ? (
        <div className="space-y-6">
          <SkeletonLoader variant="rect" height={220} />
          <SkeletonLoader variant="rect" height={320} />
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Apply for a loan</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Input label="Product ID" value={form.product_id} onChange={(event) => setForm((current) => ({ ...current, product_id: event.target.value }))} />
              <Input label="Amount" type="number" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} />
              <Input label="Tenure (months)" type="number" value={form.tenure_months} onChange={(event) => setForm((current) => ({ ...current, tenure_months: event.target.value }))} />
              <Input label="Purpose" value={form.purpose} onChange={(event) => setForm((current) => ({ ...current, purpose: event.target.value }))} />
              <div className="md:col-span-2">
                <Button onClick={() => void submitLoan()} loading={applyMutation.isPending} disabled={!form.product_id || !form.amount}>
                  Submit application
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Loan applications</CardTitle></CardHeader>
            <CardContent>
              {loans.length ? (
                <DataTable columns={columns} data={loans} emptyMessage="No loan applications returned." />
              ) : (
                <EmptyState title="No loans yet" body="Submit a loan application to start tracking merchant lending activity." />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </PageFrame>
  );
}
