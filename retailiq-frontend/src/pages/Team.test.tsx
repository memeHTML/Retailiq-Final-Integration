/* @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { beforeEach } from 'vitest';
import TeamPage from './Team';

const teamPingQueryMock = vi.hoisted(() => ({
  isLoading: false,
  isError: false,
  data: { success: true },
  error: undefined as unknown,
  refetch: vi.fn(),
}));

vi.mock('@/hooks/platform', () => ({
  useTeamPingQuery: () => teamPingQueryMock,
}));

describe('TeamPage', () => {
  beforeEach(() => {
    teamPingQueryMock.isLoading = false;
    teamPingQueryMock.isError = false;
    teamPingQueryMock.data = { success: true };
    teamPingQueryMock.refetch.mockClear();
  });

  it('renders a healthy connectivity state when the backend ping succeeds', () => {
    render(<TeamPage />);

    expect(screen.getByRole('heading', { name: 'Team' })).toBeTruthy();
    expect(screen.getByText('Healthy')).toBeTruthy();
    expect(screen.getByText(/no additional payload is required or expected beyond/i)).toBeTruthy();
  });

  it('renders an error state when the ping payload is not successful', () => {
    teamPingQueryMock.data = { success: false };

    render(<TeamPage />);

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText(/unexpected response/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /retry/i })).toBeTruthy();
  });
});
