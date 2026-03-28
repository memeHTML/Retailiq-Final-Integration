/* @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Sidebar } from './Sidebar';

const uiState = {
  sidebarCollapsed: false,
  toggleSidebar: vi.fn(),
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

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (authState as { role: 'owner' | 'staff' }).role = 'owner';
  });

  it('shows canonical settings and calendar destinations', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /financial calendar/i }).getAttribute('href')).toBe('/financial-calendar');
    expect(screen.getByRole('link', { name: /internationalization/i }).getAttribute('href')).toBe('/settings/i18n');
    expect(screen.getByRole('link', { name: /^Orders$/i }).getAttribute('href')).toBe('/orders');
    expect(screen.getByRole('link', { name: /^Omnichannel$/i }).getAttribute('href')).toBe('/omnichannel');
  });
});
