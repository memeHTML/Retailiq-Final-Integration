/* @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AnalyticsPage from './Analytics';

const mockHooks = vi.hoisted(() => ({
  dashboard: {
    today_kpis: {
      date: '2026-03-27',
      revenue: 250000,
      profit: 62000,
      transactions: 128,
      avg_basket: 1953.12,
      units_sold: 312,
    },
    insights: [{ type: 'signal', title: 'Momentum is healthy', body: 'Revenue is tracking above the prior window.' }],
    top_products_today: [],
    alerts_summary: { low_stock: 4 },
    revenue_7d: [],
    moving_avg_7d: [],
    category_breakdown: [],
    payment_mode_breakdown: [],
  },
  revenue: [
    { date: '2026-03-21', revenue: 120000, profit: 32000, transactions: 55 },
    { date: '2026-03-22', revenue: 130000, profit: 33000, transactions: 60 },
  ],
  profit: [
    { date: '2026-03-21', revenue: 120000, profit: 32000, transactions: 55 },
    { date: '2026-03-22', revenue: 130000, profit: 33000, transactions: 60 },
  ],
  topProducts: [
    { product_id: 'p1', name: 'Tea', revenue: 50000, quantity: 100, profit: 15000 },
    { product_id: 'p2', name: 'Coffee', revenue: 40000, quantity: 80, profit: 12000 },
  ],
  categories: [
    { category_id: 'c1', name: 'Beverages', revenue: 90000, profit: 27000, units: 180, share_pct: 45 },
    { category_id: 'c2', name: 'Snacks', revenue: 110000, profit: 30000, units: 220, share_pct: 55 },
  ],
  paymentModes: [
    { mode: 'CASH', txn_count: 70, revenue: 100000, txn_share_pct: 54.7, rev_share_pct: 40 },
    { mode: 'UPI', txn_count: 58, revenue: 150000, txn_share_pct: 45.3, rev_share_pct: 60 },
  ],
  customerSummary: {
    identified_customers: 81,
    new_customers: 13,
    returning_customers: 68,
    total_transactions: 128,
    identified_transactions: 110,
    anonymous_transactions: 18,
    total_revenue: 250000,
    avg_revenue_per_customer: 3086.42,
  },
  diagnostics: {
    trend_deviations: [{ date: '2026-03-22', revenue: 130000, moving_avg_7d: 120000, deviation_pct: 8.3, flagged: false }],
    sku_rolling_variance: [{ product_id: 'p1', name: 'Tea', cv_14d: 12.5, cv_30d: 18.3, flagged: true }],
    margin_drift: { prior_avg_margin_pct: 23.4, current_avg_margin_pct: 21.9, delta_pct: -1.5, flagged: false },
  },
}));

function renderWithClient(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  queryClient.setQueryData(['analytics', 'dashboard'], mockHooks.dashboard);
  queryClient.setQueryData(['analytics', 'profit'], mockHooks.profit);
  queryClient.setQueryData(['analytics', 'revenue'], mockHooks.revenue);
  queryClient.setQueryData(['analytics', 'top-products'], mockHooks.topProducts);
  queryClient.setQueryData(['analytics', 'category-breakdown'], mockHooks.categories);
  queryClient.setQueryData(['analytics', 'payment-modes'], mockHooks.paymentModes);

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <AnalyticsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('analytics page', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/analytics');
  });

  it('renders the chart-first analytics surface', () => {
    renderWithClient('/analytics');

    expect(screen.getByRole('heading', { name: /analytics/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /revenue today/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /^profit$/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /transactions today/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /average margin/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /dashboard insights/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /alert summary/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /top products today/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /top products \(range\)/i })).toBeTruthy();
    expect(screen.getByText(/category breakdown/i)).toBeTruthy();
    expect(screen.getByText(/payment mode breakdown/i)).toBeTruthy();
    expect(screen.getAllByText(/more analytics/i).length).toBeGreaterThanOrEqual(3);
  });

  it('links to the canonical downstream analytics destinations', () => {
    renderWithClient('/analytics');

    expect(screen.getByRole('link', { name: /open staff performance/i }).getAttribute('href')).toBe('/staff-performance');
    expect(screen.getByRole('link', { name: /open market intelligence/i }).getAttribute('href')).toBe('/market-intelligence');
    expect(screen.getByRole('link', { name: /open offline data/i }).getAttribute('href')).toBe('/offline');
  });
});
