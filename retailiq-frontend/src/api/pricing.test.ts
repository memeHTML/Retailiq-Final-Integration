import { describe, expect, it, vi } from 'vitest';
import { applySuggestion, dismissSuggestion, getPriceHistory, getPricingRules, updatePricingRules } from './pricing';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
}));

vi.mock('./client', () => ({
  request: mocks.request,
}));

describe('pricing contract', () => {
  it('loads pricing rules from the backend rules endpoint', async () => {
    mocks.request.mockResolvedValueOnce([{ id: 1 }]);

    const result = await getPricingRules();

    expect(mocks.request).toHaveBeenCalledWith({ url: '/api/v1/pricing/rules', method: 'GET' });
    expect(result).toEqual([{ id: 1 }]);
  });

  it('sends rule_type, parameters, and is_active when upserting rules', async () => {
    mocks.request.mockResolvedValueOnce({ id: 2 });

    await updatePricingRules({
      rule_type: 'margin_based',
      parameters: { minimum_margin_pct: 12 },
      is_active: true,
    });

    expect(mocks.request).toHaveBeenCalledWith({
      url: '/api/v1/pricing/rules',
      method: 'PUT',
      data: {
        rule_type: 'margin_based',
        parameters: { minimum_margin_pct: 12 },
        is_active: true,
      },
    });
  });

  it('uses the dedicated apply and dismiss suggestion endpoints', async () => {
    mocks.request.mockResolvedValueOnce({ suggestion_id: 9, status: 'APPLIED' });
    await applySuggestion(9);
    expect(mocks.request).toHaveBeenCalledWith({
      url: '/api/v1/pricing/suggestions/9/apply',
      method: 'POST',
    });

    mocks.request.mockResolvedValueOnce({ suggestion_id: 9, status: 'DISMISSED' });
    await dismissSuggestion(9);
    expect(mocks.request).toHaveBeenCalledWith({
      url: '/api/v1/pricing/suggestions/9/dismiss',
      method: 'POST',
    });
  });

  it('sends product_id to the history endpoint', async () => {
    mocks.request.mockResolvedValueOnce([]);

    await getPriceHistory(77);

    expect(mocks.request).toHaveBeenCalledWith({
      url: '/api/v1/pricing/history',
      method: 'GET',
      params: { product_id: 77 },
    });
  });
});
