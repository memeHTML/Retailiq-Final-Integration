/* @vitest-environment jsdom */
import { useLocation, useRoutes, MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appRoutes } from './router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { authStore } from '@/stores/authStore';

vi.mock('@/stores/authStore', () => {
  const authState = {
    isAuthenticated: true,
    role: 'owner' as const,
    user: {
      id: 'user-1',
      email: 'ada@example.com',
      mobile_number: '9999999999',
      full_name: 'Ada Lovelace',
      role: 'owner' as const,
      store_id: 'store-1',
    },
  };

  const authStoreMock = Object.assign((selector: (state: typeof authState) => unknown) => selector(authState), {
    getState: () => authState,
  });

  return { authStore: authStoreMock, __authState: authState };
});

const page = (label: string) => () => {
  const location = useLocation();
  return <div>{`${label} page ${location.pathname}`}</div>;
};

vi.mock('@/pages/Login', () => ({ default: page('Login') }));
vi.mock('@/pages/Developer', () => ({ default: page('Developer') }));
vi.mock('@/pages/Kyc', () => ({ default: page('KYC') }));
vi.mock('@/pages/Team', () => ({ default: page('Team') }));
vi.mock('@/pages/Ops', () => ({ default: page('Maintenance') }));
vi.mock('@/pages/Operations', () => ({ default: page('Operations hub') }));

const mockedAuthStore = authStore as unknown as { getState: () => { isAuthenticated: boolean; role: 'owner' | 'staff' } };

function RoutesHarness() {
  return useRoutes(appRoutes);
}

function renderRouter(initialEntry: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <RoutesHarness />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('router operations redirects', () => {
  beforeEach(() => {
    mockedAuthStore.getState().isAuthenticated = true;
    mockedAuthStore.getState().role = 'owner';
  });

  it.each([
    ['/developer', '/operations/developer', 'Developer page /operations/developer'],
    ['/kyc', '/operations/kyc', 'KYC page /operations/kyc'],
    ['/team', '/operations/team', 'Team page /operations/team'],
    ['/ops', '/operations/maintenance', 'Maintenance page /operations/maintenance'],
  ])('redirects %s to %s', async (initialEntry, canonicalPath, pageText) => {
    renderRouter(initialEntry);

    expect((await screen.findAllByText(pageText)).length).toBeGreaterThan(0);
    expect(screen.getByText(new RegExp(canonicalPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeTruthy();
  });

  it.each([
    ['/operations/developer', 'Developer page /operations/developer'],
    ['/operations/kyc', 'KYC page /operations/kyc'],
    ['/operations/team', 'Team page /operations/team'],
    ['/operations/maintenance', 'Maintenance page /operations/maintenance'],
  ])('renders %s once authenticated', async (initialEntry, pageText) => {
    renderRouter(initialEntry);

    expect((await screen.findAllByText(pageText)).length).toBeGreaterThan(0);
  });

  it('sends canonical routes to login when unauthenticated', async () => {
    mockedAuthStore.getState().isAuthenticated = false;
    renderRouter('/operations/developer');

    expect(await screen.findByText('Login page /login')).toBeTruthy();
  });
});
