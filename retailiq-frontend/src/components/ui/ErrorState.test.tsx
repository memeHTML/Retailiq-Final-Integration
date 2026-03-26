/* @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
  it('renders structured validation details', () => {
    render(
      <ErrorState
        error={{
          message: 'Validation failed.',
          status: 400,
          code: 'VALIDATION_ERROR',
          fields: { gstin: 'GSTIN is required', category_id: 'Category is required' },
          timestamp: '2026-03-26T10:00:00Z',
        }}
      />,
    );

    expect(screen.getByText('Validation details')).toBeTruthy();
    expect(screen.getByText(/gstin:/i)).toBeTruthy();
    expect(screen.getByText(/GSTIN is required/)).toBeTruthy();
    expect(screen.getByText(/Code: VALIDATION_ERROR/)).toBeTruthy();
  });
});
