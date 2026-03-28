import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as customersApi from '@/api/customers';
import type {
  CreateCustomerRequest,
  CustomerTransactionsRequest,
  ListCustomersRequest,
  TopCustomersRequest,
  UpdateCustomerRequest,
} from '@/types/api';

export const useCustomersQuery = (filters: ListCustomersRequest = {}) =>
  useQuery({ queryKey: ['customers', 'list', filters], queryFn: () => customersApi.listCustomers(filters), staleTime: 60_000 });

export const useCustomerQuery = (customerId: number | string) =>
  useQuery({ queryKey: ['customers', 'detail', customerId], queryFn: () => customersApi.getCustomer(customerId), staleTime: 60_000, enabled: Boolean(customerId) });

export const useCustomerTransactionsQuery = (customerId: number | string, params: CustomerTransactionsRequest = {}) =>
  useQuery({ queryKey: ['customers', 'transactions', customerId, params], queryFn: () => customersApi.getCustomerTransactions(customerId, params), staleTime: 60_000, enabled: Boolean(customerId) });

export const useCustomerSummaryQuery = (customerId: number | string) =>
  useQuery({ queryKey: ['customers', 'summary', customerId], queryFn: () => customersApi.getCustomerSummary(customerId), staleTime: 60_000, enabled: Boolean(customerId) });

export const useTopCustomersQuery = (params: TopCustomersRequest = {}) =>
  useQuery({ queryKey: ['customers', 'top', params], queryFn: () => customersApi.getTopCustomers(params), staleTime: 60_000 });

export const useCustomerAnalyticsQuery = () =>
  useQuery({ queryKey: ['customers', 'analytics'], queryFn: () => customersApi.getCustomerAnalytics(), staleTime: 120_000 });

export const useCreateCustomerMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCustomerRequest) => customersApi.createCustomer(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); },
  });
};

export const useUpdateCustomerMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, data }: { customerId: number | string; data: UpdateCustomerRequest }) => customersApi.updateCustomer(customerId, data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['customers', 'list'] });
      qc.invalidateQueries({ queryKey: ['customers', 'detail', vars.customerId] });
    },
  });
};
