import { describe, expect, it } from 'vitest';
import { normalizeApiError, parseApiError } from './errors';

describe('errors utils', () => {
  it('preserves structured validation payloads', () => {
    const normalized = normalizeApiError({
      status: 400,
      message: {
        message: 'Validation failed.',
        fields: {
          gstin: ['GSTIN is required'],
          category_id: 'Category is required',
        },
      },
      error: {
        code: 'VALIDATION_ERROR',
        timestamp: '2026-03-26T10:00:00Z',
      },
    });

    expect(normalized.message).toBe('Validation failed.');
    expect(normalized.code).toBe('VALIDATION_ERROR');
    expect(normalized.timestamp).toBe('2026-03-26T10:00:00Z');
    expect(normalized.fields).toEqual({
      gstin: 'GSTIN is required',
      category_id: 'Category is required',
    });
    expect(normalized.details).toBeTruthy();
  });

  it('uses the same extraction logic for parseApiError', () => {
    expect(parseApiError({ error: { message: 'Adapter failed' } })).toBe('Adapter failed');
  });
});
