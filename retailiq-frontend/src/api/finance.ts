/**
 * src/api/finance.ts
 * Backend-aligned finance adapters
 */
import { requestRaw } from './client';

const FINANCE_BASE = '/api/v2/finance';

export interface KYCRecord {
  id: string;
  provider: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'FAILED';
  submitted_at: string;
  verified_at?: string;
  rejection_reason?: string;
  reference_id: string;
}

export interface KYCSubmission {
  provider: string;
  document_type: string;
  document_number: string;
  full_name: string;
  date_of_birth: string;
  address: string;
}

export interface CreditScore {
  score: number;
  max_score: number;
  tier?: string;
  last_updated: string;
  factors: string[];
}

export interface CreditLedger {
  balance: number;
  available_credit: number;
  total_credit_limit: number;
  pending_charges: number;
  currency: string;
}

export interface CreditTransaction {
  id: string;
  type: 'CREDIT' | 'DEBIT' | 'PAYMENT';
  amount: number;
  description: string;
  created_at: string;
  balance_after: number;
}

export interface LoanProduct {
  id: string;
  name: string;
  description: string;
  interest_rate: number;
  min_amount: number;
  max_amount: number;
  tenure_months: number;
  processing_fee: number;
}

export interface LoanApplication {
  id: string;
  product_id: string;
  amount: number;
  tenure_months: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISBURSED' | 'CLOSED';
  submitted_at: string;
  approved_at?: string;
  disbursed_at?: string;
  rejection_reason?: string;
  monthly_installment?: number;
  outstanding?: number;
}

export interface LoanApplicationRequest {
  product_id: string;
  amount: number;
  tenure_months: string;
  purpose?: string;
}

export interface FinancialAccount {
  id: string;
  type: 'CURRENT' | 'SAVINGS' | 'ESCROW';
  name: string;
  balance: number;
  currency: string;
  is_active: boolean;
}

export interface LedgerEntry {
  id: string;
  account_id: string;
  entry_type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  reference_id?: string;
  created_at: string;
  balance_after: number;
}

export interface TreasuryConfig {
  auto_transfer_enabled: boolean;
  reserve_percentage: number;
  daily_transfer_limit: number;
  settlement_account_id: string;
  strategy?: string;
  sweep_threshold?: number;
  created_at?: string;
}

export interface TreasuryBalance {
  total_balance: number;
  available_balance: number;
  reserved_amount: number;
  pending_transfers: number;
  currency: string;
  last_updated: string;
  yield_bps?: number;
}

export interface FinanceDashboard {
  cash_on_hand: number;
  treasury_balance: number;
  total_debt: number;
  credit_score: number;
}

export interface TreasuryTransaction {
  id: string;
  type: 'TRANSFER_IN' | 'TRANSFER_OUT' | 'PAYMENT' | 'REFUND';
  amount: number;
  description: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  created_at: string;
  completed_at?: string;
}

interface FinanceDashboardResponse {
  cash_on_hand?: number;
  treasury_balance?: number;
  total_debt?: number;
  credit_score?: number;
}

interface RawLoanApplication {
  id: string | number;
  amount?: number;
  status?: string;
  applied_at?: string;
  outstanding?: number;
}

interface RawAccount {
  id: string | number;
  type?: string;
  balance?: number;
}

interface RawLedgerEntry {
  id: string | number;
  txn_id?: string;
  account_id?: string | number;
  type?: string;
  amount?: number;
  balance_after?: number;
  description?: string;
  created_at?: string;
}

const nowIso = () => new Date().toISOString();

const mapKycStatus = (status?: string): KYCRecord['status'] => {
  switch (status) {
    case 'VERIFIED':
      return 'VERIFIED';
    case 'REJECTED':
      return 'REJECTED';
    case 'FAILED':
      return 'FAILED';
    default:
      return 'PENDING';
  }
};

const mapLoanStatus = (status?: string): LoanApplication['status'] => {
  switch (status) {
    case 'APPROVED':
      return 'APPROVED';
    case 'REJECTED':
      return 'REJECTED';
    case 'DISBURSED':
    case 'REPAYING':
      return 'DISBURSED';
    case 'CLOSED':
      return 'CLOSED';
    default:
      return 'PENDING';
  }
};

const mapLoan = (loan: RawLoanApplication): LoanApplication => ({
  id: String(loan.id),
  product_id: '',
  amount: Number(loan.amount ?? 0),
  tenure_months: 0,
  status: mapLoanStatus(loan.status),
  submitted_at: loan.applied_at ?? nowIso(),
  outstanding: Number(loan.outstanding ?? loan.amount ?? 0),
});

const mapAccountType = (type?: string): FinancialAccount['type'] => {
  switch (type) {
    case 'RESERVE':
      return 'ESCROW';
    case 'SAVINGS':
      return 'SAVINGS';
    default:
      return 'CURRENT';
  }
};

const mapLedgerEntryType = (type?: string): LedgerEntry['entry_type'] => (type === 'DEBIT' ? 'DEBIT' : 'CREDIT');

const defaultTreasuryConfig = (): TreasuryConfig => ({
  auto_transfer_enabled: false,
  reserve_percentage: 0,
  daily_transfer_limit: 0,
  settlement_account_id: '',
});

const fetchFinanceDashboard = () => requestRaw<FinanceDashboardResponse>({ url: `${FINANCE_BASE}/dashboard`, method: 'GET' });

export const financeApi = {
  submitKYC: async (data: KYCSubmission): Promise<KYCRecord> => {
    const response = await requestRaw<{ status?: string }>({
      url: `${FINANCE_BASE}/kyc/submit`,
      method: 'POST',
      data: {
        business_type: data.document_type || data.provider,
        tax_id: data.document_number,
        document_urls: {
          holder_name: data.full_name,
          date_of_birth: data.date_of_birth,
          address: data.address,
        },
      },
    });

    return {
      id: `kyc-${data.document_number}`,
      provider: data.provider,
      status: mapKycStatus(response.status),
      submitted_at: nowIso(),
      reference_id: data.document_number,
    };
  },

  getKYCStatus: async (): Promise<KYCRecord | null> => {
    const response = await requestRaw<{ status?: string; tax_id?: string; updated_at?: string }>({
      url: `${FINANCE_BASE}/kyc/status`,
      method: 'GET',
    });

    if (!response.status || response.status === 'NOT_STARTED') {
      return null;
    }

    return {
      id: `kyc-${response.tax_id ?? 'current'}`,
      provider: 'RetailIQ',
      status: mapKycStatus(response.status),
      submitted_at: response.updated_at ?? nowIso(),
      verified_at: response.status === 'VERIFIED' ? response.updated_at ?? undefined : undefined,
      reference_id: response.tax_id ?? 'KYC',
    };
  },

  getCreditScore: async (): Promise<CreditScore> => {
    const response = await requestRaw<{ score?: number; tier?: string; factors?: string[]; last_updated?: string }>({
      url: `${FINANCE_BASE}/credit-score`,
      method: 'GET',
    });

    return {
      score: Number(response.score ?? 0),
      max_score: 900,
      tier: response.tier,
      last_updated: response.last_updated ?? nowIso(),
      factors: Array.isArray(response.factors) ? response.factors : [],
    };
  },

  refreshCreditScore: async (): Promise<CreditScore> => {
    await requestRaw<{ score?: number }>({ url: `${FINANCE_BASE}/credit-score/refresh`, method: 'POST' });
    return financeApi.getCreditScore();
  },

  getCreditLedger: async (): Promise<CreditLedger> => {
    const dashboard = await fetchFinanceDashboard();
    const totalDebt = Number(dashboard.total_debt ?? 0);

    return {
      balance: totalDebt,
      available_credit: 0,
      total_credit_limit: totalDebt,
      pending_charges: totalDebt,
      currency: 'INR',
    };
  },

  getCreditTransactions: async (): Promise<CreditTransaction[]> => {
    const response = await requestRaw<RawLedgerEntry[]>({
      url: `${FINANCE_BASE}/ledger`,
      method: 'GET',
    });

    return Array.isArray(response)
      ? response.map((entry) => ({
          id: String(entry.id),
          type: entry.type === 'DEBIT' ? 'DEBIT' : entry.type === 'PAYMENT' ? 'PAYMENT' : 'CREDIT',
          amount: Number(entry.amount ?? 0),
          description: entry.description ?? 'Ledger entry',
          created_at: entry.created_at ?? nowIso(),
          balance_after: Number(entry.amount ?? 0),
        }))
      : [];
  },

  getLoanProducts: async (): Promise<LoanProduct[]> => [],

  getLoanApplications: async (): Promise<LoanApplication[]> => {
    const response = await requestRaw<RawLoanApplication[]>({ url: `${FINANCE_BASE}/loans`, method: 'GET' });
    return Array.isArray(response) ? response.map(mapLoan) : [];
  },

  disburseLoan: async (loanId: string): Promise<{ ledger_txn_id?: string; message: string }> => {
    const response = await requestRaw<{ ledger_txn_id?: string; message?: string }>({
      url: `${FINANCE_BASE}/loans/${loanId}/disburse`,
      method: 'POST',
    });

    return {
      ledger_txn_id: response.ledger_txn_id,
      message: response.message ?? 'Loan disbursed',
    };
  },

  applyForLoan: async (data: LoanApplicationRequest): Promise<LoanApplication> => {
    const termMonths = Number.parseInt(data.tenure_months, 10) || 0;
    const response = await requestRaw<{ application_id?: string | number; status?: string }>({
      url: `${FINANCE_BASE}/loans/apply`,
      method: 'POST',
      data: {
        product_id: data.product_id,
        amount: data.amount,
        term_days: Math.max(termMonths, 1) * 30,
      },
    });

    return {
      id: String(response.application_id ?? `loan-${Date.now()}`),
      product_id: data.product_id,
      amount: data.amount,
      tenure_months: termMonths,
      status: mapLoanStatus(response.status),
      submitted_at: nowIso(),
    };
  },

  getLoanApplication: async (applicationId: string): Promise<LoanApplication> => {
    const applications = await financeApi.getLoanApplications();
    const match = applications.find((application) => application.id === applicationId);
    if (!match) {
      throw new Error('Loan application not found.');
    }
    return match;
  },

  getFinancialAccounts: async (): Promise<FinancialAccount[]> => {
    const response = await requestRaw<RawAccount[]>({ url: `${FINANCE_BASE}/accounts`, method: 'GET' });

    return Array.isArray(response)
      ? response.map((account) => ({
          id: String(account.id),
          type: mapAccountType(account.type),
          name: `${account.type ?? 'Account'} Account`,
          balance: Number(account.balance ?? 0),
          currency: 'INR',
          is_active: true,
        }))
      : [];
  },

  getLedgerEntries: async (accountId?: string): Promise<LedgerEntry[]> => {
    const response = await requestRaw<RawLedgerEntry[]>({
      url: `${FINANCE_BASE}/ledger`,
      method: 'GET',
      params: accountId ? { account_id: accountId } : undefined,
    });

    return Array.isArray(response)
      ? response.map((entry) => ({
          id: String(entry.id),
          account_id: String(entry.account_id ?? ''),
          entry_type: mapLedgerEntryType(entry.type),
          amount: Number(entry.amount ?? 0),
          description: entry.description ?? '',
          reference_id: entry.txn_id,
          created_at: entry.created_at ?? nowIso(),
          balance_after: Number(entry.balance_after ?? entry.amount ?? 0),
        }))
      : [];
  },

  getTreasuryBalance: async (): Promise<TreasuryBalance> => {
    const response = await requestRaw<{ available?: number; yield_bps?: number; currency?: string }>({
      url: `${FINANCE_BASE}/treasury/balance`,
      method: 'GET',
    });

    const available = Number(response.available ?? 0);

    return {
      total_balance: available,
      available_balance: available,
      reserved_amount: 0,
      pending_transfers: 0,
      currency: response.currency ?? 'INR',
      last_updated: nowIso(),
      yield_bps: response.yield_bps,
    };
  },

  getFinanceDashboard: async (): Promise<FinanceDashboard> => {
    const response = await fetchFinanceDashboard();
    return {
      cash_on_hand: Number(response.cash_on_hand ?? 0),
      treasury_balance: Number(response.treasury_balance ?? 0),
      total_debt: Number(response.total_debt ?? 0),
      credit_score: Number(response.credit_score ?? 0),
    };
  },

  getTreasuryConfig: async (): Promise<TreasuryConfig> => {
    const response = await requestRaw<{
      auto_transfer_enabled?: boolean;
      reserve_percentage?: number;
      daily_transfer_limit?: number;
      settlement_account_id?: string;
      strategy?: string;
      sweep_threshold?: number;
      created_at?: string;
    }>({
      url: `${FINANCE_BASE}/treasury/config`,
      method: 'GET',
    });

    return {
      auto_transfer_enabled: Boolean(response.auto_transfer_enabled ?? false),
      reserve_percentage: Number(response.reserve_percentage ?? 0),
      daily_transfer_limit: Number(response.daily_transfer_limit ?? 0),
      settlement_account_id: response.settlement_account_id ?? '',
      strategy: response.strategy,
      sweep_threshold: response.sweep_threshold,
      created_at: response.created_at,
    };
  },

  updateTreasuryConfig: async (data: Partial<TreasuryConfig>): Promise<TreasuryConfig> => {
    await requestRaw<{ active?: boolean }>({
      url: `${FINANCE_BASE}/treasury/sweep-config`,
      method: 'PUT',
      data: {
        strategy: data.auto_transfer_enabled ? 'AUTO' : 'MANUAL',
        min_balance: data.daily_transfer_limit ?? 0,
      },
    });

    return {
      ...defaultTreasuryConfig(),
      ...data,
    };
  },

  getTreasuryTransactions: async (): Promise<TreasuryTransaction[]> => {
    const response = await requestRaw<TreasuryTransaction[]>({
      url: `${FINANCE_BASE}/treasury/transactions`,
      method: 'GET',
    });

    return Array.isArray(response)
      ? response.map((txn) => ({
          id: String(txn.id),
          type: txn.type,
          amount: Number(txn.amount ?? 0),
          description: txn.description ?? 'Treasury transaction',
          status: txn.status ?? 'COMPLETED',
          created_at: txn.created_at ?? nowIso(),
          completed_at: txn.completed_at ?? txn.created_at ?? nowIso(),
        }))
      : [];
  },

};
