/* @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DecisionsPage from './Decisions';

vi.mock('@/hooks/decisions', () => ({
  useDecisionsQuery: () => ({
    data: {
      data: [
        {
          id: 'decision-1',
          category: 'PRICING',
          title: 'Increase product price',
          description: 'The backend recommends a small increase.',
          impact: 'HIGH',
          priority: 'high',
          available_actions: ['Acknowledge', 'Send via WhatsApp'],
        },
      ],
      meta: {
        execution_time_ms: 12,
        total_recommendations: 1,
        whatsapp_enabled: true,
      },
    },
    isLoading: false,
    isError: false,
    error: undefined,
    refetch: vi.fn(),
  }),
}));

describe('DecisionsPage', () => {
  it('renders the backend decision payload in read-only mode', () => {
    render(<DecisionsPage />);

    expect(screen.getByRole('heading', { name: /ai decisions/i })).toBeTruthy();
    expect(screen.getByText(/1 recommendations/i)).toBeTruthy();
    expect(screen.getByText(/generated in 12ms/i)).toBeTruthy();
    expect(screen.getByText('Increase product price')).toBeTruthy();
    expect(screen.getByText('Acknowledge')).toBeTruthy();
    expect(screen.getByText('Send via WhatsApp')).toBeTruthy();
  });
});
