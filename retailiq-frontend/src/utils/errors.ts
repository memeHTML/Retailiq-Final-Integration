/**
 * src/utils/errors.ts
 * Oracle Document sections consumed: 2, 3, 5, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { isAxiosError, type AxiosError, type AxiosResponse } from 'axios';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import type { ApiError } from '@/types/api';

const extractCorrelationId = (response: AxiosResponse | undefined) => {
  const headers = response?.headers;
  if (!headers) {
    return undefined;
  }

  return headers['x-request-id'] ?? headers['x-correlation-id'] ?? headers['x-trace-id'];
};

const extractFields = (payload: unknown): Record<string, string> | undefined => {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const candidate = payload as Record<string, unknown>;
  const nestedError = candidate.error;
  const nestedErrorRecord = nestedError && typeof nestedError === 'object'
    ? nestedError as Record<string, unknown>
    : undefined;
  const nestedFields = nestedError && typeof nestedError === 'object'
    ? nestedErrorRecord?.fields
    : undefined;

  const source = candidate.fields
    ?? candidate.errors
    ?? candidate.validation_errors
    ?? nestedFields
    ?? (
      nestedErrorRecord
      && !('code' in nestedErrorRecord)
      && !('message' in nestedErrorRecord)
      && !('description' in nestedErrorRecord)
      && !('error_description' in nestedErrorRecord)
        ? nestedErrorRecord
        : undefined
    );

  if (!source || typeof source !== 'object') {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(source as Record<string, unknown>).map(([key, value]) => [key, Array.isArray(value) ? value.join(', ') : String(value)]),
  );
};

const extractMessage = (payload: unknown, fallback = 'Request failed.') => {
  if (typeof payload === 'string') {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const candidate = payload as Record<string, unknown>;

  if (typeof candidate.message === 'string') {
    return candidate.message;
  }

  if (typeof candidate.status === 'string') {
    return candidate.status;
  }

  if (typeof candidate.error_description === 'string') {
    return candidate.error_description;
  }

  if (typeof candidate.detail === 'string') {
    return candidate.detail;
  }

  if (candidate.error && typeof candidate.error === 'object') {
    const nested = candidate.error as Record<string, unknown>;
    if (typeof nested.message === 'string') {
      return nested.message;
    }
    if (typeof nested.description === 'string') {
      return nested.description;
    }
    if (typeof nested.error_description === 'string') {
      return nested.error_description;
    }
    if (typeof nested.code === 'string' && typeof nested.message === 'string') {
      return nested.message;
    }
  }

  if (typeof candidate.error === 'string') {
    return candidate.error;
  }

  return fallback;
};

export function normalizeApiError(error: unknown): ApiError {
  if (isAxiosError(error)) {
    const axiosError = error as AxiosError<Record<string, unknown>>;
    const response = axiosError.response;
    const payload = response?.data;
    const correlationId = extractCorrelationId(response);

    return {
      message: extractMessage(payload, axiosError.message || 'Request failed.'),
      status: response?.status ?? axiosError.status,
      fields: extractFields(payload),
      correlationId: correlationId ? String(correlationId) : undefined,
      raw: payload ?? axiosError.toJSON(),
    };
  }

  if (error && typeof error === 'object') {
    const candidate = error as Record<string, unknown>;
    const rawFields = candidate.fields;
    return {
      message: extractMessage(candidate),
      status: typeof candidate.status === 'number' ? candidate.status : undefined,
      fields: rawFields && typeof rawFields === 'object' ? Object.fromEntries(Object.entries(rawFields as Record<string, unknown>).map(([key, value]) => [key, String(value)])) : undefined,
      correlationId: typeof candidate.correlationId === 'string' ? candidate.correlationId : undefined,
      raw: candidate,
    };
  }

  return {
    message: extractMessage(error),
    status: undefined,
    raw: error,
  };
}

export const formatCorrelationId = (correlationId?: string) => (
  correlationId ? `Reference ID: ${correlationId}` : ''
);

export const isNotFound = (error: ApiError | null | undefined) => error?.status === 404;
export const isUnauthorized = (error: ApiError | null | undefined) => error?.status === 401;
export const isForbidden = (error: ApiError | null | undefined) => error?.status === 403;

export const parseApiError = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }

  if (value && typeof value === 'object') {
    const candidate = value as Record<string, unknown>;
    if (typeof candidate.message === 'string') {
      return candidate.message;
    }
    if (typeof candidate.error_description === 'string') {
      return candidate.error_description;
    }
    if (typeof candidate.error === 'string') {
      return candidate.error;
    }
    if (candidate.error && typeof candidate.error === 'object') {
      const nested = candidate.error as Record<string, unknown>;
      if (typeof nested.message === 'string') {
        return nested.message;
      }
      if (typeof nested.description === 'string') {
        return nested.description;
      }
    }
  }

  return 'An unexpected error occurred.';
};

export const extractFieldErrors = <TFieldValues extends FieldValues>(fields: Record<string, string> | undefined, setError: UseFormSetError<TFieldValues>) => {
  if (!fields) {
    return;
  }

  Object.entries(fields).forEach(([field, message]) => {
    setError(field as Path<TFieldValues>, { type: 'server', message });
  });
};
