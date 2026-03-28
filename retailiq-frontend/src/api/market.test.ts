import { describe, expect, it } from 'vitest';
import * as marketApi from './market';
import * as marketHooks from '@/hooks/useMarket';

describe('market aliases', () => {
  it('re-export the market intelligence implementation', () => {
    expect(typeof marketApi.marketApi.getMarketSummary).toBe('function');
    expect(typeof marketHooks.useMarketSummaryQuery).toBe('function');
    expect('getMarketTrends' in marketApi.marketApi).toBe(false);
    expect('exportSignals' in marketApi.marketApi).toBe(false);
    expect('exportForecasts' in marketApi.marketApi).toBe(false);
  });
});
