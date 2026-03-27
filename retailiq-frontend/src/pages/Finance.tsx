import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  useApplyForLoanMutation,
  useCreditLedgerQuery,
  useCreditScoreQuery,
  useCreditTransactionsQuery,
  useDisburseLoanMutation,
  useFinanceDashboardQuery,
  useFinancialAccountsQuery,
  useKYCQuery,
  useLoanApplicationsQuery,
  useRefreshCreditScoreMutation,
  useSubmitKYCMutation,
  useTreasuryBalanceQuery,
  useTreasuryConfigQuery,
  useTreasuryTransactionsQuery,
  useUpdateTreasuryConfigMutation,
} from '@/hooks/finance';
import { authStore } from '@/stores/authStore';
import { uiStore } from '@/stores/uiStore';
import { formatCurrency } from '@/utils/numbers';
import { formatDate } from '@/utils/dates';
import { normalizeApiError } from '@/utils/errors';
import { routes } from '@/routes/routes';
import type { Column as _Column } from '@/components/ui/DataTable';
import type { CreditTransaction, FinancialAccount, LoanApplication, TreasuryTransaction } from '@/api/finance';

type FinanceTab = 'overview' | 'kyc' | 'credit' | 'loans' | 'treasury';

export default function FinancePage() {
  const user = authStore((state) => state.user);
  const addToast = uiStore((state) => state.addToast);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<FinanceTab>('overview');
  const [kycForm, setKycForm] = useState({
    provider: 'RetailIQ',
    document_type: 'GSTIN',
    document_number: '',
    full_name: user?.full_name ?? '',
    date_of_birth: '',
    address: '',
  });
  const [loanForm, setLoanForm] = useState({
    product_id: '',
    amount: '',
    tenure_months: '12',
    purpose: '',
  });
  const [treasuryForm, setTreasuryForm] = useState({
    auto_transfer_enabled: false,
    daily_transfer_limit: '0',
  });

  const kycQuery = useKYCQuery();
  const creditScoreQuery = useCreditScoreQuery();
  const creditLedgerQuery = useCreditLedgerQuery();
  const creditTransactionsQuery = useCreditTransactionsQuery();
  const loanApplicationsQuery = useLoanApplicationsQuery();
  const accountsQuery = useFinancialAccountsQuery();
  const treasuryBalanceQuery = useTreasuryBalanceQuery();
  const financeDashboardQuery = useFinanceDashboardQuery();
  const treasuryConfigQuery = useTreasuryConfigQuery();
  const treasuryTransactionsQuery = useTreasuryTransactionsQuery();

  const submitKycMutation = useSubmitKYCMutation();
  const refreshScoreMutation = useRefreshCreditScoreMutation();
  const applyForLoanMutation = useApplyForLoanMutation();
  const disburseLoanMutation = useDisburseLoanMutation();
  const updateTreasuryConfigMutation = useUpdateTreasuryConfigMutation();

  useEffect(() => {
    if (treasuryConfigQuery.data) {
      setTreasuryForm({
        auto_transfer_enabled: treasuryConfigQuery.data.auto_transfer_enabled,
        daily_transfer_limit: String(treasuryConfigQuery.data.daily_transfer_limit ?? 0),
      });
    }
  }, [treasuryConfigQuery.data]);

  if (user?.role !== 'owner') {
    return (
      <PageFrame title="Finance" subtitle="Merchant finance operations are restricted to owners.">
        <EmptyState title="Owner access required" body="Switch to an owner account to manage KYC, loans, treasury, and merchant credit." />
      </PageFrame>
    );
  }

  const blockingError = kycQuery.error
    ?? creditScoreQuery.error
    ?? creditLedgerQuery.error
    ?? creditTransactionsQuery.error
    ?? loanApplicationsQuery.error
    ?? accountsQuery.error
    ?? treasuryBalanceQuery.error
    ?? financeDashboardQuery.error
    ?? treasuryConfigQuery.error
    ?? treasuryTransactionsQuery.error;
  if (blockingError) {
    return (
      <PageFrame title="Finance" subtitle="Merchant finance operations backed by `/api/v2/finance`.">
        <ErrorState error={normalizeApiError(blockingError)} />
      </PageFrame>
    );
  }

  const isLoading = kycQuery.isLoading
    || creditScoreQuery.isLoading
    || creditLedgerQuery.isLoading
    || creditTransactionsQuery.isLoading
    || loanApplicationsQuery.isLoading
    || accountsQuery.isLoading
    || treasuryBalanceQuery.isLoading
    || financeDashboardQuery.isLoading
    || treasuryConfigQuery.isLoading
    || treasuryTransactionsQuery.isLoading;

  const kyc = kycQuery.data;
  const creditScore = creditScoreQuery.data;
  const creditLedger = creditLedgerQuery.data;
  const creditTransactions = creditTransactionsQuery.data ?? [];
  const loanApplications = loanApplicationsQuery.data ?? [];
  const accounts = accountsQuery.data ?? [];
  const treasuryBalance = treasuryBalanceQuery.data;
  const financeDashboard = financeDashboardQuery.data;
  const treasuryTransactions = treasuryTransactionsQuery.data ?? [];

  const creditTransactionColumns: _Column<CreditTransaction>[] = [
    { key: 'id', header: 'Transaction', render: (entry) => entry.id },
    { key: 'type', header: 'Type', render: (entry) => <Badge variant={entry.type === 'PAYMENT' ? 'success' : entry.type === 'DEBIT' ? 'warning' : 'info'}>{entry.type}</Badge> },
    { key: 'amount', header: 'Amount', render: (entry) => formatCurrency(entry.amount) },
    { key: 'description', header: 'Description', render: (entry) => entry.description },
    { key: 'created_at', header: 'Created', render: (entry) => formatDate(entry.created_at) },
  ];

  const loanColumns: Column<LoanApplication>[] = [
    { key: 'id', header: 'Application', render: (loan) => loan.id },
    { key: 'amount', header: 'Amount', render: (loan) => formatCurrency(loan.amount) },
    { key: 'tenure', header: 'Tenure', render: (loan) => `${loan.tenure_months} months` },
    { key: 'status', header: 'Status', render: (loan) => <Badge variant={loan.status === 'APPROVED' ? 'success' : loan.status === 'REJECTED' ? 'danger' : loan.status === 'DISBURSED' ? 'info' : 'secondary'}>{loan.status}</Badge> },
    { key: 'submitted_at', header: 'Submitted', render: (loan) => formatDate(loan.submitted_at) },
    {
      key: 'actions',
      header: 'Actions',
      render: (loan) => (
        loan.status === 'APPROVED' ? (
          <Button
            size="sm"
            onClick={() => {
              void disburseLoanMutation.mutateAsync(loan.id).then(() => {
                addToast({
                  title: 'Loan disbursed',
                  message: `Loan ${loan.id} was disbursed successfully.`,
                  variant: 'success',
                });
              }).catch((error) => {
                addToast({
                  title: 'Disbursement failed',
                  message: normalizeApiError(error).message,
                  variant: 'error',
                });
              });
            }}
            loading={disburseLoanMutation.isPending}
          >
            Disburse
          </Button>
        ) : <span className="text-sm text-gray-500">No action</span>
      ),
    },
  ];

  const accountColumns: Column<FinancialAccount>[] = [
    { key: 'name', header: 'Account', render: (account) => account.name },
    { key: 'type', header: 'Type', render: (account) => <Badge variant="secondary">{account.type}</Badge> },
    { key: 'balance', header: 'Balance', render: (account) => formatCurrency(account.balance) },
    { key: 'currency', header: 'Currency', render: (account) => account.currency },
    { key: 'is_active', header: 'Status', render: (account) => <Badge variant={account.is_active ? 'success' : 'secondary'}>{account.is_active ? 'Active' : 'Inactive'}</Badge> },
  ];

  const treasuryTransactionColumns: Column<TreasuryTransaction>[] = [
    { key: 'id', header: 'Transaction', render: (txn) => txn.id },
    { key: 'type', header: 'Type', render: (txn) => <Badge variant="info">{txn.type}</Badge> },
    { key: 'amount', header: 'Amount', render: (txn) => formatCurrency(txn.amount) },
    { key: 'description', header: 'Description', render: (txn) => txn.description },
    { key: 'status', header: 'Status', render: (txn) => <Badge variant={txn.status === 'COMPLETED' ? 'success' : txn.status === 'FAILED' ? 'danger' : 'warning'}>{txn.status}</Badge> },
    { key: 'created_at', header: 'Created', render: (txn) => formatDate(txn.created_at) },
  ];

  const submitKyc = async () => {
    try {
      await submitKycMutation.mutateAsync({
        provider: kycForm.provider,
        document_type: kycForm.document_type,
        document_number: kycForm.document_number,
        full_name: kycForm.full_name,
        date_of_birth: kycForm.date_of_birth,
        address: kycForm.address,
      });
      addToast({
        title: 'KYC submitted',
        message: 'Your merchant KYC was submitted successfully.',
        variant: 'success',
      });
    } catch (error) {
      addToast({
        title: 'KYC submission failed',
        message: normalizeApiError(error).message,
        variant: 'error',
      });
    }
  };

  const refreshScore = async () => {
    try {
      await refreshScoreMutation.mutateAsync();
      addToast({
        title: 'Credit score refreshed',
        message: 'The backend recalculated your latest credit score.',
        variant: 'success',
      });
    } catch (error) {
      addToast({
        title: 'Credit refresh failed',
        message: normalizeApiError(error).message,
        variant: 'error',
      });
    }
  };

  const applyForLoan = async () => {
    try {
      await applyForLoanMutation.mutateAsync({
        product_id: loanForm.product_id,
        amount: Number(loanForm.amount),
        tenure_months: loanForm.tenure_months,
        purpose: loanForm.purpose || undefined,
      });
      addToast({
        title: 'Loan application submitted',
        message: 'The backend accepted your loan request.',
        variant: 'success',
      });
      setLoanForm({ product_id: '', amount: '', tenure_months: '12', purpose: '' });
    } catch (error) {
      addToast({
        title: 'Loan application failed',
        message: normalizeApiError(error).message,
        variant: 'error',
      });
    }
  };

  const saveTreasuryConfig = async () => {
    try {
      await updateTreasuryConfigMutation.mutateAsync({
        auto_transfer_enabled: treasuryForm.auto_transfer_enabled,
        daily_transfer_limit: Number(treasuryForm.daily_transfer_limit),
      });
      addToast({
        title: 'Treasury config updated',
        message: 'The backend saved your treasury sweep preferences.',
        variant: 'success',
      });
    } catch (error) {
      addToast({
        title: 'Treasury update failed',
        message: normalizeApiError(error).message,
        variant: 'error',
      });
    }
  };

  return (
    <PageFrame title="Finance" subtitle="Merchant finance actions backed by live `/api/v2/finance` endpoints.">
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex flex-wrap gap-6">
          {(['overview', 'kyc', 'credit', 'loans', 'treasury'] as FinanceTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <SkeletonLoader variant="rect" height={180} />
          <SkeletonLoader variant="rect" height={360} />
        </div>
      ) : null}

      {!isLoading && activeTab === 'overview' && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Finance hub shortcuts</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => navigate(routes.financeAccounts)}>Accounts</Button>
              <Button variant="secondary" onClick={() => navigate(routes.financeCreditScore)}>Credit score</Button>
              <Button variant="secondary" onClick={() => navigate(routes.financeKyc)}>Finance KYC</Button>
              <Button variant="secondary" onClick={() => navigate(routes.financeLedger)}>Ledger</Button>
              <Button variant="secondary" onClick={() => navigate(routes.financeTreasury)}>Treasury</Button>
              <Button variant="secondary" onClick={() => navigate(routes.financeLoans)}>Loans</Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium text-gray-500">Credit Score</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{financeDashboard?.credit_score ?? creditScore?.score ?? 0}</div>
                <div className="mt-3">
                  <Button size="sm" onClick={() => void refreshScore()} loading={refreshScoreMutation.isPending}>Refresh score</Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium text-gray-500">Outstanding Credit</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-semibold">{formatCurrency(financeDashboard?.total_debt ?? creditLedger?.balance ?? 0)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium text-gray-500">Treasury Balance</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-semibold">{formatCurrency(financeDashboard?.treasury_balance ?? treasuryBalance?.available_balance ?? 0)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium text-gray-500">KYC Status</CardTitle></CardHeader>
              <CardContent><Badge variant={kyc?.status === 'VERIFIED' ? 'success' : kyc?.status === 'REJECTED' ? 'danger' : 'warning'}>{kyc?.status ?? 'NOT_STARTED'}</Badge></CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Credit Factors</CardTitle></CardHeader>
            <CardContent>
              {creditScore?.factors?.length ? (
                <div className="flex flex-wrap gap-2">
                  {creditScore.factors.map((factor) => (
                    <Badge key={factor} variant="info">{factor}</Badge>
                  ))}
                </div>
              ) : <EmptyState title="No factors available" body="The backend did not return score factor details." />}
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && activeTab === 'kyc' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Current KYC Status</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><span className="text-sm text-gray-500">Status:</span> <Badge variant={kyc?.status === 'VERIFIED' ? 'success' : kyc?.status === 'REJECTED' ? 'danger' : 'warning'}>{kyc?.status ?? 'NOT_STARTED'}</Badge></div>
              <div><span className="text-sm text-gray-500">Reference:</span> {kyc?.reference_id ?? 'Not submitted'}</div>
              <div><span className="text-sm text-gray-500">Submitted:</span> {kyc?.submitted_at ? formatDate(kyc.submitted_at) : '—'}</div>
              <div><span className="text-sm text-gray-500">Verified:</span> {kyc?.verified_at ? formatDate(kyc.verified_at) : '—'}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Submit KYC</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input label="Provider" value={kycForm.provider} onChange={(event) => setKycForm((current) => ({ ...current, provider: event.target.value }))} />
              <Input label="Document type" value={kycForm.document_type} onChange={(event) => setKycForm((current) => ({ ...current, document_type: event.target.value }))} />
              <Input label="Document number" value={kycForm.document_number} onChange={(event) => setKycForm((current) => ({ ...current, document_number: event.target.value }))} />
              <Input label="Full name" value={kycForm.full_name} onChange={(event) => setKycForm((current) => ({ ...current, full_name: event.target.value }))} />
              <Input label="Date of birth" type="date" value={kycForm.date_of_birth} onChange={(event) => setKycForm((current) => ({ ...current, date_of_birth: event.target.value }))} />
              <Input label="Address" value={kycForm.address} onChange={(event) => setKycForm((current) => ({ ...current, address: event.target.value }))} />
              <Button onClick={() => void submitKyc()} loading={submitKycMutation.isPending} disabled={!kycForm.document_number || !kycForm.full_name}>Submit KYC</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && activeTab === 'credit' && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Credit Ledger</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div><div className="text-sm text-gray-500">Balance</div><div className="text-xl font-semibold">{formatCurrency(creditLedger?.balance ?? 0)}</div></div>
              <div><div className="text-sm text-gray-500">Available</div><div className="text-xl font-semibold">{formatCurrency(creditLedger?.available_credit ?? 0)}</div></div>
              <div><div className="text-sm text-gray-500">Limit</div><div className="text-xl font-semibold">{formatCurrency(creditLedger?.total_credit_limit ?? 0)}</div></div>
              <div><div className="text-sm text-gray-500">Pending Charges</div><div className="text-xl font-semibold">{formatCurrency(creditLedger?.pending_charges ?? 0)}</div></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Live Credit Transactions</CardTitle></CardHeader>
            <CardContent>
              {creditTransactions.length ? (
                <DataTable columns={creditTransactionColumns} data={creditTransactions} />
              ) : (
                <EmptyState title="No credit transactions" body="The backend returned no ledger-backed credit transactions yet." />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && activeTab === 'loans' && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Apply For Loan</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Product ID" value={loanForm.product_id} onChange={(event) => setLoanForm((current) => ({ ...current, product_id: event.target.value }))} />
              <Input label="Amount" type="number" value={loanForm.amount} onChange={(event) => setLoanForm((current) => ({ ...current, amount: event.target.value }))} />
              <Input label="Tenure (months)" type="number" value={loanForm.tenure_months} onChange={(event) => setLoanForm((current) => ({ ...current, tenure_months: event.target.value }))} />
              <Input label="Purpose" value={loanForm.purpose} onChange={(event) => setLoanForm((current) => ({ ...current, purpose: event.target.value }))} />
              <div className="md:col-span-2">
                <Button onClick={() => void applyForLoan()} loading={applyForLoanMutation.isPending} disabled={!loanForm.product_id || !loanForm.amount}>Submit loan application</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Loan Applications</CardTitle></CardHeader>
            <CardContent>
              {loanApplications.length ? (
                <DataTable columns={loanColumns} data={loanApplications} />
              ) : (
                <EmptyState title="No loan applications" body="Use the form above to submit your first loan application." />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && activeTab === 'treasury' && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Treasury Configuration</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div><div className="text-sm text-gray-500">Auto transfer</div><div className="text-xl font-semibold">{treasuryConfigQuery.data?.auto_transfer_enabled ? 'Enabled' : 'Disabled'}</div></div>
              <div><div className="text-sm text-gray-500">Reserve %</div><div className="text-xl font-semibold">{treasuryConfigQuery.data?.reserve_percentage ?? 0}%</div></div>
              <div><div className="text-sm text-gray-500">Daily limit</div><div className="text-xl font-semibold">{formatCurrency(treasuryConfigQuery.data?.daily_transfer_limit ?? 0)}</div></div>
              <div><div className="text-sm text-gray-500">Strategy</div><div className="text-xl font-semibold">{treasuryConfigQuery.data?.strategy ?? 'OFF'}</div></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Treasury Balance</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div><div className="text-sm text-gray-500">Available</div><div className="text-xl font-semibold">{formatCurrency(treasuryBalance?.available_balance ?? 0)}</div></div>
              <div><div className="text-sm text-gray-500">Total</div><div className="text-xl font-semibold">{formatCurrency(treasuryBalance?.total_balance ?? 0)}</div></div>
              <div><div className="text-sm text-gray-500">Reserved</div><div className="text-xl font-semibold">{formatCurrency(treasuryBalance?.reserved_amount ?? 0)}</div></div>
              <div><div className="text-sm text-gray-500">Pending Transfers</div><div className="text-xl font-semibold">{formatCurrency(treasuryBalance?.pending_transfers ?? 0)}</div></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Update Treasury Sweep Config</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={treasuryForm.auto_transfer_enabled}
                  onChange={(event) => setTreasuryForm((current) => ({ ...current, auto_transfer_enabled: event.target.checked }))}
                />
                Enable automatic sweeps
              </label>
              <Input label="Minimum reserve balance" type="number" value={treasuryForm.daily_transfer_limit} onChange={(event) => setTreasuryForm((current) => ({ ...current, daily_transfer_limit: event.target.value }))} />
              <Button onClick={() => void saveTreasuryConfig()} loading={updateTreasuryConfigMutation.isPending}>Save treasury config</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Financial Accounts</CardTitle></CardHeader>
            <CardContent>
              {accounts.length ? (
                <DataTable columns={accountColumns} data={accounts} />
              ) : (
                <EmptyState title="No financial accounts" body="The backend returned no linked finance accounts for this store." />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Treasury Transactions</CardTitle></CardHeader>
            <CardContent>
              {treasuryTransactions.length ? (
                <DataTable columns={treasuryTransactionColumns} data={treasuryTransactions} />
              ) : (
                <EmptyState title="No treasury transactions" body="Treasury activity will appear here once the backend records transfers and payments." />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </PageFrame>
  );
}
