/* @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Header } from './Header';

const mocks = vi.hoisted(() => {
  const navigateMock = vi.fn();
  const toggleMobileNavMock = vi.fn();
  const clearAuthMock = vi.fn();
  const authState = {
    user: {
      full_name: 'Ada Lovelace',
      email: 'ada@example.com',
      mobile_number: '9999999999',
      role: 'owner' as const,
    },
    clearAuth: clearAuthMock,
  };

  const uiState = {
    mobileNavOpen: false,
    toggleMobileNav: toggleMobileNavMock,
  };

  const authStoreMock = Object.assign((selector: (state: typeof authState) => unknown) => selector(authState), {
    getState: () => authState,
  });

  return { authState, uiState, authStoreMock, navigateMock, toggleMobileNavMock, clearAuthMock };
});

const navigateMock = mocks.navigateMock;
const toggleMobileNavMock = mocks.toggleMobileNavMock;
const clearAuthMock = mocks.clearAuthMock;
let currentPathname = '/dashboard';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => ({
      pathname: currentPathname,
      search: '',
      hash: '',
      state: null,
      key: 'test-location',
    }),
  };
});

vi.mock('@/stores/authStore', () => ({
  authStore: mocks.authStoreMock,
}));

vi.mock('@/stores/uiStore', () => ({
  uiStore: (selector: (state: typeof mocks.uiState) => unknown) => selector(mocks.uiState),
}));

vi.mock('@/hooks/store', () => ({
  useStoreProfileQuery: () => ({ data: { store_name: 'Demo Store' } }),
}));

describe('Header', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    currentPathname = '/dashboard';
  });

  it('toggles mobile navigation and exposes logout controls', async () => {
    const user = userEvent.setup();

    render(<Header onOpenPalette={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeTruthy();
    expect(screen.getByText('RetailIQ')).toBeTruthy();
    expect(screen.getByText('Ada Lovelace')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /open navigation/i }));
    expect(toggleMobileNavMock).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /open user menu/i }));
    await user.click(await screen.findByText(/log out/i));

    expect(clearAuthMock).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
  });

  it.each([
    ['/inventory/receipts', 'Receipts'],
    ['/inventory/barcodes', 'Barcodes'],
    ['/inventory/vision', 'Vision OCR'],
    ['/finance/gst', 'GST / Tax'],
    ['/finance/einvoice', 'E-Invoicing'],
    ['/orders', 'Orders'],
    ['/omnichannel', 'Omnichannel'],
    ['/operations/developer', 'Developer'],
    ['/operations/kyc', 'KYC'],
    ['/operations/team', 'Team'],
    ['/operations/maintenance', 'Maintenance'],
    ['/settings/i18n', 'Internationalization'],
    ['/financial-calendar', 'Financial Calendar'],
  ])('uses route-specific titles for %s', (pathname, title) => {
    currentPathname = pathname;
    render(<Header onOpenPalette={vi.fn()} />);

    expect(screen.getByRole('heading', { name: title })).toBeTruthy();
    expect(screen.getAllByLabelText('Breadcrumb')[0].textContent).toContain(title);
  });
});
