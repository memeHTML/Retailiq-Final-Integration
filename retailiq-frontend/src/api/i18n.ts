import { request } from '@/api/client';
import type {
  GetSupportedCountriesResponse,
  GetSupportedCurrenciesResponse,
  GetTranslationsResponse,
  ListTranslationsRequest,
} from '@/types/api';

const BASE = '/api/v1/i18n';

const unwrapArrayResponse = <T>(payload: unknown): T[] => {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === 'object' && 'data' in payload && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: T[] }).data;
  }

  return [];
};

export const getTranslations = (params: ListTranslationsRequest = {}) =>
  request<GetTranslationsResponse>({ url: `${BASE}/i18n/translations`, method: 'GET', params });

export const getSupportedCurrencies = async (): Promise<GetSupportedCurrenciesResponse> => {
  const response = await request<unknown>({ url: `${BASE}/i18n/currencies`, method: 'GET' });
  return unwrapArrayResponse(response);
};

export const getSupportedCountries = async (): Promise<GetSupportedCountriesResponse> => {
  const response = await request<unknown>({ url: `${BASE}/i18n/countries`, method: 'GET' });
  return unwrapArrayResponse(response);
};
