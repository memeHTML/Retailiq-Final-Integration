/**
 * src/utils/errors.ts
 * Oracle Document sections consumed: 2, 3, 5, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { isAxiosError, type AxiosError, type AxiosResponse } from 'axios';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import type { ApiError } from '@/types/api';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const toFieldRecord = (value: unknown): Record<string, string> | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      Array.isArray(entry) ? entry.map((item) => String(item)).join(', ') : String(entry),
    ]),
  );
};

const collectFieldCandidates = (payload: unknown): unknown[] => {
  if (!isRecord(payload)) {
    return [];
  }

  const candidate = payload as Record<string, unknown>;
  const nestedError = isRecord(candidate.error) ? candidate.error : undefined;
  const nestedMessage = isRecord(candidate.message) ? candidate.message : undefined;
  const nestedDetail = isRecord(candidate.detail) ? candidate.detail : undefined;

  return [
    candidate.fields,
    candidate.errors,
    candidate.validation_errors,
    nestedError?.fields,
    nestedError?.errors,
    nestedError?.validation_errors,
    nestedMessage?.fields,
    nestedMessage?.errors,
    nestedMessage?.validation_errors,
    nestedDetail?.fields,
    nestedDetail?.errors,
    nestedDetail?.validation_errors,
    nestedError && !('code' in nestedError) && !('message' in nestedError) && !('description' in nestedError) && !('error_description' in nestedError) ? nestedError : undefined,
    nestedMessage && !('code' in nestedMessage) && !('message' in nestedMessage) && !('description' in nestedMessage) && !('error_description' in nestedMessage) ? nestedMessage : undefined,
    nestedDetail && !('code' in nestedDetail) && !('message' in nestedDetail) && !('description' in nestedDetail) && !('error_description' in nestedDetail) ? nestedDetail : undefined,
  ].filter(Boolean);
};

const extractCorrelationId = (response: AxiosResponse | undefined) => {
  const headers = response?.headers;
  if (!headers) {
    return undefined;
  }

  return headers['x-request-id'] ?? headers['x-correlation-id'] ?? headers['x-trace-id'];
};

const extractFields = (payload: unknown): Record<string, string> | undefined => {
  for (const candidate of collectFieldCandidates(payload)) {
    const mapped = toFieldRecord(candidate);
    if (mapped) {
      return mapped;
    }
  }

  return undefined;
};

const extractMessage = (payload: unknown, fallback = 'Request failed.'): string => {
  if (typeof payload === 'string') {
    return payload;
  }

  if (!isRecord(payload)) {
    return fallback;
  }

  const candidate = payload as Record<string, unknown>;

  if (typeof candidate.message === 'string') {
    return candidate.message;
  }

  if (isRecord(candidate.message)) {
    const nestedMessage: string = extractMessage(candidate.message, '');
    if (nestedMessage) {
      return nestedMessage;
    }
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

  if (isRecord(candidate.detail)) {
    const nestedDetail: string = extractMessage(candidate.detail, '');
    if (nestedDetail) {
      return nestedDetail;
    }
  }

  if (isRecord(candidate.error)) {
    const nested = candidate.error;
    if (typeof nested.message === 'string') {
      return nested.message;
    }
    if (isRecord(nested.message)) {
      const nestedMessage: string = extractMessage(nested.message, '');
      if (nestedMessage) {
        return nestedMessage;
      }
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

  if (extractFields(candidate)) {
    return 'Validation failed.';
  }

  return fallback;
};

const extractCode = (payload: unknown) => {
  if (!isRecord(payload)) {
    return undefined;
  }

  const candidate = payload as Record<string, unknown>;
  if (typeof candidate.code === 'string') {
    return candidate.code;
  }

  if (isRecord(candidate.error)) {
    const nested = candidate.error;
    if (typeof nested.code === 'string') {
      return nested.code;
    }
  }

  return undefined;
};

const extractTimestamp = (payload: unknown) => {
  if (!isRecord(payload)) {
    return undefined;
  }

  const candidate = payload as Record<string, unknown>;
  if (typeof candidate.timestamp === 'string') {
    return candidate.timestamp;
  }

  if (isRecord(candidate.error)) {
    const nested = candidate.error;
    if (typeof nested.timestamp === 'string') {
      return nested.timestamp;
    }
  }

  return undefined;
};

export function normalizeApiError(error: unknown): ApiError {
  if (isAxiosError(error)) {
    const axiosError = error as AxiosError<Record<string, unknown>>;
    const response = axiosError.response;
    const payload = response?.data;
    const correlationId = extractCorrelationId(response);
    const fields = extractFields(payload);

    return {
      message: extractMessage(payload, fields ? 'Validation failed.' : axiosError.message || 'Request failed.'),
      status: response?.status ?? axiosError.status,
      code: extractCode(payload),
      fields,
      correlationId: correlationId ? String(correlationId) : undefined,
      timestamp: extractTimestamp(payload),
      details: payload,
      raw: payload ?? axiosError.toJSON(),
    };
  }

  if (isRecord(error)) {
    const candidate = error as Record<string, unknown>;
    const fields = extractFields(candidate);
    return {
      message: extractMessage(candidate, fields ? 'Validation failed.' : 'Request failed.'),
      status: typeof candidate.status === 'number' ? candidate.status : undefined,
      code: extractCode(candidate),
      fields,
      correlationId: typeof candidate.correlationId === 'string' ? candidate.correlationId : undefined,
      timestamp: extractTimestamp(candidate),
      details: candidate.details ?? candidate,
      raw: candidate,
    };
  }

  return {
    message: extractMessage(error),
    status: undefined,
    code: extractCode(error),
    timestamp: extractTimestamp(error),
    details: error,
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
  return extractMessage(value, 'An unexpected error occurred.');
};

export const extractFieldErrors = <TFieldValues extends FieldValues>(fields: Record<string, string> | undefined, setError: UseFormSetError<TFieldValues>) => {
  if (!fields) {
    return;
  }

  Object.entries(fields).forEach(([field, message]) => {
    setError(field as Path<TFieldValues>, { type: 'server', message });
  });
};
