/* @vitest-environment jsdom */
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FinancialCalendarPage from './FinancialCalendarPage';

const createMutate = vi.fn();
const updateMutate = vi.fn();
const deleteMutate = vi.fn();

const eventsQuery = {
  data: [
    {
      id: 'event-1',
      event_name: 'Summer Sale',
      event_type: 'PROMOTION',
      start_date: '2026-04-01',
      end_date: '2026-04-03',
      expected_impact_pct: 12,
      is_recurring: false,
      recurrence_rule: null,
    },
  ],
  error: null,
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
};

const createUpcomingState = () => ({
  data: [
    {
      id: 'event-2',
      event_name: 'Festival Window',
      event_type: 'FESTIVAL',
      start_date: '2026-04-10',
      end_date: '2026-04-12',
      expected_impact_pct: 18,
    },
  ],
  error: null,
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
});

let upcomingQuery: any = createUpcomingState();

vi.mock('@/hooks/events', () => ({
  useEventsQuery: () => eventsQuery,
  useUpcomingEventsQuery: () => upcomingQuery,
  useCreateEventMutation: () => ({ mutate: createMutate, isPending: false, reset: vi.fn() }),
  useUpdateEventMutation: () => ({ mutate: updateMutate, isPending: false, reset: vi.fn() }),
  useDeleteEventMutation: () => ({ mutate: deleteMutate, isPending: false, reset: vi.fn() }),
}));

describe('FinancialCalendarPage', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    upcomingQuery = createUpcomingState();
  });

  it('blocks invalid date ranges before create submission', async () => {
    const user = userEvent.setup();

    render(<FinancialCalendarPage />);

    await user.click(screen.getByRole('button', { name: /\+ new event/i }));
    await user.clear(screen.getByLabelText(/event name/i));
    await user.type(screen.getByLabelText(/event name/i), 'Quarter End');
    await user.type(screen.getByLabelText(/start date/i), '2026-04-10');
    await user.type(screen.getByLabelText(/end date/i), '2026-04-01');
    await user.click(screen.getByRole('button', { name: /create event/i }));

    expect(createMutate).not.toHaveBeenCalled();
    expect(screen.getByText(/start date must be on or before the end date/i)).toBeTruthy();
  });

  it('surfaces upcoming query failures instead of hiding them', () => {
    upcomingQuery.isError = true;
    upcomingQuery.error = { status: 500, message: 'Upcoming events unavailable' };

    render(<FinancialCalendarPage />);

    expect(screen.getByText(/upcoming events unavailable/i)).toBeTruthy();
  });

  it('submits create payloads using backend field names', async () => {
    const user = userEvent.setup();
    createMutate.mockImplementation((_payload: unknown, options?: { onSuccess?: () => void }) => options?.onSuccess?.());

    render(<FinancialCalendarPage />);

    await user.click(screen.getByRole('button', { name: /\+ new event/i }));
    await user.clear(screen.getByLabelText(/event name/i));
    await user.type(screen.getByLabelText(/event name/i), 'Quarter End');
    await user.clear(screen.getByLabelText(/start date/i));
    await user.type(screen.getByLabelText(/start date/i), '2026-04-10');
    await user.clear(screen.getByLabelText(/end date/i));
    await user.type(screen.getByLabelText(/end date/i), '2026-04-12');
    await user.clear(screen.getByLabelText(/expected impact/i));
    await user.type(screen.getByLabelText(/expected impact/i), '25');
    await user.type(screen.getByLabelText(/recurrence rule/i), 'RRULE:FREQ=MONTHLY');
    await user.click(screen.getByRole('checkbox', { name: /recurring/i }));
    await user.click(screen.getByRole('button', { name: /create event/i }));

    expect(createMutate).toHaveBeenCalledWith({
      event_name: 'Quarter End',
      event_type: 'PROMOTION',
      start_date: '2026-04-10',
      end_date: '2026-04-12',
      expected_impact_pct: 25,
      is_recurring: true,
      recurrence_rule: 'RRULE:FREQ=MONTHLY',
    }, expect.any(Object));
  });

  it('rejects malformed impact percentages before submit', async () => {
    const user = userEvent.setup();

    render(<FinancialCalendarPage />);

    await user.click(screen.getByRole('button', { name: /\+ new event/i }));
    await user.clear(screen.getByLabelText(/event name/i));
    await user.type(screen.getByLabelText(/event name/i), 'Quarter End');
    await user.clear(screen.getByLabelText(/start date/i));
    await user.type(screen.getByLabelText(/start date/i), '2026-04-10');
    await user.clear(screen.getByLabelText(/end date/i));
    await user.type(screen.getByLabelText(/end date/i), '2026-04-12');
    await user.clear(screen.getByLabelText(/expected impact/i));
    await user.type(screen.getByLabelText(/expected impact/i), 'abc');
    await user.click(screen.getByRole('button', { name: /create event/i }));

    expect(createMutate).not.toHaveBeenCalled();
    expect(screen.getByText(/expected impact must be a number/i)).toBeTruthy();
  });

  it('supports editing and deleting existing events', async () => {
    const user = userEvent.setup();
    updateMutate.mockImplementation((_payload: unknown, options?: { onSuccess?: () => void }) => options?.onSuccess?.());
    deleteMutate.mockImplementation((_eventId: unknown, options?: { onSuccess?: () => void }) => options?.onSuccess?.());

    render(<FinancialCalendarPage />);

    await user.click(screen.getByRole('button', { name: /edit/i }));
    await user.clear(screen.getByLabelText(/event name/i));
    await user.type(screen.getByLabelText(/event name/i), 'Summer Sale Updated');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(updateMutate).toHaveBeenCalledWith({
      eventId: 'event-1',
      data: {
        event_name: 'Summer Sale Updated',
        event_type: 'PROMOTION',
        start_date: '2026-04-01',
        end_date: '2026-04-03',
        expected_impact_pct: 12,
        is_recurring: false,
        recurrence_rule: null,
      },
    }, expect.any(Object));

    await user.click(screen.getByRole('button', { name: /delete/i }));
    const dialog = screen.getByRole('dialog', { name: /delete event/i });
    await user.click(within(dialog).getByRole('button', { name: /^delete$/i }));

    expect(deleteMutate).toHaveBeenCalledWith('event-1', expect.any(Object));
  });
});
