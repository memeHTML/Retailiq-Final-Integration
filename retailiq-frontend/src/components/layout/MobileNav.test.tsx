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
  it('renders the navigation drawer when opened', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <MobileNav />
      </MemoryRouter>,
    );

    expect(screen.getByText('Navigation')).toBeTruthy();
    expect(screen.getByText('Dashboard')).toBeTruthy();
    expect(screen.getByText('Stock Audit')).toBeTruthy();
  });
});
