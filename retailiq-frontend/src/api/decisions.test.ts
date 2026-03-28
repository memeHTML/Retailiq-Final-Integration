import { describe, expect, it, vi } from 'vitest';
import { getDecisions } from './decisions';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
}));

vi.mock('./client', () => ({
  request: mocks.request,
}));

describe('decisions contract', () => {
  it('uses the trailing slash required by Flask', async () => {
    mocks.request.mockResolvedValueOnce({ data: [], meta: { total_recommendations: 0 } });

    await getDecisions();

    expect(mocks.request).toHaveBeenCalledWith({
      url: '/api/v1/decisions/',
      method: 'GET',
    });
  });
});
