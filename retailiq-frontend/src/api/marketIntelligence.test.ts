import { describe, expect, it, vi } from 'vitest';
import { marketIntelligenceApi } from './marketIntelligence';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
}));

vi.mock('./client', () => ({
  request: mocks.request,
}));

describe('market intelligence contract', () => {
  it('returns the backend market summary payload shape', async () => {
    mocks.request.mockResolvedValueOnce({
      signals_last_24h: {
        PRICE: { count: 12, avg_value: 42.5 },
      },
      generated_at: '2026-03-28T00:00:00.000Z',
    });

    await expect(marketIntelligenceApi.getMarketSummary()).resolves.toEqual({
      signals_last_24h: {
        PRICE: { count: 12, avg_value: 42.5 },
      },
      generated_at: '2026-03-28T00:00:00.000Z',
    });

    expect(mocks.request).toHaveBeenCalledWith({
      url: '/api/v1/market/summary',
      method: 'GET',
    });
  });

  it('sends only backend-supported signal filters', async () => {
    mocks.request.mockResolvedValueOnce([]);

    await marketIntelligenceApi.getPriceSignals({
      category_id: 8,
      signal_type: 'PRICE_DROP',
      limit: 25,
    });

    expect(mocks.request).toHaveBeenCalledWith({
      url: '/api/v1/market/signals',
      method: 'GET',
      params: {
        category_id: 8,
        signal_type: 'PRICE_DROP',
        limit: 25,
      },
    });
  });

  it('sends only backend-supported index filters', async () => {
    mocks.request.mockResolvedValueOnce([]);

    await marketIntelligenceApi.getPriceIndices({
      category_id: 4,
      days: 14,
    });

    expect(mocks.request).toHaveBeenCalledWith({
      url: '/api/v1/market/indices',
      method: 'GET',
      params: {
        category_id: 4,
        days: 14,
      },
    });
  });

  it('sends the backend forecast contract without extra params', async () => {
    mocks.request.mockResolvedValueOnce([]);

    await marketIntelligenceApi.getDemandForecasts({
      product_id: 55,
      to_period: 'next_30_days',
    });

    expect(mocks.request).toHaveBeenCalledWith({
      url: '/api/v1/market/forecasts',
      method: 'GET',
      params: {
        product_id: 55,
        to_period: 'next_30_days',
      },
    });
  });
});
