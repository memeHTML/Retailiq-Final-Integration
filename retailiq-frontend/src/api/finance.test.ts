/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requestRaw: vi.fn(),
}));

vi.mock('@/api/client', () => ({
  requestRaw: mocks.requestRaw,
}));

import { financeApi } from './finance';

describe('finance api raw passthrough', () => {
  beforeEach(() => {
    mocks.requestRaw.mockReset();
  });

  it('reads dashboard fields directly from the raw v2 payload', async () => {
    mocks.requestRaw.mockResolvedValueOnce({
      cash_on_hand: 1250,
      treasury_balance: 8400,
      total_debt: 2600,
      credit_score: 712,
    });

    await expect(financeApi.getFinanceDashboard()).resolves.toEqual({
      cash_on_hand: 1250,
      treasury_balance: 8400,
      total_debt: 2600,
      credit_score: 712,
    });

    expect(mocks.requestRaw).toHaveBeenCalledWith({
      url: '/api/v2/finance/dashboard',
      method: 'GET',
    });
  });

  it('maps finance account arrays without envelope unwrapping', async () => {
    mocks.requestRaw.mockResolvedValueOnce([
      { id: 1, type: 'CURRENT', balance: 5000 },
      { id: 2, type: 'SAVINGS', balance: 12000 },
    ]);

    await expect(financeApi.getFinancialAccounts()).resolves.toEqual([
      {
        id: '1',
        type: 'CURRENT',
        name: 'CURRENT Account',
        balance: 5000,
        currency: 'INR',
        is_active: true,
      },
      {
        id: '2',
        type: 'SAVINGS',
        name: 'SAVINGS Account',
        balance: 12000,
        currency: 'INR',
        is_active: true,
      },
    ]);
  });

  it('uses raw credit score fields directly', async () => {
    mocks.requestRaw.mockResolvedValueOnce({
      score: 734,
      tier: 'A',
      factors: ['Payments on time'],
      last_updated: '2026-03-27T10:00:00.000Z',
    });

    await expect(financeApi.getCreditScore()).resolves.toEqual({
      score: 734,
      max_score: 900,
      tier: 'A',
      last_updated: '2026-03-27T10:00:00.000Z',
      factors: ['Payments on time'],
    });
  });

  it('keeps treasury endpoints on the raw v2 transport path', async () => {
    mocks.requestRaw.mockResolvedValueOnce({
      available: 6100,
      yield_bps: 42,
      currency: 'INR',
    });

    await expect(financeApi.getTreasuryBalance()).resolves.toEqual({
      total_balance: 6100,
      available_balance: 6100,
      reserved_amount: 0,
      pending_transfers: 0,
      currency: 'INR',
      last_updated: expect.any(String),
      yield_bps: 42,
    });

    expect(mocks.requestRaw).toHaveBeenCalledWith({
      url: '/api/v2/finance/treasury/balance',
      method: 'GET',
    });
  });
});
