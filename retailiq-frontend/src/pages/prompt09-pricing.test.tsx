/* @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { authStore } from '@/stores/authStore';
import InventoryPricingPage from '@/pages/InventoryPricing';
import PricingPage from '@/pages/Pricing';

const applySuggestion = vi.fn();
const queryClients: QueryClient[] = [];
const pricingMocks = vi.hoisted(() => ({
  suggestions: [
    {
      id: 1,
      product_id: 100,
      product_name: 'Tea',
      current_price: 120,
      suggested_price: 130,
      margin_delta: 4.2,
      confidence: 0.84,
      reason: 'Competing stores raised prices.',
    },
  ],
  rules: {
    min_margin_pct: 12,
    max_discount_pct: 8,
    competitor_match: true,
    auto_apply_threshold: 70,
  },
  history: [{ changed_at: '2026-03-20', old_price: 110, new_price: 120, source: 'manual' }],
}));

vi.mock('@/components/layout/PageFrame', () => ({
  PageFrame: ({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) => (
    <main>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
      {children}
    </main>
  ),
}));

vi.mock('@/components/ui/ConfirmDialog', () => ({
  ConfirmDialog: ({
    open,
    title,
    body,
    onConfirm,
    onCancel,
    confirmLabel,
  }: {
    open: boolean;
    title: string;
    body: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmLabel: string;
  }) =>
    open ? (
      <div role="dialog">
        <h2>{title}</h2>
        <p>{body}</p>
        <button onClick={onConfirm}>{confirmLabel}</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null,
}));

vi.mock('@/components/ui/DataTable', () => ({
  DataTable: ({ columns, data }: { columns: Array<{ header: string; render: (row: any) => React.ReactNode }>; data: Array<Record<string, unknown>> }) => (
    <table>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.header}>{column.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => (
          <tr key={index}>
            {columns.map((column) => (
              <td key={column.header}>{column.render(row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children }: { children?: React.ReactNode }) => <section>{children}</section>,
  CardContent: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children?: React.ReactNode }) => <header>{children}</header>,
  CardTitle: ({ children }: { children?: React.ReactNode }) => <h2>{children}</h2>,
}));

vi.mock('@/components/ui/EmptyState', () => ({
  EmptyState: ({ title, body }: { title: string; body: string }) => (
    <div>
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  ),
}));

vi.mock('@/components/ui/ErrorState', () => ({
  ErrorState: ({ error }: { error: { message?: string } }) => <div>{error.message ?? 'error'}</div>,
}));

vi.mock('@/components/ui/SkeletonLoader', () => ({
  SkeletonLoader: () => <div>loading</div>,
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, loading, variant }: { children?: React.ReactNode; onClick?: () => void; loading?: boolean; variant?: string }) => (
    <button onClick={onClick} data-variant={variant} disabled={loading}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/Input', () => ({
  Input: ({ label, value, onChange, placeholder }: { label?: string; value?: string; onChange?: (event: { target: { value: string } }) => void; placeholder?: string }) => (
    <label>
      {label}
      <input value={value ?? ''} placeholder={placeholder} onChange={onChange as never} />
    </label>
  ),
}));

vi.mock('@/components/ui/Badge', () => ({
  Badge: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock('@/hooks/aiTools', () => ({
  useAiPricingOptimizeMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/hooks/pricing', () => ({
  usePricingSuggestionsQuery: () => ({
    data: pricingMocks.suggestions,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  usePricingRulesQuery: () => ({
    data: pricingMocks.rules,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  usePriceHistoryQuery: () => ({
    data: pricingMocks.history,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useApplySuggestionMutation: () => ({ mutateAsync: applySuggestion, isPending: false }),
  useDismissSuggestionMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdatePricingRulesMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

afterEach(() => {
  while (queryClients.length) {
    queryClients.pop()?.clear();
  }
});

describe('Prompt 09 pricing', () => {
  beforeEach(() => {
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
    vi.clearAllMocks();
  });

  it('renders canonical and legacy pricing routes and applies a suggestion', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClients.push(queryClient);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/inventory/pricing']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/inventory/pricing" element={<InventoryPricingPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('heading', { name: /Pricing Engine/i })).toBeTruthy();
    expect(screen.getByText('Tea')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /^Apply$/i }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/apply pricing suggestion/i)).toBeTruthy();
    await user.click(within(dialog).getByRole('button', { name: /^Apply$/i }));
    expect(applySuggestion).toHaveBeenCalledWith(1);

    cleanup();
    queryClient.clear();
    queryClients.pop();

    const legacyClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClients.push(legacyClient);

    render(
      <QueryClientProvider client={legacyClient}>
        <MemoryRouter initialEntries={['/pricing']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/pricing" element={<PricingPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('heading', { name: /Pricing Engine/i })).toBeTruthy();
  });
});
