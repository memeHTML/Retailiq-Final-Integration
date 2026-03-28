/**
 * src/api/client.ts
 * Backend-accurate transport layer with refresh handling and fallback helpers.
 */
import axios, {
  AxiosHeaders,
  isAxiosError,
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { authStore } from '@/stores/authStore';
import type { AuthTokens } from '@/types/models';
import { normalizeApiError } from '@/utils/errors';
import { clearStoredRefreshToken, getStoredRefreshToken, setStoredRefreshToken } from '@/utils/tokenStorage';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
let refreshPromise: Promise<AuthTokens | null> | null = null;
let redirecting = false;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: false,
});

const resolveUrl = (url: string) => (url.startsWith('http://') || url.startsWith('https://') ? url : `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`);

const isFormData = (value: unknown): value is FormData => typeof FormData !== 'undefined' && value instanceof FormData;

const shouldSkipRefresh = (url?: string) => {
  if (!url) {
    return false;
  }

  return [
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/verify-otp',
    '/api/v1/auth/resend-otp',
    '/api/v1/auth/forgot-password',
    '/api/v1/auth/reset-password',
    '/api/v1/auth/mfa/setup',
    '/api/v1/auth/mfa/verify',
    '/api/v1/auth/refresh',
  ].some((path) => url.includes(path));
};

const redirectToLogin = () => {
  if (typeof window === 'undefined' || redirecting) {
    return;
  }

  redirecting = true;
  window.location.assign('/login');
};

const getRefreshToken = () => authStore.getState().refreshToken ?? getStoredRefreshToken();

const setTokens = (tokens: AuthTokens) => {
  authStore.getState().setTokens(tokens.access_token, tokens.refresh_token);
  authStore.getState().setUser(authStore.getState().user ?? {
    user_id: tokens.user_id,
    role: tokens.role,
    store_id: tokens.store_id,
  });
  setStoredRefreshToken(tokens.refresh_token);
};

type PayloadRecord = Record<string, unknown> & { success?: boolean; data?: unknown; meta?: unknown; error?: unknown };

const isEnvelope = (value: unknown): value is PayloadRecord => Boolean(value) && typeof value === 'object';

const unwrapPayload = <T>(payload: unknown): T => {
  if (!isEnvelope(payload)) {
    return payload as T;
  }

  if (typeof payload.success === 'boolean') {
    if (!payload.success) {
      throw payload;
    }

    if ('data' in payload) {
      return payload.data as T;
    }
  }

  if ('data' in payload) {
    return payload.data as T;
  }

  return payload as T;
};

const normalizeResponseEnvelope = <T>(payload: unknown): ApiResponseEnvelope<T> => {
  if (isEnvelope(payload)) {
    if (typeof payload.success === 'boolean' && !payload.success) {
      throw payload;
    }

    if ('data' in payload) {
      return {
        data: payload.data as T,
        meta: (payload.meta as Record<string, unknown> | null | undefined) ?? null,
        raw: payload,
        success: typeof payload.success === 'boolean' ? payload.success : true,
        error: payload.error ?? null,
        message: typeof (payload as { message?: unknown }).message === 'string' ? (payload as { message: string }).message : undefined,
      } as ApiResponseEnvelope<T>;
    }
  }

  return {
    data: payload as T,
    meta: null,
    raw: payload,
  } as ApiResponseEnvelope<T>;
};

const requestRefreshToken = async (): Promise<AuthTokens | null> => {
  const refresh_token = getRefreshToken();
  if (!refresh_token) {
    return null;
  }

  const response = await axios.post(resolveUrl('/api/v1/auth/refresh'), { refresh_token }, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  const payload = unwrapPayload<AuthTokens>(response.data);
  if (payload?.access_token && payload?.refresh_token) {
    setTokens(payload);
    return payload;
  }

  return null;
};

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = authStore.getState().accessToken;
  if (token) {
    const headers = config.headers instanceof AxiosHeaders ? config.headers : AxiosHeaders.from(config.headers ?? {});
    headers.set('Authorization', `Bearer ${token}`);
    config.headers = headers;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response: AxiosResponse<unknown>) => response,
  async (error: unknown) => {
    if (!isAxiosError(error)) {
      return Promise.reject(normalizeApiError(error));
    }

    const axiosError = error as AxiosError;
    const originalRequest = axiosError.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (axiosError.response?.status === 401 && originalRequest && !originalRequest._retry && !shouldSkipRefresh(originalRequest.url)) {
      originalRequest._retry = true;

      if (isFormData(originalRequest.data)) {
        authStore.getState().clearAuth();
        clearStoredRefreshToken();
        redirectToLogin();
        return Promise.reject(axiosError.response.data ?? error);
      }

      try {
        if (!refreshPromise) {
          refreshPromise = requestRefreshToken();
        }

        const refreshed = await refreshPromise;
        refreshPromise = null;

        if (refreshed?.access_token) {
          originalRequest.headers = {
            ...(originalRequest.headers ?? {}),
            Authorization: `Bearer ${refreshed.access_token}`,
          };

          return apiClient.request(originalRequest);
        }
      } catch (refreshError) {
        refreshPromise = null;
        authStore.getState().clearAuth();
        clearStoredRefreshToken();
        redirectToLogin();
        return Promise.reject(normalizeApiError(refreshError));
      }

      authStore.getState().clearAuth();
      clearStoredRefreshToken();
      redirectToLogin();
      return Promise.reject(axiosError.response.data ?? error);
    }

    return Promise.reject(axiosError.response?.data ?? error);
  },
);

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<unknown>(config);
  return unwrapPayload<T>(response.data);
}

export async function requestRaw<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<T>(config);
  return response.data;
}

export interface ApiResponseEnvelope<T> {
  data: T;
  meta: Record<string, unknown> | null;
  raw: unknown;
  success?: boolean;
  error?: unknown;
  message?: string;
}

export function requestEnvelope<T>(config: AxiosRequestConfig): Promise<ApiResponseEnvelope<T>> {
  return apiClient.request<unknown>(config).then((response) => normalizeResponseEnvelope<T>(response.data));
}

export async function requestAny<T>(configs: AxiosRequestConfig[]): Promise<ApiResponseEnvelope<T>> {
  let lastError: unknown;

  for (const config of configs) {
    try {
      return await requestEnvelope<T>(config);
    } catch (error) {
      const normalized = normalizeApiError(error);
      if (normalized.status === 404 || normalized.status === 405) {
        lastError = error;
        continue;
      }

      throw error;
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error('Request failed.');
}

export async function requestBlob(config: AxiosRequestConfig): Promise<Blob> {
  const response = await apiClient.request<Blob>({ ...config, responseType: 'blob' });
  return response.data;
}

export async function postForm<T>(url: string, data: FormData, config: AxiosRequestConfig = {}): Promise<T> {
  return request<T>({ ...config, url, method: 'POST', data });
}

export const apiGet = <T>(url: string, params?: unknown, config: AxiosRequestConfig = {}) =>
  request<T>({ ...config, url, method: 'GET', params });

export const apiPost = <T>(url: string, body?: unknown, config: AxiosRequestConfig = {}) =>
  request<T>({ ...config, url, method: 'POST', data: body });

export const apiPut = <T>(url: string, body?: unknown, config: AxiosRequestConfig = {}) =>
  request<T>({ ...config, url, method: 'PUT', data: body });

export const apiDelete = <T>(url: string, config: AxiosRequestConfig = {}) =>
  request<T>({ ...config, url, method: 'DELETE' });

export const apiPostForm = <T>(url: string, formData: FormData, config: AxiosRequestConfig = {}) =>
  postForm<T>(url, formData, config);

export const apiGetBlob = (url: string, config: AxiosRequestConfig = {}) =>
  requestBlob({ ...config, url, method: 'GET' });

export async function requestWithFallback<T>(
  primary: string,
  fallback: string,
  method: AxiosRequestConfig['method'],
  body?: unknown,
  config: AxiosRequestConfig = {},
): Promise<T> {
  try {
    return await request<T>({ ...config, url: primary, method, data: body });
  } catch (error) {
    const normalized = normalizeApiError(error);
    if (normalized.status !== 404) {
      throw error;
    }

    return request<T>({ ...config, url: fallback, method, data: body });
  }
}

export const safeRetryable = (config?: AxiosRequestConfig) => {
  const method = config?.method?.toUpperCase();
  return !method || ['GET', 'HEAD', 'OPTIONS'].includes(method);
};

export const unwrapEnvelope = unwrapPayload;
