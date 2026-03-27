import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as i18nApi from '@/api/i18n';
import { i18nStore } from '@/stores/i18nStore';
import type { ListTranslationsRequest } from '@/types/api';
import type { SupportedCountry, SupportedCurrency } from '@/types/models';

export const useI18nTranslations = (params: ListTranslationsRequest = {}) =>
  useQuery({
    queryKey: ['i18n', 'translations', params],
    queryFn: () => i18nApi.getTranslations(params),
    staleTime: 300_000,
  });

export const useI18nCurrencies = () =>
  useQuery({
    queryKey: ['i18n', 'currencies'],
    queryFn: () => i18nApi.getSupportedCurrencies(),
    staleTime: 300_000,
  });

export const useI18nCountries = () =>
  useQuery({
    queryKey: ['i18n', 'countries'],
    queryFn: () => i18nApi.getSupportedCountries(),
    staleTime: 300_000,
  });

export const useI18nPreferences = () =>
  i18nStore((state) => ({
    locale: state.locale,
    currencyCode: state.currencyCode,
    countryCode: state.countryCode,
  }));

export const useSetLanguage = () => i18nStore((state) => state.setLocale);
export const useSetCurrency = () => i18nStore((state) => state.setCurrencyCode);
export const useSetCountry = () => i18nStore((state) => state.setCountryCode);
export const useResetI18nPreferences = () => i18nStore((state) => state.resetPreferences);

export const useI18nQueryClient = () => useQueryClient();

export type I18nCurrency = SupportedCurrency;
export type I18nCountry = SupportedCountry;
