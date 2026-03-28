import { request } from '@/api/client';
import type {
  GetDashboardAlertsResponse,
  GetDashboardForecastsResponse,
  GetDashboardIncidentsResponse,
  GetDashboardOverviewResponse,
  GetDashboardSignalsResponse,
} from '@/types/api';

const BASE = '/api/v1/dashboard';

export const getDashboardOverview = () =>
  request<GetDashboardOverviewResponse>({ url: `${BASE}/overview`, method: 'GET' });

export const getDashboardAlerts = () =>
  request<GetDashboardAlertsResponse>({ url: `${BASE}/alerts`, method: 'GET' });

export const getDashboardSignals = () =>
  request<GetDashboardSignalsResponse>({ url: `${BASE}/live-signals`, method: 'GET' });
export const getLiveSignals = getDashboardSignals;

export const getDashboardForecasts = () =>
  request<GetDashboardForecastsResponse>({ url: `${BASE}/forecasts/stores`, method: 'GET' });
export const getStoreForecastSummary = getDashboardForecasts;

export const getDashboardIncidents = () =>
  request<GetDashboardIncidentsResponse>({ url: `${BASE}/incidents/active`, method: 'GET' });
export const getActiveIncidents = getDashboardIncidents;

export const getDashboardAlertsFeed = (limit = 20) =>
  request<GetDashboardAlertsResponse>({ url: `${BASE}/alerts/feed`, method: 'GET', params: { limit } });
export const getAlertFeed = getDashboardAlertsFeed;
