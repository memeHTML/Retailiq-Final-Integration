/* @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import I18nPage from './I18nPage';

const setLocaleMock = vi.fn();
const setCurrencyMock = vi.fn();
const setCountryMock = vi.fn();
const refetchTranslations = vi.fn();
const refetchCurrencies = vi.fn();
const refetchCountries = vi.fn();

const queryState = {
  translations: {
    data: { locale: 'en', catalog: { greeting: 'Hello', goodbye: 'Goodbye' } },
    error: null,
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: refetchTranslations,
  },
  currencies: {
    data: [
      { code: 'USD', name: 'US Dollar', symbol: '$', decimal_places: 2, symbol_position: 'prefix' },
      { code: 'INR', name: 'Indian Rupee', symbol: 'Rs', decimal_places: 2, symbol_position: 'prefix' },
    ],
    error: null,
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: refetchCurrencies,
  },
  countries: {
    data: [
      { code: 'US', name: 'United States', default_currency: 'USD', default_locale: 'en', timezone: 'America/New_York', phone_code: '+1', date_format: 'MM/DD/YYYY' },
      { code: 'IN', name: 'India', default_currency: 'INR', default_locale: 'en', timezone: 'Asia/Kolkata', phone_code: '+91', date_format: 'DD/MM/YYYY' },
    ],
    error: null,
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: refetchCountries,
  },
};

vi.mock('@/hooks/useI18n', () => ({
  useI18nPreferences: () => ({ locale: 'en', currencyCode: 'USD', countryCode: 'IN' }),
  useSetLanguage: () => setLocaleMock,
  useSetCurrency: () => setCurrencyMock,
  useSetCountry: () => setCountryMock,
  useI18nTranslations: () => queryState.translations,
  useI18nCurrencies: () => queryState.currencies,
  useI18nCountries: () => queryState.countries,
}));

describe('I18nPage', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('changes the locale preference and renders translation catalogs', async () => {
    const user = userEvent.setup();

    render(<I18nPage />);

    expect(screen.getByRole('heading', { name: 'Internationalization' })).toBeTruthy();
    expect(screen.getByText('Hello')).toBeTruthy();
    expect(screen.getByText('Goodbye')).toBeTruthy();

    await user.clear(screen.getByLabelText(/locale code/i));
    await user.type(screen.getByLabelText(/locale code/i), 'hi');
    await user.click(screen.getByRole('button', { name: /apply locale/i }));

    expect(setLocaleMock).toHaveBeenCalledWith('hi');
  });

  it('lets the user select canonical currency and country preferences', async () => {
    const user = userEvent.setup();

    render(<I18nPage />);

    await user.click(screen.getByRole('button', { name: /currencies/i }));
    await user.click(screen.getByRole('button', { name: /^use$/i }));
    expect(setCurrencyMock).toHaveBeenCalledWith('INR');

    await user.click(screen.getByRole('button', { name: /countries/i }));
    await user.click(screen.getByRole('button', { name: /^use$/i }));
    expect(setCountryMock).toHaveBeenCalledWith('US');
  });
});
