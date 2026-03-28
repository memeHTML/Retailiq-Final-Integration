/* @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { authStore } from '@/stores/authStore';
import AnalyticsForecastingPage from '@/pages/AnalyticsForecasting';
import ForecastingPage from '@/pages/Forecasting';

const queryClients: QueryClient[] = [];

vi.mock('@/hooks/forecasting', () => ({
  useStoreForecastQuery: () => ({
    data: {
      data: {
        historical: [{ date: '2026-03-26', actual: 100 }],
        forecast: [{ date: '2026-03-27', predicted: 125, lower_bound: 110, upper_bound: 140 }],
      },
      meta: {
        regime: 'STABLE',
        model_type: 'arima',
        confidence_tier: 'high',
        training_window_days: 30,
        reorder_suggestion: {
          should_reorder: true,
          current_stock: 12,
          forecasted_demand: 18,
          lead_time_days: 4,
          suggested_order_qty: 10,
        },
      },
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useSkuForecastQuery: () => ({
    data: {
      data: {
        historical: [{ date: '2026-03-26', actual: 50 }],
        forecast: [{ date: '2026-03-27', predicted: 60, lower_bound: 55, upper_bound: 70 }],
      },
      meta: {
        product_name: 'Tea',
        reorder_suggestion: {
          should_reorder: false,
          current_stock: 20,
          forecasted_demand: 12,
          lead_time_days: 3,
          suggested_order_qty: 0,
        },
      },
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

afterEach(() => {
  while (queryClients.length) {
    queryClients.pop()?.clear();
  }
});

describe('Prompt 09 forecasting', () => {
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

  it('renders canonical and legacy forecasting routes with historical and forecast points', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClients.push(queryClient);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/analytics/forecasting']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/analytics/forecasting" element={<AnalyticsForecastingPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByRole('heading', { name: /Demand Forecasting/i })).toBeTruthy();
    expect(screen.getAllByText(/Historical/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Forecast/i).length).toBeGreaterThan(0);
    expect(screen.getByText('125')).toBeTruthy();

    cleanup();
    queryClient.clear();
    queryClients.pop();

    const legacyClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClients.push(legacyClient);

    render(
      <QueryClientProvider client={legacyClient}>
        <MemoryRouter initialEntries={['/forecasting']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/forecasting" element={<ForecastingPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByRole('heading', { name: /Demand Forecasting/i })).toBeTruthy();
  });
});
