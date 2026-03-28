/**
 * src/hooks/transactions.ts
 * Oracle Document sections consumed: 3, 4, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as transactionsApi from '@/api/transactions';
import type {
  BatchTransactionCreateRequest,
  CreateTransactionRequest,
  CreateTransactionReturnRequest,
  CreateTransactionReturnResponse,
  GetDailyTransactionSummaryRequest,
  ListTransactionsRequest,
} from '@/types/api';

export const useTransactionsQuery = (filters: ListTransactionsRequest) => useQuery({ queryKey: ['transactions', 'list', filters], queryFn: () => transactionsApi.listTransactions(filters), staleTime: 30_000 });
export const useTransactionQuery = (transactionId: string | number) => useQuery({ queryKey: ['transactions', 'detail', transactionId], queryFn: () => transactionsApi.getTransactionById(transactionId), staleTime: 30_000, enabled: Boolean(transactionId) });
export const useDailySummaryQuery = (filters: GetDailyTransactionSummaryRequest = {}) => useQuery({ queryKey: ['transactions', 'daily-summary', filters], queryFn: () => transactionsApi.getDailyTransactionSummary(filters), staleTime: 30_000 });

export const useCreateTransactionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTransactionRequest) => transactionsApi.createTransaction(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['transactions', 'daily-summary'] });
    },
  });
};

export const useCreateBatchTransactionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BatchTransactionCreateRequest) => transactionsApi.createTransactionBatch(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', 'list'] });
    },
  });
};

export const useCreateTransactionReturnMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ transactionId, payload }: { transactionId: string | number; payload: CreateTransactionReturnRequest }) => transactionsApi.createTransactionReturn(transactionId, payload),
    onSuccess: (_data: CreateTransactionReturnResponse, variables: { transactionId: string | number; payload: CreateTransactionReturnRequest }) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', 'detail', variables.transactionId] });
      queryClient.invalidateQueries({ queryKey: ['transactions', 'list'] });
    },
  });
};
