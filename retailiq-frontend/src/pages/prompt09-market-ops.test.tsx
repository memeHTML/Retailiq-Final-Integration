/* @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { authStore } from '@/stores/authStore';
import AnalyticsMarketPage from '@/pages/AnalyticsMarket';
import AnalyticsOfflinePage from '@/pages/AnalyticsOffline';
import AnalyticsStaffPage from '@/pages/AnalyticsStaff';
import MarketIntelligencePage from '@/pages/MarketIntelligence';
import OfflinePage from '@/pages/Offline';
import StaffPerformancePage from '@/pages/StaffPerformance';

const queryClients: QueryClient[] = [];

vi.mock('@/hooks/marketIntelligence', () => ({
  useMarketSummaryQuery: () => ({
    data: [
      { region: 'North', total_stores: 2, average_price: 120, price_volatility: 1.2, demand_index: 1.1, competitor_count: 3, last_updated: '2026-03-27T09:00:00Z' },
    ],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  usePriceSignalsQuery: () => ({
    data: [
      {
        id: 'sig-1',
        signal_type: 'PRICE_CHANGE',
        source_id: 'store-1',
        category_id: 'Tea',
        region_code: 'North',
        value: 128,
        confidence: 0.87,
        quality_score: 0.94,
        timestamp: '2026-03-27T09:00:00Z',
      },
    ],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useMarketAlertsQuery: () => ({
    data: [
      {
        id: 'alert-1',
        alert_type: 'PRICE_DROP',
        severity: 'HIGH',
        message: 'Competitor prices moved down.',
        recommended_action: 'Review margins',
        acknowledged: false,
      },
    ],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useRecommendationsQuery: () => ({
    data: [
      {
        id: 'rec-1',
        type: 'PRICING',
        priority: 'HIGH',
        title: 'Reprice Tea',
        description: 'Margins are tightening.',
        expected_impact: 'Higher conversion',
        effort_required: 'LOW',
        status: 'PENDING',
        created_at: '2026-03-27T09:00:00Z',
      },
    ],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  usePriceIndicesQuery: () => ({
    data: [
      {
        category_id: 'Tea',
        region_code: 'North',
        index_value: 1.12,
        computation_method: 'Store average',
        computed_at: '2026-03-27T09:00:00Z',
      },
    ],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useCompetitorsQuery: () => ({
    data: [
      {
        competitor_id: 'comp-1',
        name: 'Rival Mart',
        region: 'North',
        total_products: 24,
        average_pricing: 126,
        pricing_strategy: 'Aggressive',
      },
    ],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useCompetitorDetailQuery: () => ({
    data: {
      competitor_id: 'comp-1',
      name: 'Rival Mart',
      region: 'North',
      pricing_strategy: 'Aggressive',
      market_share: 12.4,
      strengths: ['pricing'],
      weaknesses: ['stock depth'],
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useDemandForecastsQuery: () => ({
    data: [
      {
        product_id: 'P-100',
        product_name: 'Tea',
        sku: 'TEA-1',
        current_demand: 100,
        forecast_demand: 112,
        forecast_period: 'next_30_days',
        confidence_score: 0.82,
      },
    ],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useAcknowledgeAlertMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useComputePriceIndexMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useGenerateForecastMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/hooks/offline', () => ({
  useOfflineSnapshotQuery: () => ({
    data: {
      snapshot: {
        generated_at: '2026-03-27T09:00:00Z',
        store_id: 1,
        revenue_30d: [{ date: '2026-03-27', revenue: 120000 }],
        low_stock_products: [{ product_name: 'Tea', current_stock: 4 }],
      },
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/hooks/staffPerformance', () => ({
  useCurrentSessionQuery: () => ({
    data: { active: true, started_at: '2026-03-27T08:00:00Z', target_revenue: 12000 },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useAllStaffPerformanceQuery: () => ({
    data: [
      {
        user_id: 12,
        name: 'Asha',
        today_revenue: 3200,
        today_transaction_count: 11,
        avg_discount_pct: 2.3,
        target_revenue: 5000,
        target_pct_achieved: 64,
      },
    ],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useStartSessionMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useEndSessionMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useUpsertStaffTargetMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

afterEach(() => {
  while (queryClients.length) {
    queryClients.pop()?.clear();
  }
});

describe('Prompt 09 market, offline, and staff routes', () => {
  beforeEach(() => {
    authStore.setState({
      accessToken: 'token',
      refreshToken: 'refresh',
      user: {
        user_id: 1,
        role: 'owner',
        store_id: 1,
        mobile_number: '9999999999',
        full_name: 'Owner User',
      },
      isAuthenticated: true,
      role: 'owner',
    });
    vi.clearAllMocks();
  });

  it('renders market routes and legacy aliases', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClients.push(queryClient);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/analytics/market']}>
          <Routes>
            <Route path="/analytics/market" element={<AnalyticsMarketPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('heading', { name: /Market Intelligence/i })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /signals/i }));
    expect(await screen.findByRole('heading', { name: /^Market Signals$/i })).toBeTruthy();

    cleanup();
    const legacyMarketClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClients.push(legacyMarketClient);
    render(
      <QueryClientProvider client={legacyMarketClient}>
        <MemoryRouter initialEntries={['/market-intelligence']}>
          <Routes>
            <Route path="/market-intelligence" element={<MarketIntelligencePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByRole('heading', { name: /Market Intelligence/i })).toBeTruthy();
  });

  it('renders offline routes and staff routes with aliases', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClients.push(queryClient);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/analytics/offline']}>
          <Routes>
            <Route path="/analytics/offline" element={<AnalyticsOfflinePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByRole('heading', { name: /Offline Snapshot/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /Revenue history/i })).toBeTruthy();

    cleanup();
    const offlineAliasClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClients.push(offlineAliasClient);
    render(
      <QueryClientProvider client={offlineAliasClient}>
        <MemoryRouter initialEntries={['/offline']}>
          <Routes>
            <Route path="/offline" element={<OfflinePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByRole('heading', { name: /Offline Snapshot/i })).toBeTruthy();

    cleanup();
    const staffClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClients.push(staffClient);
    render(
      <QueryClientProvider client={staffClient}>
        <MemoryRouter initialEntries={['/analytics/staff']}>
          <Routes>
            <Route path="/analytics/staff" element={<AnalyticsStaffPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByRole('heading', { name: /Staff Performance/i })).toBeTruthy();
    expect(screen.getByText(/Asha/i)).toBeTruthy();

    cleanup();
    const staffAliasClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClients.push(staffAliasClient);
    render(
      <QueryClientProvider client={staffAliasClient}>
        <MemoryRouter initialEntries={['/staff-performance']}>
          <Routes>
            <Route path="/staff-performance" element={<StaffPerformancePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByRole('heading', { name: /Staff Performance/i })).toBeTruthy();
  });
});
