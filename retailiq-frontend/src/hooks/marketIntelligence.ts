/**
 * src/hooks/marketIntelligence.ts
 * React Query hooks for market intelligence operations.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { marketIntelligenceApi } from '@/api/marketIntelligence';

export const marketIntelligenceKeys = {
  all: ['marketIntelligence'] as const,
  summary: () => [...marketIntelligenceKeys.all, 'summary'] as const,
  signals: (params?: { category_id?: number | string; signal_type?: string; limit?: number }) =>
    [...marketIntelligenceKeys.all, 'signals', params ?? {}] as const,
  indices: (params?: { category_id?: number | string; days?: number }) =>
    [...marketIntelligenceKeys.all, 'indices', params ?? {}] as const,
  alerts: (params?: { unacknowledged_only?: boolean }) => [...marketIntelligenceKeys.all, 'alerts', params ?? {}] as const,
  competitors: (region?: string) => [...marketIntelligenceKeys.all, 'competitors', region ?? 'all'] as const,
  competitor: (id: string | number) => [...marketIntelligenceKeys.all, 'competitor', id] as const,
  forecasts: (params?: { product_id?: number | string; to_period?: string }) =>
    [...marketIntelligenceKeys.all, 'forecasts', params ?? {}] as const,
  recommendations: () => [...marketIntelligenceKeys.all, 'recommendations'] as const,
};

export const useMarketSummaryQuery = () =>
  useQuery({
    queryKey: marketIntelligenceKeys.summary(),
    queryFn: () => marketIntelligenceApi.getMarketSummary(),
    staleTime: 5 * 60 * 1000,
  });

export const usePriceSignalsQuery = (params?: {
  category_id?: number | string;
  signal_type?: string;
  limit?: number;
}) =>
  useQuery({
    queryKey: marketIntelligenceKeys.signals(params),
    queryFn: () => marketIntelligenceApi.getPriceSignals(params),
    staleTime: 60 * 1000,
  });

export const usePriceIndicesQuery = (params?: {
  category_id?: number | string;
  days?: number;
}) =>
  useQuery({
    queryKey: marketIntelligenceKeys.indices(params),
    queryFn: () => marketIntelligenceApi.getPriceIndices(params),
    staleTime: 5 * 60 * 1000,
  });

export const useComputePriceIndexMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { category_id: number | string }) => marketIntelligenceApi.computePriceIndex(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: marketIntelligenceKeys.indices() });
    },
  });
};

export const useMarketAlertsQuery = (params?: { unacknowledged_only?: boolean }) =>
  useQuery({
    queryKey: marketIntelligenceKeys.alerts(params),
    queryFn: () => marketIntelligenceApi.getAlerts(params),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

export const useAcknowledgeAlertMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string | number) => marketIntelligenceApi.acknowledgeAlert(alertId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: marketIntelligenceKeys.alerts() });
    },
  });
};

export const useCompetitorsQuery = (region?: string) =>
  useQuery({
    queryKey: marketIntelligenceKeys.competitors(region),
    queryFn: () => marketIntelligenceApi.getCompetitors(region),
    staleTime: 10 * 60 * 1000,
  });

export const useCompetitorDetailQuery = (competitorId: string | number) =>
  useQuery({
    queryKey: marketIntelligenceKeys.competitor(competitorId),
    queryFn: () => marketIntelligenceApi.getCompetitorDetail(competitorId),
    enabled: Boolean(competitorId),
    staleTime: 5 * 60 * 1000,
  });

export const useDemandForecastsQuery = (params?: {
  product_id?: number | string;
  to_period?: string;
}) =>
  useQuery({
    queryKey: marketIntelligenceKeys.forecasts(params),
    queryFn: () => marketIntelligenceApi.getDemandForecasts(params),
    staleTime: 5 * 60 * 1000,
  });

export const useGenerateForecastMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { product_id: number | string; forecast_period: string }) =>
      marketIntelligenceApi.generateForecast(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: marketIntelligenceKeys.forecasts() });
    },
  });
};

export const useRecommendationsQuery = () =>
  useQuery({
    queryKey: marketIntelligenceKeys.recommendations(),
    queryFn: () => marketIntelligenceApi.getRecommendations(),
    staleTime: 10 * 60 * 1000,
  });
