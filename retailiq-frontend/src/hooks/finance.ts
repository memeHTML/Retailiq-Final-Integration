/**
 * src/hooks/finance.ts
 * React Query hooks for Finance operations
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as financeApi from '@/api/finance';
import type { 
  KYCSubmission,
  LoanApplicationRequest,
  TreasuryConfig,
} from '@/api/finance';

// Query keys
export const financeKeys = {
  all: ['finance'] as const,
  kyc: () => [...financeKeys.all, 'kyc'] as const,
  creditScore: () => [...financeKeys.all, 'creditScore'] as const,
  creditLedger: () => [...financeKeys.all, 'creditLedger'] as const,
  creditTransactions: () => [...financeKeys.all, 'creditTransactions'] as const,
  loanProducts: () => [...financeKeys.all, 'loanProducts'] as const,
  loanApplications: () => [...financeKeys.all, 'loanApplications'] as const,
  loanApplication: (id: string) => [...financeKeys.loanApplications(), id] as const,
  accounts: () => [...financeKeys.all, 'accounts'] as const,
  ledger: (accountId?: string) => [...financeKeys.all, 'ledger', ...(accountId ? [accountId] : [])] as const,
  treasuryBalance: () => [...financeKeys.all, 'treasuryBalance'] as const,
  treasuryConfig: () => [...financeKeys.all, 'treasuryConfig'] as const,
  treasuryTransactions: () => [...financeKeys.all, 'treasuryTransactions'] as const,
  dashboard: () => [...financeKeys.all, 'dashboard'] as const,
};

const invalidateFinanceViews = async (queryClient: ReturnType<typeof useQueryClient>, keys: Array<readonly unknown[]>) => {
  await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
};

// KYC
export const useKYCQuery = () => {
  return useQuery({
    queryKey: financeKeys.kyc(),
    queryFn: () => financeApi.financeApi.getKYCStatus(),
    staleTime: 60000, // 1 minute
  });
};

export const useSubmitKYCMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: KYCSubmission) => financeApi.financeApi.submitKYC(data),
    onSuccess: () => {
      void invalidateFinanceViews(queryClient, [financeKeys.kyc(), financeKeys.dashboard()]);
    },
  });
};

// Credit Score
export const useCreditScoreQuery = () => {
  return useQuery({
    queryKey: financeKeys.creditScore(),
    queryFn: () => financeApi.financeApi.getCreditScore(),
    staleTime: 300000, // 5 minutes
  });
};

export const useRefreshCreditScoreMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => financeApi.financeApi.refreshCreditScore(),
    onSuccess: () => {
      void invalidateFinanceViews(queryClient, [financeKeys.creditScore(), financeKeys.dashboard()]);
    },
  });
};

// Credit Ledger
export const useCreditLedgerQuery = () => {
  return useQuery({
    queryKey: financeKeys.creditLedger(),
    queryFn: () => financeApi.financeApi.getCreditLedger(),
    staleTime: 30000, // 30 seconds
  });
};

export const useCreditTransactionsQuery = () => {
  return useQuery({
    queryKey: financeKeys.creditTransactions(),
    queryFn: () => financeApi.financeApi.getCreditTransactions(),
    staleTime: 30000, // 30 seconds
  });
};

// Loans
export const useLoanProductsQuery = () => {
  return useQuery({
    queryKey: financeKeys.loanProducts(),
    queryFn: () => financeApi.financeApi.getLoanProducts(),
    staleTime: 600000, // 10 minutes
  });
};

export const useLoanApplicationsQuery = () => {
  return useQuery({
    queryKey: financeKeys.loanApplications(),
    queryFn: () => financeApi.financeApi.getLoanApplications(),
    staleTime: 30000, // 30 seconds
  });
};

export const useLoanApplicationQuery = (applicationId: string) => {
  return useQuery({
    queryKey: financeKeys.loanApplication(applicationId),
    queryFn: () => financeApi.financeApi.getLoanApplication(applicationId),
    enabled: Boolean(applicationId),
    staleTime: 30000, // 30 seconds
  });
};

export const useApplyForLoanMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: LoanApplicationRequest) => financeApi.financeApi.applyForLoan(data),
    onSuccess: () => {
      void invalidateFinanceViews(queryClient, [
        financeKeys.loanApplications(),
        financeKeys.dashboard(),
        financeKeys.accounts(),
      ]);
    },
  });
};

export const useDisburseLoanMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (loanId: string) => financeApi.financeApi.disburseLoan(loanId),
    onSuccess: () => {
      void invalidateFinanceViews(queryClient, [
        financeKeys.loanApplications(),
        financeKeys.accounts(),
        financeKeys.ledger(),
        financeKeys.treasuryTransactions(),
        financeKeys.treasuryBalance(),
        financeKeys.dashboard(),
      ]);
    },
  });
};

// Accounts
export const useFinancialAccountsQuery = () => {
  return useQuery({
    queryKey: financeKeys.accounts(),
    queryFn: () => financeApi.financeApi.getFinancialAccounts(),
    staleTime: 60000, // 1 minute
  });
};

export const useLedgerEntriesQuery = (accountId?: string) => {
  return useQuery({
    queryKey: financeKeys.ledger(accountId),
    queryFn: () => financeApi.financeApi.getLedgerEntries(accountId),
    staleTime: 30000, // 30 seconds
  });
};

// Treasury
export const useTreasuryBalanceQuery = () => {
  return useQuery({
    queryKey: financeKeys.treasuryBalance(),
    queryFn: () => financeApi.financeApi.getTreasuryBalance(),
    staleTime: 30000, // 30 seconds
  });
};

export const useFinanceDashboardQuery = () => {
  return useQuery({
    queryKey: financeKeys.dashboard(),
    queryFn: () => financeApi.financeApi.getFinanceDashboard(),
    staleTime: 30000,
  });
};

export const useTreasuryConfigQuery = () => {
  return useQuery({
    queryKey: financeKeys.treasuryConfig(),
    queryFn: () => financeApi.financeApi.getTreasuryConfig(),
    staleTime: 60000, // 1 minute
  });
};

export const useUpdateTreasuryConfigMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<TreasuryConfig>) => financeApi.financeApi.updateTreasuryConfig(data),
    onSuccess: () => {
      void invalidateFinanceViews(queryClient, [
        financeKeys.treasuryConfig(),
        financeKeys.treasuryBalance(),
        financeKeys.treasuryTransactions(),
        financeKeys.dashboard(),
      ]);
    },
  });
};

export const useTreasuryTransactionsQuery = () => {
  return useQuery({
    queryKey: financeKeys.treasuryTransactions(),
    queryFn: () => financeApi.financeApi.getTreasuryTransactions(),
    staleTime: 30000, // 30 seconds
  });
};

// Prompt-facing aliases requested by Branch A Prompt 06
export const useFinanceDashboard = useFinanceDashboardQuery;
export const useFinanceAccounts = useFinancialAccountsQuery;
export const useFinanceLedger = useLedgerEntriesQuery;
export const useTreasuryBalance = useTreasuryBalanceQuery;
export const useTreasuryConfig = useTreasuryConfigQuery;
export const useTreasurySweepConfig = useTreasuryConfigQuery;
export const useTreasuryTransactions = useTreasuryTransactionsQuery;
export const useFinanceLoans = useLoanApplicationsQuery;
export const useApplyLoan = useApplyForLoanMutation;
export const useDisburseLoan = useDisburseLoanMutation;
export const useFinanceCreditScore = useCreditScoreQuery;
export const useRefreshCreditScore = useRefreshCreditScoreMutation;
export const useFinanceKycStatus = useKYCQuery;
export const useSubmitFinanceKyc = useSubmitKYCMutation;
