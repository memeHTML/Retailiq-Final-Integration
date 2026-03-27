/* @vitest-environment jsdom */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommandPalette } from './CommandPalette';

const navigateMock = vi.fn();

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.stubGlobal('ResizeObserver', ResizeObserverMock);
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  value: vi.fn(),
});

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('supports keyboard selection and stores recent items', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <CommandPalette open onOpenChange={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('dialog', { name: /quick search/i })).toBeTruthy();
    const input = screen.getByPlaceholderText(/search pages and actions/i);
    await user.type(input, 'intelligence');
    await user.keyboard('{ArrowDown}{Enter}');

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/market-intelligence');
    });

    expect(JSON.parse(window.localStorage.getItem('retailiq-command-palette-recents') ?? '[]')[0].to).toBe('/market-intelligence');
  });

  it('closes on escape', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <CommandPalette open onOpenChange={onOpenChange} />
      </MemoryRouter>,
    );

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
