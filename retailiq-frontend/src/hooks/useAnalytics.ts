import { useQuery } from '@tanstack/react-query';
import { analyticsApi, analyticsKeys } from '@/api/analytics';
import type { AnalyticsWindowInput } from '@/types/analytics';

export { analyticsKeys } from '@/api/analytics';

export const useAnalyticsDashboard = (scope?: AnalyticsWindowInput) =>
  useQuery({
    queryKey: analyticsKeys.dashboard(scope),
    queryFn: () => analyticsApi.getAnalyticsDashboard(scope),
    staleTime: 30_000,
  });

export const useRevenue = (scope?: AnalyticsWindowInput) =>
  useQuery({
    queryKey: analyticsKeys.revenue(scope),
    queryFn: () => analyticsApi.getRevenue(scope),
    staleTime: 30_000,
  });

export const useProfit = (scope?: AnalyticsWindowInput) =>
  useQuery({
    queryKey: analyticsKeys.profit(scope),
    queryFn: () => analyticsApi.getProfit(scope),
    staleTime: 30_000,
  });

export const useTopProducts = (scope?: AnalyticsWindowInput, options: { limit?: number; metric?: 'revenue' | 'quantity' | 'profit' } = {}) =>
  useQuery({
    queryKey: [...analyticsKeys.topProducts(scope), options.limit ?? 10, options.metric ?? 'revenue'] as const,
    queryFn: () => analyticsApi.getTopProducts(scope, options),
    staleTime: 30_000,
  });

export const useCategoryBreakdown = (scope?: AnalyticsWindowInput) =>
  useQuery({
    queryKey: analyticsKeys.categoryBreakdown(scope),
    queryFn: () => analyticsApi.getCategoryBreakdown(scope),
    staleTime: 30_000,
  });

export const usePaymentModes = (scope?: AnalyticsWindowInput) =>
  useQuery({
    queryKey: analyticsKeys.paymentModes(scope),
    queryFn: () => analyticsApi.getPaymentModes(scope),
    staleTime: 30_000,
  });

export const useCustomerSummaryAnalytics = (scope?: AnalyticsWindowInput) =>
  useQuery({
    queryKey: analyticsKeys.customerSummary(scope),
    queryFn: () => analyticsApi.getCustomerSummaryAnalytics(scope),
    staleTime: 30_000,
  });

export const useAnalyticsDiagnostics = (scope?: AnalyticsWindowInput) =>
  useQuery({
    queryKey: analyticsKeys.diagnostics(scope),
    queryFn: () => analyticsApi.getAnalyticsDiagnostics(scope),
    staleTime: 30_000,
  });

export const useContribution = (scope?: AnalyticsWindowInput) =>
  useQuery({
    queryKey: [...analyticsKeys.all, 'contribution', ...(scope ? [scope] : [])] as const,
    queryFn: () => analyticsApi.getContribution(scope),
    staleTime: 30_000,
  });

export default useAnalyticsDashboard;

