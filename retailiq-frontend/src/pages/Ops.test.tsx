/* @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OpsPage from './Ops';

const maintenanceQueryMock = vi.hoisted(() => ({
  isLoading: false,
  isError: false,
  data: {
    system_status: 'healthy',
    checked_at: '2026-03-27T10:00:00.000Z',
    scheduled_maintenance: [{ title: 'Database upgrade' }],
    ongoing_incidents: [{ message: 'API latency resolved' }],
  },
  error: undefined as unknown,
  refetch: vi.fn(),
}));

vi.mock('@/hooks/platform', () => ({
  useMaintenanceStatusQuery: () => maintenanceQueryMock,
}));

describe('OpsPage', () => {
  beforeEach(() => {
    maintenanceQueryMock.isLoading = false;
    maintenanceQueryMock.isError = false;
    maintenanceQueryMock.data = {
      system_status: 'healthy',
      checked_at: '2026-03-27T10:00:00.000Z',
      scheduled_maintenance: [{ title: 'Database upgrade' }],
      ongoing_incidents: [{ message: 'API latency resolved' }],
    };
    maintenanceQueryMock.refetch.mockClear();
  });

  it('renders maintenance data safely', () => {
    render(<OpsPage />);

    expect(screen.getByRole('heading', { name: 'Maintenance' })).toBeTruthy();
    expect(screen.getByText('healthy')).toBeTruthy();
    expect(screen.getByText('Database upgrade')).toBeTruthy();
    expect(screen.getByText('API latency resolved')).toBeTruthy();
  });

  it('treats empty arrays as healthy no-op states', () => {
    maintenanceQueryMock.data = {
      system_status: 'healthy',
      checked_at: '',
      scheduled_maintenance: [],
      ongoing_incidents: [],
    };

    render(<OpsPage />);

    expect(screen.getByText(/no scheduled maintenance/i)).toBeTruthy();
    expect(screen.getByText(/no active incidents/i)).toBeTruthy();
    expect(screen.getByText(/not reported/i)).toBeTruthy();
  });

  it('does not crash on partial backend data', () => {
    maintenanceQueryMock.data = {
      system_status: 'degraded',
    } as never;

    render(<OpsPage />);

    expect(screen.getByText('degraded')).toBeTruthy();
    expect(screen.getAllByText(/no scheduled maintenance/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/no active incidents/i).length).toBeGreaterThan(0);
  });
});
