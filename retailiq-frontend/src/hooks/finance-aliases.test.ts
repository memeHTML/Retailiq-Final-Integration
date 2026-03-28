import { describe, expect, it } from 'vitest';
import * as financeHooks from './finance';

describe('finance hook aliases', () => {
  it('exposes the prompt-facing hook names alongside the legacy exports', () => {
    expect(financeHooks.useFinanceDashboard).toBe(financeHooks.useFinanceDashboardQuery);
    expect(financeHooks.useFinanceAccounts).toBe(financeHooks.useFinancialAccountsQuery);
    expect(financeHooks.useFinanceLedger).toBe(financeHooks.useLedgerEntriesQuery);
    expect(financeHooks.useTreasuryBalance).toBe(financeHooks.useTreasuryBalanceQuery);
    expect(financeHooks.useTreasuryConfig).toBe(financeHooks.useTreasuryConfigQuery);
    expect(financeHooks.useTreasurySweepConfig).toBe(financeHooks.useTreasuryConfigQuery);
    expect(financeHooks.useTreasuryTransactions).toBe(financeHooks.useTreasuryTransactionsQuery);
    expect(financeHooks.useFinanceLoans).toBe(financeHooks.useLoanApplicationsQuery);
    expect(financeHooks.useApplyLoan).toBe(financeHooks.useApplyForLoanMutation);
    expect(financeHooks.useDisburseLoan).toBe(financeHooks.useDisburseLoanMutation);
    expect(financeHooks.useFinanceCreditScore).toBe(financeHooks.useCreditScoreQuery);
    expect(financeHooks.useRefreshCreditScore).toBe(financeHooks.useRefreshCreditScoreMutation);
    expect(financeHooks.useFinanceKycStatus).toBe(financeHooks.useKYCQuery);
    expect(financeHooks.useSubmitFinanceKyc).toBe(financeHooks.useSubmitKYCMutation);
  });
});
