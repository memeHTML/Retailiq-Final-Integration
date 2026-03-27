import { useEffect, useMemo, useState } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { normalizeApiError } from '@/utils/errors';
import {
  useI18nCountries,
  useI18nCurrencies,
  useI18nPreferences,
  useI18nTranslations,
  useSetCountry,
  useSetCurrency,
  useSetLanguage,
} from '@/hooks/useI18n';
import type { SupportedCountry, SupportedCurrency } from '@/types/models';

const LOCALE_PRESETS = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ar', name: 'Arabic' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'pt', name: 'Portuguese' },
];

type TabKey = 'translations' | 'currencies' | 'countries';

const formatSelected = (value: string | null) => value ?? 'Not set';

export default function I18nPage() {
  const { locale, currencyCode, countryCode } = useI18nPreferences();
  const setLocale = useSetLanguage();
  const setCurrency = useSetCurrency();
  const setCountry = useSetCountry();
  const [activeTab, setActiveTab] = useState<TabKey>('translations');
  const [draftLocale, setDraftLocale] = useState(locale);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setDraftLocale(locale);
  }, [locale]);

  const translationsQuery = useI18nTranslations({ locale: draftLocale.trim() || locale });
  const currenciesQuery = useI18nCurrencies();
  const countriesQuery = useI18nCountries();

  const catalogEntries = useMemo(() => {
    const catalog = translationsQuery.data?.catalog ?? {};
    return Object.entries(catalog).filter(([key, value]) => {
      const needle = search.trim().toLowerCase();
      if (!needle) {
        return true;
      }

      return key.toLowerCase().includes(needle) || value.toLowerCase().includes(needle);
    });
  }, [search, translationsQuery.data]);

  const currencies = (currenciesQuery.data ?? []) as SupportedCurrency[];
  const countries = (countriesQuery.data ?? []) as SupportedCountry[];

  const applyLocale = () => {
    const nextLocale = draftLocale.trim();
    if (!nextLocale) {
      return;
    }

    setLocale(nextLocale);
  };

  return (
    <PageFrame
      title="Internationalization"
      subtitle="Manage translations, currencies, and supported countries."
      actions={
        <>
          <Badge variant="info">Locale: {locale}</Badge>
          <Badge variant="secondary">Currency: {formatSelected(currencyCode)}</Badge>
          <Badge variant="secondary">Country: {formatSelected(countryCode)}</Badge>
        </>
      }
    >
      <div className="button-row" style={{ marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <Button variant={activeTab === 'translations' ? 'primary' : 'secondary'} onClick={() => setActiveTab('translations')}>
          Translations
        </Button>
        <Button variant={activeTab === 'currencies' ? 'primary' : 'secondary'} onClick={() => setActiveTab('currencies')}>
          Currencies
        </Button>
        <Button variant={activeTab === 'countries' ? 'primary' : 'secondary'} onClick={() => setActiveTab('countries')}>
          Countries
        </Button>
      </div>

      {activeTab === 'translations' ? (
        <div className="stack">
          <Card>
            <CardHeader>
              <CardTitle>Language</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="stack">
                <p className="muted" style={{ margin: 0 }}>
                  Current locale preference: <strong>{locale}</strong>
                </p>
                <div className="grid grid--2" style={{ gap: '0.75rem', alignItems: 'end' }}>
                  <label className="stack" style={{ gap: '0.25rem' }}>
                    <span className="muted">Locale code</span>
                    <Input value={draftLocale} onChange={(event) => setDraftLocale(event.target.value)} placeholder="en" />
                  </label>
                  <div className="button-row" style={{ alignItems: 'end', flexWrap: 'wrap' }}>
                    <Button onClick={applyLocale}>Apply locale</Button>
                    <Button variant="secondary" onClick={() => setDraftLocale(locale)}>
                      Reset draft
                    </Button>
                  </div>
                </div>
                <div className="button-row" style={{ flexWrap: 'wrap' }}>
                  {LOCALE_PRESETS.map((preset) => (
                    <Button
                      key={preset.code}
                      variant={draftLocale === preset.code ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setDraftLocale(preset.code)}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
                <p className="muted" style={{ margin: 0 }}>
                  The backend does not expose a locale registry, so these presets are convenience shortcuts. Any valid locale code can be loaded.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="stack" style={{ gap: '0.5rem' }}>
                <CardTitle>Translation Catalog</CardTitle>
                <div className="grid grid--2" style={{ gap: '0.75rem', alignItems: 'end' }}>
                  <label className="stack" style={{ gap: '0.25rem' }}>
                    <span className="muted">Search keys or values</span>
                    <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search catalog" />
                  </label>
                  <div className="button-row" style={{ justifyContent: 'flex-end' }}>
                    <Button variant="secondary" onClick={() => void translationsQuery.refetch()} loading={translationsQuery.isFetching}>
                      Refresh
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {translationsQuery.isLoading ? (
                <SkeletonLoader variant="rect" height={260} />
              ) : translationsQuery.isError ? (
                <ErrorState error={normalizeApiError(translationsQuery.error)} onRetry={() => void translationsQuery.refetch()} />
              ) : catalogEntries.length === 0 ? (
                <EmptyState
                  title="No translations"
                  body={search ? 'No keys match your search.' : 'No translation catalog is available for this locale.'}
                />
              ) : (
                <DataTable
                  columns={[
                    { key: 'key', header: 'Key', render: ([key]: [string, string]) => <span className="muted">{key}</span> },
                    { key: 'value', header: 'Value', render: ([, value]: [string, string]) => value },
                  ]}
                  data={catalogEntries as Array<[string, string]>}
                  emptyMessage="No translations"
                />
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {activeTab === 'currencies' ? (
        <Card>
          <CardHeader>
            <div className="stack" style={{ gap: '0.5rem' }}>
              <CardTitle>Supported Currencies</CardTitle>
              <p className="muted" style={{ margin: 0 }}>
                Selected currency: <strong>{formatSelected(currencyCode)}</strong>
              </p>
            </div>
          </CardHeader>
          <CardContent>
            {currenciesQuery.isLoading ? (
              <SkeletonLoader variant="rect" height={220} />
            ) : currenciesQuery.isError ? (
              <ErrorState error={normalizeApiError(currenciesQuery.error)} onRetry={() => void currenciesQuery.refetch()} />
            ) : currencies.length === 0 ? (
              <EmptyState title="No currencies" body="Currency list is not available." />
            ) : (
              <DataTable
                columns={[
                  { key: 'code', header: 'Code', render: (row: SupportedCurrency) => row.code },
                  { key: 'name', header: 'Name', render: (row: SupportedCurrency) => row.name },
                  { key: 'symbol', header: 'Symbol', render: (row: SupportedCurrency) => row.symbol },
                  { key: 'decimal_places', header: 'Decimals', render: (row: SupportedCurrency) => row.decimal_places },
                  { key: 'action', header: '', render: (row: SupportedCurrency) => (
                    <Button variant={currencyCode === row.code ? 'primary' : 'secondary'} size="sm" onClick={() => setCurrency(row.code)}>
                      {currencyCode === row.code ? 'Selected' : 'Use'}
                    </Button>
                  ) },
                ]}
                data={currencies}
                emptyMessage="No currencies"
              />
            )}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === 'countries' ? (
        <Card>
          <CardHeader>
            <div className="stack" style={{ gap: '0.5rem' }}>
              <CardTitle>Supported Countries</CardTitle>
              <p className="muted" style={{ margin: 0 }}>
                Selected country: <strong>{formatSelected(countryCode)}</strong>
              </p>
            </div>
          </CardHeader>
          <CardContent>
            {countriesQuery.isLoading ? (
              <SkeletonLoader variant="rect" height={220} />
            ) : countriesQuery.isError ? (
              <ErrorState error={normalizeApiError(countriesQuery.error)} onRetry={() => void countriesQuery.refetch()} />
            ) : countries.length === 0 ? (
              <EmptyState title="No countries" body="Country list is not available." />
            ) : (
              <DataTable
                columns={[
                  { key: 'code', header: 'Code', render: (row: SupportedCountry) => row.code },
                  { key: 'name', header: 'Country', render: (row: SupportedCountry) => row.name },
                  { key: 'default_currency', header: 'Default currency', render: (row: SupportedCountry) => row.default_currency },
                  { key: 'default_locale', header: 'Default locale', render: (row: SupportedCountry) => row.default_locale },
                  { key: 'action', header: '', render: (row: SupportedCountry) => (
                    <Button variant={countryCode === row.code ? 'primary' : 'secondary'} size="sm" onClick={() => setCountry(row.code)}>
                      {countryCode === row.code ? 'Selected' : 'Use'}
                    </Button>
                  ) },
                ]}
                data={countries}
                emptyMessage="No countries"
              />
            )}
          </CardContent>
        </Card>
      ) : null}
    </PageFrame>
  );
}
