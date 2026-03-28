/* @vitest-environment jsdom */
import { useLocation, useRoutes, MemoryRouter } from 'react-router-dom';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
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
vi.mock('@/pages/I18n', () => ({ default: page('Internationalization') }));
vi.mock('@/pages/Calendar', () => ({ default: page('Financial Calendar') }));
vi.mock('@/features/orders/OrdersPage', () => ({ default: page('Orders') }));
vi.mock('@/features/omnichannel/OmnichannelPage', () => ({ default: page('Omnichannel') }));
vi.mock('@/pages/StaffPerformance', () => ({ default: page('Staff') }));
vi.mock('@/pages/Pricing', () => ({ default: page('Pricing') }));
vi.mock('@/pages/Decisions', () => ({ default: page('Decisions') }));
vi.mock('@/pages/MarketIntelligence', () => ({ default: page('Market Intelligence') }));
vi.mock('@/pages/Operations', () => ({ default: page('Operations hub') }));

const mockedAuthStore = authStore as unknown as { getState: () => { isAuthenticated: boolean; role: 'owner' | 'staff' } };

function RoutesHarness() {
  return useRoutes(appRoutes);
}

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location-probe">{location.pathname}</div>;
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
        <LocationProbe />
        <RoutesHarness />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function expectLocationPath(expected: string) {
  await waitFor(() => {
    expect(screen.getByTestId('location-probe').textContent).toBe(expected);
  });
}

async function expectLocationStartsWith(expectedPrefix: string) {
  await waitFor(() => {
    expect(screen.getByTestId('location-probe').textContent?.startsWith(expectedPrefix)).toBe(true);
  });
}

describe('router operations redirects', () => {
  beforeEach(() => {
    cleanup();
    mockedAuthStore.getState().isAuthenticated = true;
    mockedAuthStore.getState().role = 'owner';
  });

  it.each([
    ['/developer', '/operations/developer'],
    ['/kyc', '/operations/kyc'],
    ['/team', '/operations/team'],
    ['/ops', '/operations/maintenance'],
    ['/i18n', '/settings/i18n'],
    ['/events', '/financial-calendar'],
    ['/orders', '/orders'],
    ['/omnichannel', '/omnichannel'],
    ['/analytics/staff', '/staff-performance'],
    ['/inventory/pricing', '/pricing'],
    ['/decisions', '/ai/decisions'],
    ['/analytics/market', '/market-intelligence'],
  ])('redirects %s to %s', async (initialEntry, canonicalPath) => {
    renderRouter(initialEntry);

    await expectLocationPath(canonicalPath);
  });

  it.each([
    ['/operations/developer', '/operations/developer'],
    ['/operations/kyc', '/operations/kyc'],
    ['/operations/team', '/operations/team'],
    ['/operations/maintenance', '/operations/maintenance'],
    ['/settings/i18n', '/settings/i18n'],
    ['/financial-calendar', '/financial-calendar'],
    ['/orders', '/orders'],
    ['/omnichannel', '/omnichannel'],
    ['/staff-performance', '/staff-performance'],
    ['/pricing', '/pricing'],
    ['/ai/decisions', '/ai/decisions'],
    ['/market-intelligence', '/market-intelligence'],
  ])('renders %s once authenticated', async (initialEntry, expectedPath) => {
    renderRouter(initialEntry);

    await expectLocationPath(expectedPath);
  });

  it('sends canonical routes to login when unauthenticated', async () => {
    mockedAuthStore.getState().isAuthenticated = false;
    renderRouter('/operations/developer');

    await expectLocationStartsWith('/login');
  });

  it('sends legacy aliases to login when unauthenticated', async () => {
    mockedAuthStore.getState().isAuthenticated = false;
    renderRouter('/developer');

    await expectLocationStartsWith('/login');
  });

  it('blocks i18n alias access when unauthenticated', async () => {
    mockedAuthStore.getState().isAuthenticated = false;
    renderRouter('/i18n');

    await expectLocationStartsWith('/login');
  });

  it('blocks events alias access when unauthenticated', async () => {
    mockedAuthStore.getState().isAuthenticated = false;
    renderRouter('/events');

    await expectLocationStartsWith('/login');
  });

  it.each([
    ['/analytics/staff', 'Staff page /staff-performance'],
    ['/inventory/pricing', 'Pricing page /pricing'],
    ['/analytics/market', 'Market Intelligence page /market-intelligence'],
    ['/orders', 'Orders page /orders'],
    ['/omnichannel', 'Omnichannel page /omnichannel'],
  ])('blocks %s when unauthenticated', async (initialEntry) => {
    mockedAuthStore.getState().isAuthenticated = false;
    renderRouter(initialEntry);

    await expectLocationStartsWith('/login');
  });
});
