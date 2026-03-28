export * from '@/hooks/loyalty';
import { useLoyaltyAccountQuery, useLoyaltyTransactionsQuery } from '@/hooks/loyalty';

export const useCustomerLoyaltyAccount = useLoyaltyAccountQuery;
export const useCustomerLoyaltyTransactions = useLoyaltyTransactionsQuery;
