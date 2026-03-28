/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell';
import { authStore } from '@/stores/authStore';
import { uiStore } from '@/stores/uiStore';

vi.mock('@/hooks/store', () => ({
  useStoreProfileQuery: () => ({
    data: { store_name: 'RetailIQ Mart' },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

function setViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
}

describe('AppShell responsive shell behavior', () => {
  beforeEach(() => {
    cleanup();
    window.localStorage.clear();
    authStore.setState({
      accessToken: 'token',
      refreshToken: 'refresh',
      user: {
        user_id: 1,
        role: 'owner',
        store_id: 1,
        mobile_number: '9999999999',
        full_name: 'Owner User',
      },
      isAuthenticated: true,
      role: 'owner',
    });
    uiStore.setState({ sidebarCollapsed: false });
  });

  it.each([
    { width: 375, expectedMode: 'mobile' },
    { width: 768, expectedMode: 'mobile' },
    { width: 1280, expectedMode: 'desktop' },
    { width: 1920, expectedMode: 'desktop' },
  ] as const)('switches shell behavior at $widthpx ($expectedMode)', async ({ width, expectedMode }) => {
    setViewport(width);

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="*" element={<AppShell />}>
            <Route path="dashboard" element={<div>Dashboard body</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Dashboard body')).toBeTruthy();
    expect(screen.getByRole('button', { name: /toggle navigation/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /toggle navigation/i }));

    if (expectedMode === 'mobile') {
      expect(await screen.findByRole('dialog', { name: /navigation menu/i })).toBeTruthy();
      expect(document.body.style.overflow).toBe('hidden');
      fireEvent.click(document.querySelector('.app-shell__drawer-backdrop') as Element);
      expect(screen.queryByRole('dialog', { name: /navigation menu/i })).toBeNull();
      expect(document.body.style.overflow).toBe('');
      expect(screen.getByRole('navigation', { name: /primary/i })).toBeTruthy();
      expect(screen.getByRole('link', { name: /home/i })).toBeTruthy();
      expect(screen.getAllByRole('link', { name: /inventory/i }).length).toBeGreaterThan(0);
      return;
    }

    expect(screen.queryByRole('dialog', { name: /navigation menu/i })).toBeNull();
    expect(uiStore.getState().sidebarCollapsed).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /toggle navigation/i }));
    expect(uiStore.getState().sidebarCollapsed).toBe(false);
  });
});
