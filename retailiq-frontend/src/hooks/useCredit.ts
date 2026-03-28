export * from '@/hooks/credit';
import { useCreditAccountQuery, useCreditTransactionsQuery } from '@/hooks/credit';

export const useCustomerCreditAccount = useCreditAccountQuery;
export const useCustomerCreditTransactions = useCreditTransactionsQuery;
