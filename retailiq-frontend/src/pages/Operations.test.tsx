/* @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import OperationsPage from './Operations';

describe('OperationsPage', () => {
  it('links to the canonical nested operations routes', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <OperationsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /open developer platform/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /open kyc/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /open team/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /open maintenance/i })).toBeTruthy();
  });
});
