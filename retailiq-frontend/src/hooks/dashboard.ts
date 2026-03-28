import { useQuery } from '@tanstack/react-query';
import * as dashboardApi from '@/api/dashboard';

export const useDashboardOverviewQuery = () =>
  useQuery({ queryKey: ['dashboard', 'overview'], queryFn: () => dashboardApi.getDashboardOverview(), staleTime: 30_000, refetchInterval: 30_000 });

export const useDashboardAlertsQuery = () =>
  useQuery({ queryKey: ['dashboard', 'alerts'], queryFn: () => dashboardApi.getDashboardAlerts(), staleTime: 30_000, refetchInterval: 30_000 });

export const useDashboardSignalsQuery = () =>
  useQuery({ queryKey: ['dashboard', 'signals'], queryFn: () => dashboardApi.getDashboardSignals(), staleTime: 30_000, refetchInterval: 30_000 });

export const useDashboardForecastsQuery = () =>
  useQuery({ queryKey: ['dashboard', 'forecasts'], queryFn: () => dashboardApi.getDashboardForecasts(), staleTime: 120_000 });

export const useDashboardIncidentsQuery = () =>
  useQuery({ queryKey: ['dashboard', 'incidents'], queryFn: () => dashboardApi.getDashboardIncidents(), staleTime: 30_000, refetchInterval: 30_000 });

export const useDashboardAlertsFeedQuery = (limit = 20) =>
  useQuery({ queryKey: ['dashboard', 'alerts-feed', limit], queryFn: () => dashboardApi.getDashboardAlertsFeed(limit), staleTime: 30_000 });
