/* @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MarketIntelligencePage from './MarketIntelligence';

const toastMock = vi.fn();

vi.mock('@/stores/uiStore', () => ({
  uiStore: (selector: any) =>
    selector({
      addToast: toastMock,
    }),
}));

vi.mock('@/hooks/marketIntelligence', () => ({
  useMarketSummaryQuery: () => ({
    data: {
      signals_last_24h: {
        PRICE: { count: 12, avg_value: 42.5 },
        STOCK: { count: 3, avg_value: 8.25 },
      },
      generated_at: '2026-03-28T00:00:00.000Z',
    },
    isLoading: false,
    isError: false,
    error: undefined,
    refetch: vi.fn(),
  }),
  usePriceSignalsQuery: () => ({ data: [], isLoading: false, isError: false, error: undefined, refetch: vi.fn() }),
  usePriceIndicesQuery: () => ({ data: [], isLoading: false, isError: false, error: undefined, refetch: vi.fn() }),
  useMarketAlertsQuery: () => ({ data: [], isLoading: false, isError: false, error: undefined, refetch: vi.fn() }),
  useCompetitorsQuery: () => ({ data: [], isLoading: false, isError: false, error: undefined, refetch: vi.fn() }),
  useCompetitorDetailQuery: () => ({ data: null, isLoading: false, isError: false, error: undefined, refetch: vi.fn() }),
  useDemandForecastsQuery: () => ({ data: [], isLoading: false, isError: false, error: undefined, refetch: vi.fn() }),
  useRecommendationsQuery: () => ({ data: [], isLoading: false, isError: false, error: undefined, refetch: vi.fn() }),
  useAcknowledgeAlertMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useComputePriceIndexMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useGenerateForecastMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe('MarketIntelligencePage', () => {
  it('renders the backend market summary breakdown instead of a fabricated region list', () => {
    render(<MarketIntelligencePage />);

    expect(screen.getByRole('heading', { name: /market intelligence/i })).toBeTruthy();
    expect(screen.getByText('24h Signal Summary')).toBeTruthy();
    expect(screen.getByText('PRICE')).toBeTruthy();
    expect(screen.getByText('STOCK')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText(/2026/)).toBeTruthy();
  });
});
