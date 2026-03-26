/* @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
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

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
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
    vi.clearAllMocks();
  });

  it('toggles mobile navigation and exposes logout controls', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Header onOpenPalette={vi.fn()} />
      </MemoryRouter>,
    );

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
});
