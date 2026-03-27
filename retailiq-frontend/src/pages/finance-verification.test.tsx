/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RoleGuard } from '@/utils/guards';
import FinancePage from '@/pages/Finance';
import FinanceAccountsPage from '@/pages/FinanceAccounts';
import FinanceCreditScorePage from '@/pages/FinanceCreditScore';
import FinanceKycPage from '@/pages/FinanceKyc';
import FinanceLedgerPage from '@/pages/FinanceLedger';
import FinanceLoansPage from '@/pages/FinanceLoans';
import FinanceTreasuryPage from '@/pages/FinanceTreasury';
import { authStore } from '@/stores/authStore';

const mockQueries = vi.hoisted(() => ({
  kyc: {
    data: {
      id: 'kyc-1',
      provider: 'RetailIQ',
      status: 'VERIFIED',
      submitted_at: '2026-03-27T10:00:00.000Z',
      verified_at: '2026-03-27T11:00:00.000Z',
      reference_id: 'GSTIN-1',
    },
    error: null,
    isLoading: false,
  },
  creditScore: {
    data: {
      score: 734,
      max_score: 900,
      tier: 'A',
      last_updated: '2026-03-27T10:00:00.000Z',
      factors: ['Payments on time'],
    },
    error: null,
    isLoading: false,
  },
  creditLedger: {
    data: {
      balance: 2600,
      available_credit: 7400,
      total_credit_limit: 10000,
      pending_charges: 1200,
      currency: 'INR',
    },
    error: null,
    isLoading: false,
  },
  creditTransactions: {
    data: [
      {
        id: 'ct-1',
        type: 'PAYMENT',
        amount: 1200,
        description: 'Invoice settlement',
        created_at: '2026-03-27T10:00:00.000Z',
        balance_after: 2600,
      },
    ],
    error: null,
    isLoading: false,
  },
  loanApplications: {
    data: [
      {
        id: 'loan-1',
        product_id: 'loan-product-1',
        amount: 50000,
        tenure_months: 12,
        status: 'APPROVED',
        submitted_at: '2026-03-27T10:00:00.000Z',
        outstanding: 50000,
      },
    ],
    error: null,
    isLoading: false,
  },
  accounts: {
    data: [
      {
        id: 'acc-1',
        type: 'CURRENT',
        name: 'CURRENT Account',
        balance: 120000,
        currency: 'INR',
        is_active: true,
      },
    ],
    error: null,
    isLoading: false,
  },
  ledger: {
    data: [
      {
        id: 'led-1',
        account_id: 'acc-1',
        entry_type: 'CREDIT',
        amount: 5000,
        description: 'Sale settlement',
        created_at: '2026-03-27T10:00:00.000Z',
        balance_after: 125000,
      },
    ],
    error: null,
    isLoading: false,
  },
  treasuryBalance: {
    data: {
      total_balance: 8400,
      available_balance: 6100,
      reserved_amount: 2300,
      pending_transfers: 2,
      currency: 'INR',
      last_updated: '2026-03-27T10:00:00.000Z',
    },
    error: null,
    isLoading: false,
  },
  financeDashboard: {
    data: {
      cash_on_hand: 1250,
      treasury_balance: 8400,
      total_debt: 2600,
      credit_score: 734,
    },
    error: null,
    isLoading: false,
  },
  treasuryConfig: {
    data: {
      auto_transfer_enabled: true,
      reserve_percentage: 15,
      daily_transfer_limit: 50000,
      settlement_account_id: 'acc-1',
      strategy: 'AUTO',
      sweep_threshold: 20000,
    },
    error: null,
    isLoading: false,
  },
  treasuryTransactions: {
    data: [
      {
        id: 'tt-1',
        type: 'TRANSFER_IN',
        amount: 10000,
        description: 'Treasury sweep',
        status: 'COMPLETED',
        created_at: '2026-03-27T10:00:00.000Z',
        completed_at: '2026-03-27T10:10:00.000Z',
      },
    ],
    error: null,
    isLoading: false,
  },
  mutation: {
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  },
}));

vi.mock('@/hooks/finance', () => ({
  useKYCQuery: () => mockQueries.kyc,
  useSubmitKYCMutation: () => mockQueries.mutation,
  useCreditScoreQuery: () => mockQueries.creditScore,
  useRefreshCreditScoreMutation: () => mockQueries.mutation,
  useCreditLedgerQuery: () => mockQueries.creditLedger,
  useCreditTransactionsQuery: () => mockQueries.creditTransactions,
  useLoanProductsQuery: () => ({ data: [], error: null, isLoading: false }),
  useLoanApplicationsQuery: () => mockQueries.loanApplications,
  useLoanApplicationQuery: () => mockQueries.loanApplications,
  useApplyForLoanMutation: () => mockQueries.mutation,
  useDisburseLoanMutation: () => mockQueries.mutation,
  useFinancialAccountsQuery: () => mockQueries.accounts,
  useLedgerEntriesQuery: () => mockQueries.ledger,
  useTreasuryBalanceQuery: () => mockQueries.treasuryBalance,
  useFinanceDashboardQuery: () => mockQueries.financeDashboard,
  useTreasuryConfigQuery: () => mockQueries.treasuryConfig,
  useUpdateTreasuryConfigMutation: () => mockQueries.mutation,
  useTreasuryTransactionsQuery: () => mockQueries.treasuryTransactions,
  useFinanceDashboard: () => mockQueries.financeDashboard,
  useFinanceAccounts: () => mockQueries.accounts,
  useFinanceLedger: () => mockQueries.ledger,
  useTreasuryBalance: () => mockQueries.treasuryBalance,
  useTreasuryConfig: () => mockQueries.treasuryConfig,
  useTreasurySweepConfig: () => mockQueries.treasuryConfig,
  useTreasuryTransactions: () => mockQueries.treasuryTransactions,
  useFinanceLoans: () => mockQueries.loanApplications,
  useApplyLoan: () => mockQueries.mutation,
  useDisburseLoan: () => mockQueries.mutation,
  useFinanceCreditScore: () => mockQueries.creditScore,
  useRefreshCreditScore: () => mockQueries.mutation,
  useFinanceKycStatus: () => mockQueries.kyc,
  useSubmitFinanceKyc: () => mockQueries.mutation,
}));

describe('finance workflow verification', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    authStore.setState({
      accessToken: 'token',
      refreshToken: 'refresh',
      user: {
        user_id: 1,
        role: 'owner',
        store_id: 1,
        mobile_number: '9999999999',
        full_name: 'Owner User',
      },
      isAuthenticated: true,
      role: 'owner',
    });
  });

  const renderPage = (element: JSX.Element) =>
    render(
      <MemoryRouter initialEntries={['/finance']}>
        {element}
      </MemoryRouter>,
    );

  it('renders the finance hub and shortcuts', () => {
    renderPage(<FinancePage />);

    expect(screen.getByText('Finance hub shortcuts')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Accounts' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Credit score' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Finance KYC' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ledger' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Treasury' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Loans' })).toBeTruthy();
  });

  it('renders the dedicated finance routes without crashing', () => {
    const pages = [
      { element: <FinanceAccountsPage />, heading: 'Accounts' },
      { element: <FinanceLedgerPage />, heading: 'Ledger' },
      { element: <FinanceTreasuryPage />, heading: 'Treasury' },
      { element: <FinanceLoansPage />, heading: 'Loans' },
      { element: <FinanceCreditScorePage />, heading: 'Credit Score' },
      { element: <FinanceKycPage />, heading: 'Finance KYC' },
    ] as const;

    for (const page of pages) {
      cleanup();
      renderPage(page.element);
      expect(screen.getAllByText(page.heading).length).toBeGreaterThan(0);
    }
  });

  it('keeps owner-only finance actions gated', () => {
    authStore.setState({
      accessToken: 'token',
      refreshToken: 'refresh',
      user: {
        user_id: 2,
        role: 'staff',
        store_id: 1,
        mobile_number: '8888888888',
        full_name: 'Staff User',
      },
      isAuthenticated: true,
      role: 'staff',
    });

    render(
      <MemoryRouter initialEntries={['/finance/loans']}>
        <Routes>
          <Route path="/finance/loans" element={<RoleGuard role="owner"><FinanceLoansPage /></RoleGuard>} />
          <Route path="/403" element={<div>403 - Forbidden</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('403 - Forbidden')).toBeTruthy();
  });
});
