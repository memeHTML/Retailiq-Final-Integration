/* @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import OfflineSnapshotPage from './OfflineSnapshotPage';

const refetchMock = vi.fn();
const createReadyState = () => ({
  data: {
    built_at: '2026-03-27T12:00:00Z',
    size_bytes: 2048,
    snapshot: {
      kpis: {
        today_revenue: 12345,
        today_profit: 4567,
        today_transactions: 89,
      },
      revenue_30d: [
        { date: '2026-03-26', revenue: 1000, profit: 100 },
      ],
      top_products_7d: [
        { name: 'Sugar', revenue: 900, units_sold: 12 },
      ],
      alerts_open: [
        { id: 'alert-1', message: 'Low stock on Sugar', priority: 'HIGH', created_at: '2026-03-26T10:00:00Z' },
      ],
      low_stock_products: [
        { name: 'Sugar', current_stock: 2, reorder_point: 10 },
      ],
    },
  },
  isLoading: false,
  isError: false,
  error: null,
  refetch: refetchMock,
});

let queryState: any = createReadyState();

const createObjectURLMock = vi.fn(() => 'blob:offline-snapshot');
const revokeObjectURLMock = vi.fn();
const clickMock = vi.fn();

vi.mock('@/hooks/offline', () => ({
  useOfflineSnapshotQuery: () => queryState,
}));

describe('OfflineSnapshotPage', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    queryState = createReadyState();
    Object.defineProperty(globalThis.URL, 'createObjectURL', { configurable: true, value: createObjectURLMock });
    Object.defineProperty(globalThis.URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURLMock });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(clickMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders ready snapshot data and supports download export', async () => {
    const user = userEvent.setup();

    render(<OfflineSnapshotPage />);

    expect(screen.getByRole('heading', { name: 'Offline Snapshot' })).toBeTruthy();
    expect(screen.getByText(/built at: 2026-03-27t12:00:00z/i)).toBeTruthy();
    expect(screen.getByText('12,345')).toBeTruthy();
    expect(screen.getAllByText('Sugar').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /download snapshot/i }));

    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).toHaveBeenCalledTimes(1);
    expect(clickMock).toHaveBeenCalledTimes(1);
  });

  it('shows the building state and allows refresh', async () => {
    const user = userEvent.setup();
    queryState = {
      ...queryState,
      data: {
        status: 'building',
        message: 'Snapshot is currently building.',
      },
    };

    render(<OfflineSnapshotPage />);

    expect(screen.getByText(/snapshot building/i)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /refresh/i }));
    expect(refetchMock).toHaveBeenCalled();
  });
});
