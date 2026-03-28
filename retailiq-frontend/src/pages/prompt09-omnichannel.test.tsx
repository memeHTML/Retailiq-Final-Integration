/* @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { authStore } from '@/stores/authStore';
import OmnichannelPage from '@/pages/Omnichannel';

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
}));

afterEach(() => {
  while (queryClients.length) {
    queryClients.pop()?.clear();
  }
});

describe('Prompt 09 omnichannel', () => {
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

  it('switches the omnichannel shell tabs', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClients.push(queryClient);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/omnichannel']}>
          <Routes>
            <Route path="/omnichannel" element={<OmnichannelPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('heading', { name: /^Omnichannel$/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Marketplace/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /WhatsApp/i })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /Marketplace/i }));
    expect(await screen.findByText(/Marketplace tab coming soon/i)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /Market Signals/i }));
    expect(await screen.findByRole('heading', { name: /Price signals/i })).toBeTruthy();
  });
});
