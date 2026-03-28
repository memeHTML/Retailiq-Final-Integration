/* @vitest-environment jsdom */
import { useLocation, useRoutes, MemoryRouter } from 'react-router-dom';
import { cleanup, render, screen } from '@testing-library/react';
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
vi.mock('@/pages/FinancialCalendar', () => ({ default: page('Financial Calendar') }));
vi.mock('@/features/analytics/StaffPerformancePage', () => ({ default: page('Staff') }));
vi.mock('@/features/pricing/PricingPage', () => ({ default: page('Pricing') }));
vi.mock('@/features/ai/DecisionsPage', () => ({ default: page('Decisions') }));
vi.mock('@/features/analytics/MarketIntelligencePage', () => ({ default: page('Market Intelligence') }));
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
    cleanup();
    mockedAuthStore.getState().isAuthenticated = true;
    mockedAuthStore.getState().role = 'owner';
  });

  it.each([
    ['/developer', '/operations/developer', 'Developer page /operations/developer'],
    ['/kyc', '/operations/kyc', 'KYC page /operations/kyc'],
    ['/team', '/operations/team', 'Team page /operations/team'],
    ['/ops', '/operations/maintenance', 'Maintenance page /operations/maintenance'],
    ['/i18n', '/settings/i18n', 'Internationalization page /settings/i18n'],
    ['/events', '/financial-calendar', 'Financial Calendar page /financial-calendar'],
    ['/analytics/staff', '/staff-performance', 'Staff page /staff-performance'],
    ['/inventory/pricing', '/pricing', 'Pricing page /pricing'],
    ['/ai/decisions', '/decisions', 'Decisions page /decisions'],
    ['/analytics/market', '/market-intelligence', 'Market Intelligence page /market-intelligence'],
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
    ['/settings/i18n', 'Internationalization page /settings/i18n'],
    ['/financial-calendar', 'Financial Calendar page /financial-calendar'],
    ['/staff-performance', 'Staff page /staff-performance'],
    ['/pricing', 'Pricing page /pricing'],
    ['/decisions', 'Decisions page /decisions'],
    ['/market-intelligence', 'Market Intelligence page /market-intelligence'],
  ])('renders %s once authenticated', async (initialEntry, pageText) => {
    renderRouter(initialEntry);

    expect((await screen.findAllByText(pageText)).length).toBeGreaterThan(0);
  });

  it('sends canonical routes to login when unauthenticated', async () => {
    mockedAuthStore.getState().isAuthenticated = false;
    renderRouter('/operations/developer');

    expect(await screen.findByText('Login page /login')).toBeTruthy();
  });

  it('sends legacy aliases to login when unauthenticated', async () => {
    mockedAuthStore.getState().isAuthenticated = false;
    renderRouter('/developer');

    expect((await screen.findAllByText('Login page /login')).length).toBeGreaterThan(0);
    expect(screen.queryAllByText('Developer page /operations/developer').length).toBe(0);
    expect(screen.queryAllByText('Operations hub page /operations').length).toBe(0);
  });

  it('blocks i18n alias access when unauthenticated', async () => {
    mockedAuthStore.getState().isAuthenticated = false;
    renderRouter('/i18n');

    expect((await screen.findAllByText('Login page /login')).length).toBeGreaterThan(0);
    expect(screen.queryAllByText('Internationalization page /settings/i18n').length).toBe(0);
  });

  it('blocks events alias access when unauthenticated', async () => {
    mockedAuthStore.getState().isAuthenticated = false;
    renderRouter('/events');

    expect((await screen.findAllByText('Login page /login')).length).toBeGreaterThan(0);
    expect(screen.queryAllByText('Financial Calendar page /financial-calendar').length).toBe(0);
  });

  it.each([
    ['/analytics/staff', 'Staff page /staff-performance'],
    ['/inventory/pricing', 'Pricing page /pricing'],
    ['/ai/decisions', 'Decisions page /decisions'],
    ['/analytics/market', 'Market Intelligence page /market-intelligence'],
  ])('blocks %s when unauthenticated', async (initialEntry, canonicalPageText) => {
    mockedAuthStore.getState().isAuthenticated = false;
    renderRouter(initialEntry);

    expect((await screen.findAllByText('Login page /login')).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(canonicalPageText).length).toBe(0);
    expect(screen.queryAllByText(/\/(staff-performance|pricing|decisions|market-intelligence)$/).length).toBe(0);
  });
});
