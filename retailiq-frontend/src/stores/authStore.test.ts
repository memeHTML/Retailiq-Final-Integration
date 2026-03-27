/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authStore, getAuthIdentityKey } from './authStore';
import { captureHistoryStore } from './captureHistoryStore';

const tokenStorageMock = vi.hoisted(() => ({
  clearStoredRefreshToken: vi.fn(),
  getStoredRefreshToken: vi.fn(() => null),
  setStoredRefreshToken: vi.fn(),
}));

vi.mock('@/utils/tokenStorage', () => tokenStorageMock);

const owner = {
  user_id: 11,
  mobile_number: '9000000000',
  full_name: 'Owner',
  email: 'owner@example.com',
  role: 'owner' as const,
  store_id: 77,
};

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    captureHistoryStore.getState().clearAll();
    authStore.setState({
      accessToken: 'token',
      refreshToken: 'refresh',
      user: owner,
      isAuthenticated: true,
      role: owner.role,
    });
  });

  it('clears capture history and persisted refresh state on logout', () => {
    captureHistoryStore.getState().recordReceiptJob({ storeId: owner.store_id, userId: owner.user_id }, {
      job_id: 301,
      transaction_id: 'TX-301',
      job_type: 'RECEIPT',
      status: 'PENDING',
      created_at: '2026-03-27T12:00:00Z',
      completed_at: null,
    });

    authStore.getState().clearAuth();

    expect(tokenStorageMock.clearStoredRefreshToken).toHaveBeenCalledTimes(1);
    expect(captureHistoryStore.getState().scopes).toEqual({});
    expect(authStore.getState().accessToken).toBeNull();
    expect(authStore.getState().refreshToken).toBeNull();
    expect(authStore.getState().user).toBeNull();
    expect(authStore.getState().isAuthenticated).toBe(false);
    expect(authStore.getState().role).toBeNull();
  });

  it('derives a stable identity key from the active user scope', () => {
    expect(getAuthIdentityKey(owner)).toBe('11:77');
    expect(getAuthIdentityKey(null)).toBeNull();
  });
});
