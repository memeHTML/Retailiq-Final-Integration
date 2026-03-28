/* @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { MobileNav } from './MobileNav';

const uiState = {
  mobileNavOpen: true,
  setMobileNavOpen: vi.fn(),
};

const authState = {
  role: 'owner' as const,
};

vi.mock('@/stores/uiStore', () => ({
  uiStore: (selector: (state: typeof uiState) => unknown) => selector(uiState),
}));

vi.mock('@/stores/authStore', () => ({
  authStore: (selector: (state: typeof authState) => unknown) => selector(authState),
}));

describe('MobileNav', () => {
  it('renders the primary bottom navigation', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <MobileNav />
      </MemoryRouter>,
    );

    expect(screen.getByRole('navigation', { name: /primary/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /home/i }).getAttribute('href')).toBe('/dashboard');
    expect(screen.getByRole('link', { name: /inventory/i }).getAttribute('href')).toBe('/inventory');
    expect(screen.getByRole('link', { name: /^pos$/i }).getAttribute('href')).toBe('/orders/pos');
    expect(screen.getByRole('link', { name: /customers/i }).getAttribute('href')).toBe('/customers');
    expect(screen.getByRole('link', { name: /analytics/i }).getAttribute('href')).toBe('/analytics');
  });
});
