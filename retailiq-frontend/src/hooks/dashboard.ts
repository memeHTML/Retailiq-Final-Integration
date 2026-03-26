import { useQuery } from '@tanstack/react-query';
import * as dashboardApi from '@/api/dashboard';
import { analyticsApi } from '@/api/analytics';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  overview: () => [...dashboardKeys.all, 'overview'] as const,
  alerts: () => [...dashboardKeys.all, 'alerts'] as const,
  signals: () => [...dashboardKeys.all, 'signals'] as const,
  forecasts: () => [...dashboardKeys.all, 'forecasts'] as const,
  incidents: () => [...dashboardKeys.all, 'incidents'] as const,
  alertsFeed: (limit: number) => [...dashboardKeys.all, 'alerts-feed', limit] as const,
  analytics: (period: string) => ['analytics', 'dashboard', period] as const,
  revenueTrend: (period: string) => ['analytics', 'revenue-trend', period] as const,
};

export const useDashboardOverview = () =>
  useQuery({ queryKey: dashboardKeys.overview(), queryFn: dashboardApi.getDashboardOverview, staleTime: 30_000, refetchInterval: 30_000 });

export const useDashboardAlerts = () =>
  useQuery({ queryKey: dashboardKeys.alerts(), queryFn: dashboardApi.getDashboardAlerts, staleTime: 30_000, refetchInterval: 30_000 });

export const useLiveSignals = () =>
  useQuery({ queryKey: dashboardKeys.signals(), queryFn: dashboardApi.getDashboardSignals, staleTime: 30_000, refetchInterval: 30_000 });

export const useDashboardForecasts = () =>
  useQuery({ queryKey: dashboardKeys.forecasts(), queryFn: dashboardApi.getDashboardForecasts, staleTime: 120_000 });

export const useDashboardIncidents = () =>
  useQuery({ queryKey: dashboardKeys.incidents(), queryFn: dashboardApi.getDashboardIncidents, staleTime: 30_000, refetchInterval: 30_000 });

export const useAlertFeed = (limit = 20) =>
  useQuery({ queryKey: dashboardKeys.alertsFeed(limit), queryFn: () => dashboardApi.getDashboardAlertsFeed(limit), staleTime: 30_000 });

export const useAnalyticsDashboard = (period = '30d') =>
  useQuery({ queryKey: dashboardKeys.analytics(period), queryFn: () => analyticsApi.getAnalyticsDashboard(period), staleTime: 30_000 });

export const useRevenueTrend = (period = '30d') =>
  useQuery({ queryKey: dashboardKeys.revenueTrend(period), queryFn: () => analyticsApi.getRevenueTrend(period), staleTime: 30_000 });

// Backwards-compatible aliases used by existing pages.
export const useDashboardOverviewQuery = useDashboardOverview;
export const useDashboardAlertsQuery = useDashboardAlerts;
export const useDashboardSignalsQuery = useLiveSignals;
export const useDashboardForecastsQuery = useDashboardForecasts;
export const useDashboardIncidentsQuery = useDashboardIncidents;
export const useDashboardAlertsFeedQuery = useAlertFeed;
