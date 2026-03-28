/* @vitest-environment jsdom */
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authStore } from '@/stores/authStore';
import { RoleGuard } from '@/utils/guards';
import AiAssistantPage from '@/pages/AiAssistant';
import AiToolsPage from '@/pages/AiTools';
import DecisionsPage from '@/pages/Decisions';
import type { Decision } from '@/types/models';

const mocks = vi.hoisted(() => ({
  v1Query: vi.fn(),
  v1Recommend: vi.fn(),
  v2Query: vi.fn(),
  v2Recommend: vi.fn(),
  forecast: vi.fn(),
  pricing: vi.fn(),
  shelf: vi.fn(),
  receipt: vi.fn(),
  decisions: {
    data: {
      data: [] as Decision[],
      meta: { execution_time_ms: 1, total_recommendations: 0, whatsapp_enabled: false },
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  },
}));

vi.mock('@/components/layout/PageFrame', () => ({
  PageFrame: ({
    title,
    subtitle,
    children,
  }: {
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
  }) => (
    <main>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
      {children}
    </main>
  ),
}));

vi.mock('@/hooks/nlp', () => ({
  useNlpQueryMutation: () => ({ mutateAsync: mocks.v1Query, isPending: false }),
  useAiAssistantMutation: () => ({ mutateAsync: mocks.v2Query, isPending: false }),
  useAiRecommendMutation: () => ({ mutateAsync: mocks.v1Recommend, isPending: false }),
}));

vi.mock('@/hooks/aiTools', () => ({
  useAiV2QueryMutation: () => ({ mutateAsync: mocks.v2Query, isPending: false }),
  useAiV2RecommendMutation: () => ({ mutateAsync: mocks.v2Recommend, isPending: false }),
  useAiForecastMutation: () => ({ mutateAsync: mocks.forecast, isPending: false }),
  useAiPricingOptimizeMutation: () => ({ mutateAsync: mocks.pricing, isPending: false }),
  useAiShelfScanMutation: () => ({ mutateAsync: mocks.shelf, isPending: false }),
  useAiReceiptDigitizeMutation: () => ({ mutateAsync: mocks.receipt, isPending: false }),
}));

vi.mock('@/hooks/decisions', () => ({
  useDecisionsQuery: () => mocks.decisions,
}));

function setOwnerAuth() {
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
}

function setStaffAuth() {
  authStore.setState({
    accessToken: 'token',
    refreshToken: 'refresh',
    user: {
      user_id: 2,
      role: 'staff',
      store_id: 1,
      mobile_number: '8888888888',
      full_name: 'Staff User',
    },
    isAuthenticated: true,
    role: 'staff',
  });
}

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/ai" element={<AiAssistantPage />} />
        <Route path="/ai/tools" element={<AiToolsPage />} />
        <Route
          path="/ai/decisions"
          element={
            <RoleGuard role="owner">
              <DecisionsPage />
            </RoleGuard>
          }
        />
        <Route path="/ai-assistant" element={<Navigate to="/ai" replace />} />
        <Route path="/ai-assistant/tools" element={<Navigate to="/ai/tools" replace />} />
        <Route path="/decisions" element={<Navigate to="/ai/decisions" replace />} />
        <Route path="/403" element={<h1>403 - Forbidden</h1>} />
      </Routes>
    </MemoryRouter>,
  );
  return null;
}

describe('AI surface verification', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    window.localStorage.clear();
    setOwnerAuth();
    mocks.decisions = {
      data: {
        data: [
          {
            id: 'decision-1',
            category: 'inventory',
            title: 'Restock tea',
            description: 'Tea stock is below the reorder threshold.',
            impact: 'Avoid stockouts',
            priority: 'high',
            available_actions: ['Reorder now', 'Review suppliers'],
          },
          {
            id: 'decision-2',
            category: 'pricing',
            title: 'Raise coffee price',
            description: 'Margin is below target for the current blend.',
            impact: 'Lift gross margin',
            priority: 'medium',
            available_actions: ['Apply pricing rule'],
          },
        ] as Decision[],
        meta: { execution_time_ms: 8.4, total_recommendations: 2, whatsapp_enabled: true },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    };
  });

  it('renders the canonical AI routes', async () => {
    renderAt('/ai');
    expect(await screen.findByRole('heading', { name: /ai assistant/i })).toBeTruthy();
    expect(screen.getByText(/start a conversation/i)).toBeTruthy();
  });

  it('redirects legacy AI routes to the canonical paths', async () => {
    renderAt('/ai-assistant');
    expect(await screen.findByRole('heading', { name: /ai assistant/i })).toBeTruthy();

    cleanup();
    setOwnerAuth();

    renderAt('/ai-assistant/tools');
    expect(await screen.findByRole('heading', { name: /ai tools/i })).toBeTruthy();

    cleanup();
    setOwnerAuth();

    renderAt('/decisions');
    expect(await screen.findByRole('heading', { name: /ai decisions/i })).toBeTruthy();
  });

  it('sends chat messages and uses the v2 AI response first', async () => {
    mocks.v2Query.mockResolvedValueOnce({ response: 'Revenue is up 14% this week.' });

    renderAt('/ai');
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/ask retailiq/i), 'How is revenue trending?');
    await user.click(screen.getByRole('button', { name: /^send$/i }));

    expect((await screen.findAllByText(/revenue is up 14% this week/i)).length).toBeGreaterThan(0);
    expect(mocks.v1Query).not.toHaveBeenCalled();
  });

  it('falls back to v1 NLP when v2 AI NLP fails', async () => {
    mocks.v2Query.mockRejectedValueOnce(new Error('v2 unavailable'));
    mocks.v1Query.mockResolvedValueOnce({
      intent: 'revenue',
      headline: 'Revenue improved',
      detail: 'Revenue is tracking above the prior period.',
      action: 'Monitor the trend',
      supporting_metrics: {},
    });

    renderAt('/ai');
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/ask retailiq/i), 'Show me revenue trend');
    await user.click(screen.getByRole('button', { name: /^send$/i }));

    expect((await screen.findAllByText(/revenue is tracking above the prior period/i)).length).toBeGreaterThan(0);
  });

  it('renders grouped decision cards with metadata', async () => {
    renderAt('/ai/decisions');

    expect(await screen.findByRole('heading', { name: /ai decisions/i })).toBeTruthy();
    expect(screen.getByText('inventory')).toBeTruthy();
    expect(screen.getByText('pricing')).toBeTruthy();
    expect(screen.getByText(/2 recommendations/i)).toBeTruthy();
    expect(screen.getByText(/whatsapp enabled/i)).toBeTruthy();
    expect(screen.getByText(/restock tea/i)).toBeTruthy();
    expect(screen.getByText(/raise coffee price/i)).toBeTruthy();
  });

  it('runs AI tools mutations and handles file uploads', async () => {
    mocks.v2Recommend.mockResolvedValueOnce({
      recommendations: [{ product_id: 1, product_name: 'Tea', reason: 'Strong seller', score: 0.91 }],
    });
    mocks.forecast.mockResolvedValueOnce({
      historical: [],
      forecast: [
        { date: '2026-03-28', predicted: 12 },
        { date: '2026-03-29', predicted: 15 },
      ],
      meta: { generated_at: '2026-03-28T00:00:00.000Z' },
    });
    mocks.pricing.mockResolvedValueOnce([
      { product_id: 5, product_name: 'Coffee', suggested_price: 149, suggestion_type: 'RAISE', reason: 'Margin below target' },
    ]);
    mocks.shelf.mockResolvedValueOnce({ status: 'success', detected_products: [{ name: 'Tea' }] });
    mocks.receipt.mockResolvedValueOnce({ status: 'success', items: [{ name: 'Milk' }] });

    renderAt('/ai/tools');
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /generate recommendations/i }));
    expect(await screen.findByText(/strong seller/i)).toBeTruthy();

    await user.type(screen.getByPlaceholderText(/e\.g\. 123/i), '12');
    await user.click(screen.getByRole('button', { name: /generate forecast/i }));
    expect(await screen.findByText(/2026-03-28: 12.0/i)).toBeTruthy();

    const pricingInput = screen.getByPlaceholderText(/comma-separated ids/i);
    await user.clear(pricingInput);
    await user.type(pricingInput, '5, 6');
    await user.click(screen.getByRole('button', { name: /optimize pricing/i }));
    expect(await screen.findByText(/margin below target/i)).toBeTruthy();

    const shelfInput = screen.getByLabelText(/upload shelf image/i) as HTMLInputElement;
    const shelfFile = new File(['shelf'], 'shelf.png', { type: 'image/png' });
    await user.upload(shelfInput, shelfFile);
    expect(await screen.findByText(/selected: shelf\.png/i)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /analyze shelf/i }));
    expect(await screen.findByText(/detected_products/i)).toBeTruthy();

    const receiptInput = screen.getByLabelText(/upload receipt image/i) as HTMLInputElement;
    const receiptFile = new File(['receipt'], 'receipt.png', { type: 'image/png' });
    await user.upload(receiptInput, receiptFile);
    expect(await screen.findByText(/selected: receipt\.png/i)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /digitize receipt/i }));
    expect(await screen.findByText(/items/i)).toBeTruthy();
  });

  it('keeps owner-only decisions gated for staff members', async () => {
    setStaffAuth();

    renderAt('/ai/decisions');
    expect(await screen.findByRole('heading', { name: /403 - forbidden/i })).toBeTruthy();
  });
});
