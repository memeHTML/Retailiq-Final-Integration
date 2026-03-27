/* @vitest-environment jsdom */
import { act } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CommandPalette } from './CommandPalette';
import { COMMAND_PALETTE_RECENTS_KEY } from '@/lib/constants';

const navigateMock = vi.fn();
const consoleErrorSpy = vi.spyOn(console, 'error');
let unexpectedConsoleErrors: string[] = [];

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
    unexpectedConsoleErrors = [];
    consoleErrorSpy.mockImplementation((...args: unknown[]) => {
      const message = args.map((value) => String(value)).join(' ');
      if (
        (message.includes('wrapped in act(...)') && message.includes('cmdk/dist/index.mjs')) ||
        (message.includes('wrapped in act(...)') && message.includes('CommandPalette'))
      ) {
        return;
      }
      unexpectedConsoleErrors.push(message);
    });
  });

  afterEach(() => {
    expect(unexpectedConsoleErrors).toEqual([]);
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it('supports keyboard selection and stores recent items', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <CommandPalette open onOpenChange={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('dialog', { name: /quick search/i })).toBeTruthy();
    const input = within(container).getByPlaceholderText(/search pages and actions/i);
    await act(async () => {
      await user.type(input, 'intelligence');
      await user.keyboard('{ArrowDown}{Enter}');
    });

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

    await act(async () => {
      await user.keyboard('{Escape}');
    });
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('normalizes legacy recents and searches canonical operations destinations', async () => {
    window.localStorage.setItem(
      COMMAND_PALETTE_RECENTS_KEY,
      JSON.stringify([
        { label: 'Legacy Maintenance', description: 'Old entry', to: '/ops' },
        { label: 'Legacy i18n', description: 'Old entry', to: '/i18n' },
        { label: 'Legacy Calendar', description: 'Old entry', to: '/events' },
      ]),
    );

    const user = userEvent.setup();

    const { container } = render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <CommandPalette open onOpenChange={vi.fn()} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(COMMAND_PALETTE_RECENTS_KEY) ?? '[]') as Array<{ to: string }>;
      expect(stored[0].to).toBe('/operations/maintenance');
      expect(stored[1].to).toBe('/settings/i18n');
      expect(stored[2].to).toBe('/financial-calendar');
    });

    const input = within(container).getByPlaceholderText(/search pages and actions/i);
    await act(async () => {
      await user.clear(input);
      await user.type(input, 'team');
      await user.keyboard('{ArrowDown}{Enter}');
    });

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/operations/team');
    });
  });

  it('searches canonical i18n destinations', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <CommandPalette open onOpenChange={vi.fn()} />
      </MemoryRouter>,
    );

    const input = within(container).getByPlaceholderText(/search pages and actions/i);
    await act(async () => {
      await user.type(input, 'internationalization');
      await user.keyboard('{ArrowDown}{Enter}');
    });

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/settings/i18n');
    });
  });
});
