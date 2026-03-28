import { describe, expect, it, vi } from 'vitest';
import * as staffApi from './staff';
import * as staffHooks from '@/hooks/useStaff';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
}));

vi.mock('./client', () => ({
  request: mocks.request,
}));

describe('staff aliases', () => {
  it('re-export the staff performance implementation', () => {
    expect(typeof staffApi.getCurrentSession).toBe('function');
    expect(typeof staffHooks.useCurrentSessionQuery).toBe('function');
  });

  it('sends staff target payloads to the backend contract', async () => {
    mocks.request.mockResolvedValueOnce({ message: 'Target updated successfully' });

    await staffApi.upsertStaffTarget({
      user_id: 11,
      target_date: '2026-03-28',
      revenue_target: 12000,
      transaction_count_target: 45,
    });

    expect(mocks.request).toHaveBeenCalledWith({
      url: '/api/v1/staff/targets',
      method: 'PUT',
      data: {
        user_id: 11,
        target_date: '2026-03-28',
        revenue_target: 12000,
        transaction_count_target: 45,
      },
    });
  });
});
