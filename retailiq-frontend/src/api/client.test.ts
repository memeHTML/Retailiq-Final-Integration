/* @vitest-environment jsdom */
import axios from 'axios';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { apiClient, apiPostForm, requestWithFallback } from './client';
import { normalizeApiError } from '@/utils/errors';

type MockAuthUser = { role: string } | null;

const mocks = vi.hoisted(() => {
  const state = {
    accessToken: 'expired-access' as string | null,
    refreshToken: null as string | null,
    user: null as MockAuthUser,
    role: 'owner' as const,
    setTokens: vi.fn(),
    setUser: vi.fn(),
    clearAuth: vi.fn(),
  };

  return {
    authState: state,
    getStoredRefreshToken: vi.fn(() => state.refreshToken ?? 'stored-refresh-token'),
    clearStoredRefreshToken: vi.fn(),
    setStoredRefreshToken: vi.fn(),
    redirectAssign: vi.fn(),
  };
});

vi.mock('@/stores/authStore', () => ({
  authStore: {
    getState: () => mocks.authState,
  },
}));

vi.mock('@/utils/tokenStorage', () => ({
  getStoredRefreshToken: mocks.getStoredRefreshToken,
  clearStoredRefreshToken: mocks.clearStoredRefreshToken,
  setStoredRefreshToken: mocks.setStoredRefreshToken,
}));

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  mocks.authState.accessToken = 'expired-access';
  mocks.authState.refreshToken = null;
  mocks.authState.user = null;
  mocks.authState.role = 'owner';
  mocks.authState.setTokens = vi.fn((accessToken: string, refreshToken: string) => {
    mocks.authState.accessToken = accessToken;
    mocks.authState.refreshToken = refreshToken;
  });
  mocks.authState.setUser = vi.fn((user: MockAuthUser) => {
    mocks.authState.user = user;
    if (user) {
      mocks.authState.role = 'owner';
    }
  });
  mocks.authState.clearAuth = vi.fn(() => {
    mocks.authState.accessToken = null;
    mocks.authState.refreshToken = null;
    mocks.authState.user = null;
    mocks.authState.role = 'owner';
  });
});

function getResponseRejectedHandler() {
  const handlers = (apiClient.interceptors.response as unknown as { handlers: Array<{ rejected?: (error: unknown) => Promise<unknown> }> }).handlers;
  const handler = handlers.find((entry) => typeof entry?.rejected === 'function');
  if (!handler?.rejected) {
    throw new Error('Response interceptor handler not found.');
  }
  return handler.rejected;
}

describe('api client transport', () => {
  it('retries multipart requests after refresh', async () => {
    const rejected = getResponseRejectedHandler();
    const refreshSpy = vi.spyOn(axios, 'post').mockResolvedValue({
      data: {
        access_token: 'new-access',
        refresh_token: 'new-refresh',
        user_id: 1,
        role: 'owner',
        store_id: 2,
      },
    });
    const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({ data: { ok: true } } as never);

    const formData = new FormData();
    formData.append('invoice_image', new Blob(['hello'], { type: 'text/plain' }), 'invoice.txt');

    const result = await rejected({
      isAxiosError: true,
      response: {
        status: 401,
        data: { message: 'Unauthorized' },
      },
      config: {
        url: '/api/v1/vision/ocr/upload',
        method: 'POST',
        data: formData,
        headers: {},
      },
    });

    expect(refreshSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/refresh'),
      { refresh_token: 'stored-refresh-token' },
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
    expect(mocks.authState.setTokens).toHaveBeenCalledWith('new-access', 'new-refresh');
    expect(requestSpy).toHaveBeenCalledWith(expect.objectContaining({ url: '/api/v1/vision/ocr/upload', method: 'POST' }));
    expect(result).toEqual({ data: { ok: true } });
    expect(mocks.authState.refreshToken).toBe('new-refresh');
  });

  it('uses the rotated refresh token on subsequent 401 retries', async () => {
    const rejected = getResponseRejectedHandler();
    const refreshSpy = vi.spyOn(axios, 'post').mockResolvedValue({
      data: {
        access_token: 'new-access',
        refresh_token: 'new-refresh',
        user_id: 1,
        role: 'owner',
        store_id: 2,
      },
    });
    const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({ data: { ok: true } } as never);

    const formData = new FormData();
    formData.append('invoice_image', new Blob(['hello'], { type: 'text/plain' }), 'invoice.txt');

    await rejected({
      isAxiosError: true,
      response: {
        status: 401,
        data: { message: 'Unauthorized' },
      },
      config: {
        url: '/api/v1/vision/ocr/upload',
        method: 'POST',
        data: formData,
        headers: {},
      },
    });

    await rejected({
      isAxiosError: true,
      response: {
        status: 401,
        data: { message: 'Unauthorized' },
      },
      config: {
        url: '/api/v1/vision/ocr/upload',
        method: 'POST',
        data: formData,
        headers: {},
      },
    });

    expect(refreshSpy).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/api/v1/auth/refresh'),
      { refresh_token: 'stored-refresh-token' },
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
    expect(refreshSpy).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/api/v1/auth/refresh'),
      { refresh_token: 'new-refresh' },
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
    expect(mocks.authState.refreshToken).toBe('new-refresh');
    expect(requestSpy).toHaveBeenCalledTimes(2);
  });

  it('does not force a multipart content type before the request interceptor runs', async () => {
    const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({ data: { ok: true } } as never);
    const formData = new FormData();
    formData.append('invoice_image', new Blob(['hello'], { type: 'text/plain' }), 'invoice.txt');

    await apiPostForm<{ ok: boolean }>('/api/v1/vision/ocr/upload', formData);

    expect(requestSpy).toHaveBeenCalledWith(expect.objectContaining({
      url: '/api/v1/vision/ocr/upload',
      method: 'POST',
      data: formData,
      headers: expect.objectContaining({
        Accept: 'application/json',
      }),
    }));
    expect((requestSpy.mock.calls[0]?.[0] as { headers?: Record<string, string> }).headers?.['Content-Type']).toBeUndefined();
  });

  it('skips refresh on refresh endpoints and preserves backend payloads', async () => {
    const rejected = getResponseRejectedHandler();
    const refreshSpy = vi.spyOn(axios, 'post').mockResolvedValue({
      data: {
        access_token: 'new-access',
        refresh_token: 'new-refresh',
        user_id: 1,
        role: 'owner',
        store_id: 2,
      },
    });

    await expect(
      rejected({
        isAxiosError: true,
        response: {
          status: 401,
          data: { message: 'Token expired', error: 'Token expired' },
        },
        config: {
          url: '/api/v1/auth/refresh',
          method: 'POST',
          data: { refresh_token: 'stored-refresh-token' },
          headers: {},
        },
      }),
    ).rejects.toEqual({ message: 'Token expired', error: 'Token expired' });

    expect(refreshSpy).not.toHaveBeenCalled();
    expect(mocks.authState.clearAuth).not.toHaveBeenCalled();
  });

  it('preserves raw payloads when normalizing backend errors', () => {
    const payload = { message: 'Validation failed', fields: { name: 'Required' } };
    const normalized = normalizeApiError(payload);

    expect(normalized.message).toBe('Validation failed');
    expect(normalized.raw).toBe(payload);
  });

  it('falls back to the alternate route when the primary route is missing', async () => {
    const requestSpy = vi.spyOn(apiClient, 'request')
      .mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 404, data: { message: 'Missing' } },
        config: {},
      })
      .mockResolvedValueOnce({ data: { ok: true } } as never);

    const result = await requestWithFallback<{ ok: boolean }>('/api/v1/kyc/providers', '/api/v1/kyc/kyc/providers', 'GET');

    expect(requestSpy).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ ok: true });
  });

  it('does not silently fall back on method mismatches', async () => {
    const requestSpy = vi.spyOn(apiClient, 'request').mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 405, data: { message: 'Method Not Allowed' } },
      config: {},
    });

    await expect(requestWithFallback('/api/v1/kyc/providers', '/api/v1/kyc/kyc/providers', 'GET')).rejects.toMatchObject({
      isAxiosError: true,
      response: { status: 405, data: { message: 'Method Not Allowed' } },
    });

    expect(requestSpy).toHaveBeenCalledTimes(1);
  });
});
