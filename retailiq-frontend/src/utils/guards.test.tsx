/* @vitest-environment jsdom */
import { describe, expect, it, beforeEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthGuard, PublicOnlyGuard } from '@/utils/guards';
import { authStore } from '@/stores/authStore';

function LocationProbe() {
  const location = useLocation();

  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

describe('route guards', () => {
  beforeEach(() => {
    cleanup();
    authStore.setState({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      role: null,
    });
  });

  it('redirects unauthenticated users to login from protected routes', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route element={<AuthGuard />}>
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Route>
          <Route
            path="/login"
            element={(
              <>
                <div>Login</div>
                <LocationProbe />
              </>
            )}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Login')).toBeTruthy();
    expect(screen.getByTestId('location').textContent).toContain('/login?redirect=%2Fdashboard');
  });

  it('redirects authenticated users away from public-only routes', async () => {
    authStore.setState({
      accessToken: 'token',
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

    render(
      <MemoryRouter initialEntries={['/login']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route element={<PublicOnlyGuard />}>
            <Route path="/login" element={<div>Login</div>} />
          </Route>
          <Route
            path="/dashboard"
            element={(
              <>
                <div>Dashboard</div>
                <LocationProbe />
              </>
            )}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Dashboard')).toBeTruthy();
    expect(screen.getByTestId('location').textContent).toBe('/dashboard');
  });
});
