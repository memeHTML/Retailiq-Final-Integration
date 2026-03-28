import { useMemo, useState } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  useAcknowledgeAlertMutation,
  useCompetitorDetailQuery,
  useCompetitorsQuery,
  useComputePriceIndexMutation,
  useDemandForecastsQuery,
  useGenerateForecastMutation,
  useMarketAlertsQuery,
  useMarketSummaryQuery,
  usePriceIndicesQuery,
  usePriceSignalsQuery,
  useRecommendationsQuery,
} from '@/hooks/marketIntelligence';
import { uiStore } from '@/stores/uiStore';
import { formatDate } from '@/utils/dates';
import { normalizeApiError } from '@/utils/errors';
import { formatCurrency } from '@/utils/numbers';
import type {
  CompetitorAnalysis,
  DemandForecast,
  MarketAlert,
  MarketRecommendation,
  MarketSignal,
  PriceIndex,
} from '@/api/marketIntelligence';

export default function MarketIntelligencePage() {
  const addToast = uiStore((state) => state.addToast);
  const [activeTab, setActiveTab] = useState<'overview' | 'signals' | 'indices' | 'alerts' | 'competitors' | 'forecasts' | 'recommendations'>('overview');
  const [signalCategoryId, setSignalCategoryId] = useState('');
  const [signalType, setSignalType] = useState('');
  const [signalLimit, setSignalLimit] = useState('25');
  const [indexCategoryId, setIndexCategoryId] = useState('');
  const [indexDays, setIndexDays] = useState('30');
  const [alertsOnlyUnacknowledged, setAlertsOnlyUnacknowledged] = useState(true);
  const [competitorRegion, setCompetitorRegion] = useState('');
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string>('');
  const [forecastProductId, setForecastProductId] = useState('');
  const [forecastToPeriod, setForecastToPeriod] = useState('next_30_days');
  const [recommendationType, setRecommendationType] = useState('');

  const parseOptionalNumber = (value: string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  };

  const summaryQuery = useMarketSummaryQuery();
  const signalsQuery = usePriceSignalsQuery({
    category_id: signalCategoryId.trim() || undefined,
    signal_type: signalType.trim() || undefined,
    limit: parseOptionalNumber(signalLimit),
  });
  const indicesQuery = usePriceIndicesQuery({
    category_id: indexCategoryId.trim() || undefined,
    days: parseOptionalNumber(indexDays),
  });
  const alertsQuery = useMarketAlertsQuery({ unacknowledged_only: alertsOnlyUnacknowledged });
  const competitorsQuery = useCompetitorsQuery(competitorRegion.trim() || undefined);
  const competitorDetailQuery = useCompetitorDetailQuery(selectedCompetitorId);
  const forecastsQuery = useDemandForecastsQuery({
    product_id: forecastProductId.trim() || undefined,
    to_period: forecastToPeriod.trim() || undefined,
  });
  const recommendationsQuery = useRecommendationsQuery();

  const acknowledgeAlertMutation = useAcknowledgeAlertMutation();
  const computeIndexMutation = useComputePriceIndexMutation();
  const generateForecastMutation = useGenerateForecastMutation();

  const summaryEntries = useMemo(
    () => Object.entries(summaryQuery.data?.signals_last_24h ?? {}).sort(([left], [right]) => left.localeCompare(right)),
    [summaryQuery.data],
  );

  const signalColumns = useMemo<Column<MarketSignal>[]>(
    () => [
      { key: 'signal_type', header: 'Signal Type', render: (row) => row.signal_type },
      { key: 'source_id', header: 'Source', render: (row) => String(row.source_id ?? '-') },
      { key: 'category_id', header: 'Category', render: (row) => String(row.category_id ?? '-') },
      { key: 'region_code', header: 'Region', render: (row) => row.region_code ?? '-' },
      { key: 'value', header: 'Value', render: (row) => (row.value == null ? '-' : row.value.toFixed(2)) },
      { key: 'confidence', header: 'Confidence', render: (row) => (row.confidence == null ? '-' : `${Math.round(row.confidence * 100)}%`) },
      { key: 'quality_score', header: 'Quality', render: (row) => (row.quality_score == null ? '-' : row.quality_score.toFixed(2)) },
      { key: 'timestamp', header: 'Timestamp', render: (row) => formatDate(row.timestamp) },
    ],
    [],
  );

  const indexColumns = useMemo<Column<PriceIndex>[]>(
    () => [
      { key: 'category_id', header: 'Category', render: (row) => String(row.category_id ?? '-') },
      { key: 'region_code', header: 'Region', render: (row) => row.region_code ?? '-' },
      { key: 'index_value', header: 'Index Value', render: (row) => (row.index_value == null ? '-' : row.index_value.toFixed(2)) },
      { key: 'computation_method', header: 'Method', render: (row) => row.computation_method ?? '-' },
      { key: 'computed_at', header: 'Computed At', render: (row) => formatDate(row.computed_at) },
    ],
    [],
  );

  const alertColumns = useMemo<Column<MarketAlert>[]>(
    () => [
      { key: 'alert_type', header: 'Alert Type', render: (row) => row.alert_type.replace(/_/g, ' ') },
      { key: 'severity', header: 'Severity', render: (row) => row.severity },
      { key: 'message', header: 'Message', render: (row) => row.message },
      { key: 'recommended_action', header: 'Recommended Action', render: (row) => row.recommended_action ?? '-' },
      { key: 'acknowledged', header: 'Acknowledged', render: (row) => (row.acknowledged ? 'Yes' : 'No') },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) =>
          row.acknowledged ? (
            <Badge variant="success">Done</Badge>
          ) : (
            <Button
              size="sm"
              onClick={() =>
                void (async () => {
                  try {
                    await acknowledgeAlertMutation.mutateAsync(row.id);
                    addToast({
                      title: 'Alert acknowledged',
                      message: row.message,
                      variant: 'success',
                    });
                  } catch (error) {
                    addToast({
                      title: 'Acknowledge failed',
                      message: normalizeApiError(error).message,
                      variant: 'error',
                    });
                  }
                })()
              }
              loading={acknowledgeAlertMutation.isPending}
            >
              Acknowledge
            </Button>
          ),
      },
    ],
    [acknowledgeAlertMutation, addToast],
  );

  const competitorColumns = useMemo<Column<CompetitorAnalysis>[]>(
    () => [
      { key: 'name', header: 'Competitor', render: (row) => row.name },
      { key: 'region', header: 'Region', render: (row) => row.region },
      { key: 'total_products', header: 'Products', render: (row) => row.total_products.toLocaleString() },
      { key: 'average_pricing', header: 'Average Pricing', render: (row) => formatCurrency(row.average_pricing) },
      { key: 'pricing_strategy', header: 'Strategy', render: (row) => row.pricing_strategy },
      { key: 'market_share', header: 'Market Share', render: (row) => `${row.market_share.toFixed(2)}%` },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) => (
          <Button size="sm" variant="secondary" onClick={() => setSelectedCompetitorId(row.competitor_id)}>
            View detail
          </Button>
        ),
      },
    ],
    [],
  );

  const forecastColumns = useMemo<Column<DemandForecast>[]>(
    () => [
      { key: 'product_name', header: 'Product', render: (row) => row.product_name },
      { key: 'sku', header: 'SKU', render: (row) => row.sku },
      { key: 'current_demand', header: 'Current Demand', render: (row) => row.current_demand.toFixed(2) },
      { key: 'forecast_demand', header: 'Forecast Demand', render: (row) => row.forecast_demand.toFixed(2) },
      { key: 'forecast_period', header: 'Period', render: (row) => row.forecast_period },
      { key: 'confidence_score', header: 'Confidence', render: (row) => `${Math.round(row.confidence_score * 100)}%` },
      { key: 'created_at', header: 'Created', render: (row) => formatDate(row.created_at) },
    ],
    [],
  );

  const recommendationColumns = useMemo<Column<MarketRecommendation>[]>(
    () => [
      { key: 'title', header: 'Title', render: (row) => row.title },
      { key: 'type', header: 'Type', render: (row) => row.type },
      { key: 'priority', header: 'Priority', render: (row) => row.priority },
      { key: 'expected_impact', header: 'Expected Impact', render: (row) => row.expected_impact },
      { key: 'effort_required', header: 'Effort', render: (row) => row.effort_required },
      { key: 'status', header: 'Status', render: (row) => row.status },
      { key: 'due_date', header: 'Due Date', render: (row) => (row.due_date ? formatDate(row.due_date) : '-') },
    ],
    [],
  );

  const onComputeIndex = async () => {
    if (!indexCategoryId.trim()) {
      addToast({ title: 'Category required', message: 'Enter a category ID before computing an index.', variant: 'warning' });
      return;
    }

    try {
      await computeIndexMutation.mutateAsync({ category_id: indexCategoryId.trim() });
      addToast({ title: 'Index computed', message: 'Market price index recalculated successfully.', variant: 'success' });
      await indicesQuery.refetch();
    } catch (error) {
      addToast({ title: 'Index compute failed', message: normalizeApiError(error).message, variant: 'error' });
    }
  };

  const onGenerateForecast = async () => {
    if (!forecastProductId.trim()) {
      addToast({ title: 'Product required', message: 'Enter a product ID before generating a forecast.', variant: 'warning' });
      return;
    }

    try {
      await generateForecastMutation.mutateAsync({
        product_id: forecastProductId.trim(),
        forecast_period: forecastToPeriod.trim() || 'next_30_days',
      });
      addToast({ title: 'Forecast generated', message: 'Demand forecast refreshed from the backend.', variant: 'success' });
      await forecastsQuery.refetch();
    } catch (error) {
      addToast({ title: 'Forecast generation failed', message: normalizeApiError(error).message, variant: 'error' });
    }
  };

  if (summaryQuery.isLoading) {
    return (
      <PageFrame title="Market Intelligence">
        <SkeletonLoader variant="rect" height={320} />
      </PageFrame>
    );
  }

  if (summaryQuery.isError) {
    return (
      <PageFrame title="Market Intelligence">
        <ErrorState error={normalizeApiError(summaryQuery.error)} onRetry={() => void summaryQuery.refetch()} />
      </PageFrame>
    );
  }

  const alerts = alertsQuery.data ?? [];
  const signals = signalsQuery.data ?? [];
  const indices = indicesQuery.data ?? [];
  const competitors = competitorsQuery.data ?? [];
  const forecasts = forecastsQuery.data ?? [];
  const recommendations = recommendationsQuery.data ?? [];
  const filteredRecommendations = recommendationType ? recommendations.filter((item) => item.type === recommendationType) : recommendations;

  return (
    <PageFrame
      title="Market Intelligence"
      subtitle="Live market summaries, signals, indices, alerts, competitor views, forecasts, and recommendations."
    >
      <div className="space-y-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex flex-wrap gap-6">
            {(['overview', 'signals', 'indices', 'alerts', 'competitors', 'forecasts', 'recommendations'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-1 py-2 text-sm font-medium capitalize ${
                  activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'overview' ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>24h Signal Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-500">
                  Generated at{' '}
                  <span className="font-medium text-gray-700">
                    {summaryQuery.data?.generated_at ? formatDate(summaryQuery.data.generated_at) : '—'}
                  </span>
                </div>

                {summaryEntries.length === 0 ? (
                  <EmptyState title="No market summary available" body="The backend returned no signal breakdown for the last 24 hours." />
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {summaryEntries.map(([signalTypeName, stats]) => (
                      <Card key={signalTypeName} className="border border-gray-200">
                        <CardHeader>
                          <CardTitle className="text-base">{signalTypeName}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Count</span>
                            <span>{stats.count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Average value</span>
                            <span>{formatCurrency(stats.avg_value)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Latest Indices</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable columns={indexColumns} data={indices.slice(0, 5)} emptyMessage="No computed price indices yet." />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Open Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable columns={alertColumns} data={alerts.slice(0, 5)} emptyMessage="No active market alerts." />
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}

        {activeTab === 'signals' ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Signal Filters</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-4">
                <Input
                  label="Category ID"
                  value={signalCategoryId}
                  onChange={(event) => setSignalCategoryId(event.target.value)}
                  placeholder="Optional category id"
                />
                <Input
                  label="Signal Type"
                  value={signalType}
                  onChange={(event) => setSignalType(event.target.value)}
                  placeholder="Optional signal type"
                />
                <Input
                  label="Limit"
                  type="number"
                  value={signalLimit}
                  onChange={(event) => setSignalLimit(event.target.value)}
                  min={1}
                  max={100}
                />
                <div className="flex items-end">
                  <Button variant="secondary" onClick={() => void signalsQuery.refetch()}>
                    Refresh signals
                  </Button>
                </div>
              </CardContent>
            </Card>

            {signalsQuery.isLoading ? (
              <SkeletonLoader variant="rect" height={260} />
            ) : signalsQuery.isError ? (
              <ErrorState error={normalizeApiError(signalsQuery.error)} onRetry={() => void signalsQuery.refetch()} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Market Signals</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable columns={signalColumns} data={signals} emptyMessage="No market signals matched the current filters." />
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}

        {activeTab === 'indices' ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Compute Price Index</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3 md:items-end">
                <Input
                  label="Category ID"
                  value={indexCategoryId}
                  onChange={(event) => setIndexCategoryId(event.target.value)}
                  placeholder="Required category id"
                />
                <Input
                  label="Days"
                  type="number"
                  value={indexDays}
                  onChange={(event) => setIndexDays(event.target.value)}
                  min={1}
                  max={365}
                />
                <Button onClick={() => void onComputeIndex()} loading={computeIndexMutation.isPending}>
                  Compute index
                </Button>
              </CardContent>
            </Card>

            {indicesQuery.isLoading ? (
              <SkeletonLoader variant="rect" height={260} />
            ) : indicesQuery.isError ? (
              <ErrorState error={normalizeApiError(indicesQuery.error)} onRetry={() => void indicesQuery.refetch()} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Computed Price Indices</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable columns={indexColumns} data={indices} emptyMessage="The backend has not produced any price indices yet." />
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}

        {activeTab === 'alerts' ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Alert Filters</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={alertsOnlyUnacknowledged}
                    onChange={(event) => setAlertsOnlyUnacknowledged(event.target.checked)}
                  />
                  Unacknowledged only
                </label>
                <Button variant="secondary" onClick={() => void alertsQuery.refetch()}>
                  Refresh alerts
                </Button>
              </CardContent>
            </Card>

            {alertsQuery.isLoading ? (
              <SkeletonLoader variant="rect" height={260} />
            ) : alertsQuery.isError ? (
              <ErrorState error={normalizeApiError(alertsQuery.error)} onRetry={() => void alertsQuery.refetch()} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Market Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable columns={alertColumns} data={alerts} emptyMessage="No alerts returned by the backend." />
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}

        {activeTab === 'competitors' ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Competitor Filter</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <Input
                  label="Region"
                  value={competitorRegion}
                  onChange={(event) => setCompetitorRegion(event.target.value)}
                  placeholder="Backend-supported region filter"
                />
                <Button variant="secondary" onClick={() => void competitorsQuery.refetch()}>
                  Refresh competitors
                </Button>
              </CardContent>
            </Card>

            {competitorsQuery.isLoading ? (
              <SkeletonLoader variant="rect" height={260} />
            ) : competitorsQuery.isError ? (
              <ErrorState error={normalizeApiError(competitorsQuery.error)} onRetry={() => void competitorsQuery.refetch()} />
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>Competitor Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DataTable columns={competitorColumns} data={competitors} emptyMessage="No competitor analysis returned by the backend." />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Competitor Detail</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedCompetitorId && competitorDetailQuery.isLoading ? (
                      <SkeletonLoader variant="rect" height={160} />
                    ) : selectedCompetitorId && competitorDetailQuery.isError ? (
                      <ErrorState error={normalizeApiError(competitorDetailQuery.error)} onRetry={() => void competitorDetailQuery.refetch()} />
                    ) : competitorDetailQuery.data ? (
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="text-gray-500">Name:</span> {competitorDetailQuery.data.name}
                        </div>
                        <div>
                          <span className="text-gray-500">Region:</span> {competitorDetailQuery.data.region}
                        </div>
                        <div>
                          <span className="text-gray-500">Strategy:</span> {competitorDetailQuery.data.pricing_strategy}
                        </div>
                        <div>
                          <span className="text-gray-500">Market share:</span> {competitorDetailQuery.data.market_share.toFixed(2)}%
                        </div>
                        <div>
                          <div className="text-gray-500 mb-1">Strengths</div>
                          <div className="flex flex-wrap gap-2">
                            {competitorDetailQuery.data.strengths.length ? (
                              competitorDetailQuery.data.strengths.map((strength) => (
                                <Badge key={strength} variant="success">
                                  {strength}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-gray-500">None</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 mb-1">Weaknesses</div>
                          <div className="flex flex-wrap gap-2">
                            {competitorDetailQuery.data.weaknesses.length ? (
                              competitorDetailQuery.data.weaknesses.map((weakness) => (
                                <Badge key={weakness} variant="warning">
                                  {weakness}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-gray-500">None</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <EmptyState title="No competitor selected" body="Choose a competitor from the table to inspect its breakdown." />
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        ) : null}

        {activeTab === 'forecasts' ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Forecast Inputs</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3 md:items-end">
                <Input
                  label="Product ID"
                  value={forecastProductId}
                  onChange={(event) => setForecastProductId(event.target.value)}
                  placeholder="Required product id"
                />
                <Input
                  label="To period"
                  value={forecastToPeriod}
                  onChange={(event) => setForecastToPeriod(event.target.value)}
                  placeholder="next_30_days"
                />
                <Button onClick={() => void onGenerateForecast()} loading={generateForecastMutation.isPending}>
                  Generate forecast
                </Button>
              </CardContent>
            </Card>

            {forecastsQuery.isLoading ? (
              <SkeletonLoader variant="rect" height={260} />
            ) : forecastsQuery.isError ? (
              <ErrorState error={normalizeApiError(forecastsQuery.error)} onRetry={() => void forecastsQuery.refetch()} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Demand Forecasts</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable columns={forecastColumns} data={forecasts} emptyMessage="No forecast rows returned by the backend." />
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}

        {activeTab === 'recommendations' ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recommendation Filters</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={recommendationType}
                    onChange={(event) => setRecommendationType(event.target.value)}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                  >
                    <option value="">All</option>
                    <option value="PRICING">Pricing</option>
                    <option value="STOCK">Stock</option>
                    <option value="MARKETING">Marketing</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {recommendationsQuery.isLoading ? (
              <SkeletonLoader variant="rect" height={260} />
            ) : recommendationsQuery.isError ? (
              <ErrorState error={normalizeApiError(recommendationsQuery.error)} onRetry={() => void recommendationsQuery.refetch()} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Action Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable
                    columns={recommendationColumns}
                    data={filteredRecommendations}
                    emptyMessage="No recommendations returned by the backend."
                  />
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </div>
    </PageFrame>
  );
}
