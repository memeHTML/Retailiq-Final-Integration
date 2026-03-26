import { useMutation, useQuery } from '@tanstack/react-query';
import * as taxApi from '@/api/tax';

export const taxKeys = {
  all: ['tax'] as const,
  config: (countryCode: string) => [...taxKeys.all, 'config', countryCode] as const,
  filingSummary: (period: string, countryCode: string) => [...taxKeys.all, 'filing-summary', period, countryCode] as const,
};

export const useTaxConfig = (countryCode = 'IN') =>
  useQuery({
    queryKey: taxKeys.config(countryCode),
    queryFn: () => taxApi.getTaxConfig(countryCode),
    staleTime: 60_000,
  });

export const useTaxFilingSummary = (period: string, countryCode = 'IN') =>
  useQuery({
    queryKey: taxKeys.filingSummary(period, countryCode),
    queryFn: () => taxApi.getTaxFilingSummary(period, countryCode),
    enabled: Boolean(period),
    staleTime: 300_000,
  });

export const useCalculateTax = () =>
  useMutation({
    mutationFn: taxApi.calculateTax,
  });

export const useTaxConfigQuery = useTaxConfig;
export const useTaxFilingSummaryQuery = useTaxFilingSummary;
export const useCalculateTaxMutation = useCalculateTax;
