import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const memoryStorage = {
  getItem: (_name: string) => null,
  setItem: (_name: string, _value: string) => undefined,
  removeItem: (_name: string) => undefined,
};

export interface I18nState {
  locale: string;
  currencyCode: string | null;
  countryCode: string | null;
  setLocale: (locale: string) => void;
  setCurrencyCode: (currencyCode: string | null) => void;
  setCountryCode: (countryCode: string | null) => void;
  resetPreferences: () => void;
}

const DEFAULT_STATE = {
  locale: 'en',
  currencyCode: null,
  countryCode: null,
};

export const i18nStore = create<I18nState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,
      setLocale: (locale: string) => set({ locale }),
      setCurrencyCode: (currencyCode: string | null) => set({ currencyCode }),
      setCountryCode: (countryCode: string | null) => set({ countryCode }),
      resetPreferences: () => set(DEFAULT_STATE),
    }),
    {
      name: 'retailiq-i18n-preferences',
      storage: createJSONStorage(() => (typeof window === 'undefined' ? memoryStorage : window.localStorage)),
      partialize: (state) => ({
        locale: state.locale,
        currencyCode: state.currencyCode,
        countryCode: state.countryCode,
      }),
    },
  ),
);
