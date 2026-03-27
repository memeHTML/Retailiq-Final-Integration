import { useMemo, useState } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { normalizeApiError } from '@/utils/errors';
import {
  useCreateEventMutation,
  useDeleteEventMutation,
  useEventsQuery,
  useUpcomingEventsQuery,
  useUpdateEventMutation,
} from '@/hooks/events';
import type { EventRecord, EventType } from '@/types/models';
import { EventForm, type EventFormValues } from './EventForm';

const EVENT_TYPE_VARIANTS: Record<EventType, 'blue' | 'indigo' | 'green' | 'yellow' | 'red'> = {
  HOLIDAY: 'blue',
  FESTIVAL: 'indigo',
  PROMOTION: 'green',
  SALE_DAY: 'yellow',
  CLOSURE: 'red',
};

const INITIAL_FORM: EventFormValues = {
  event_name: '',
  event_type: 'PROMOTION',
  start_date: '',
  end_date: '',
  expected_impact_pct: '',
  is_recurring: false,
  recurrence_rule: '',
};

const toFormValues = (event: EventRecord): EventFormValues => ({
  event_name: event.event_name,
  event_type: event.event_type,
  start_date: event.start_date,
  end_date: event.end_date,
  expected_impact_pct: event.expected_impact_pct == null ? '' : String(event.expected_impact_pct),
  is_recurring: event.is_recurring,
  recurrence_rule: event.recurrence_rule ?? '',
});

const toPayload = (form: EventFormValues) => ({
  event_name: form.event_name.trim(),
  event_type: form.event_type,
  start_date: form.start_date,
  end_date: form.end_date,
  expected_impact_pct: form.expected_impact_pct.trim() ? Number(form.expected_impact_pct) : null,
  is_recurring: form.is_recurring,
  recurrence_rule: form.recurrence_rule.trim() ? form.recurrence_rule.trim() : null,
});

const isValidDateRange = (startDate: string, endDate: string) =>
  !startDate || !endDate || new Date(`${startDate}T00:00:00`).getTime() <= new Date(`${endDate}T00:00:00`).getTime();

export default function FinancialCalendarPage() {
  const eventsQuery = useEventsQuery();
  const createMutation = useCreateEventMutation();
  const updateMutation = useUpdateEventMutation();
  const deleteMutation = useDeleteEventMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState<EventFormValues>(INITIAL_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [horizon, setHorizon] = useState(30);

  const upcomingEventsQuery = useUpcomingEventsQuery(horizon);
  const events = eventsQuery.data ?? [];
  const upcomingEvents = upcomingEventsQuery.data ?? [];

  const formMode = editingId ? 'edit' : 'create';
  const formPending = createMutation.isPending || updateMutation.isPending;

  const openCreateForm = () => {
    createMutation.reset();
    updateMutation.reset();
    setEditingId(null);
    setForm(INITIAL_FORM);
    setFormError(null);
    setShowForm(true);
  };

  const openEditForm = (event: EventRecord) => {
    createMutation.reset();
    updateMutation.reset();
    setEditingId(event.id);
    setForm(toFormValues(event));
    setFormError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    createMutation.reset();
    updateMutation.reset();
    setShowForm(false);
    setEditingId(null);
    setForm(INITIAL_FORM);
    setFormError(null);
  };

  const submitForm = () => {
    if (!form.event_name.trim() || !form.start_date || !form.end_date) {
      setFormError('Event name, start date, and end date are required.');
      return;
    }

    if (!isValidDateRange(form.start_date, form.end_date)) {
      setFormError('Start date must be on or before the end date.');
      return;
    }

    if (form.expected_impact_pct.trim()) {
      const numericImpact = Number(form.expected_impact_pct);
      if (Number.isNaN(numericImpact)) {
        setFormError('Expected impact must be a number.');
        return;
      }
    }

    const payload = toPayload(form);

    if (editingId) {
      updateMutation.mutate(
        { eventId: editingId, data: payload },
        {
          onSuccess: () => closeForm(),
        },
      );
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: () => closeForm(),
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) {
      return;
    }

    deleteMutation.mutate(deleteTarget, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const title = useMemo(() => 'Financial Calendar', []);

  if (eventsQuery.isError) {
    return <ErrorState error={normalizeApiError(eventsQuery.error)} onRetry={() => void eventsQuery.refetch()} />;
  }

  return (
    <PageFrame
      title={title}
      subtitle="Manage scheduled events, forecast checkpoints, and recurring business dates."
      actions={<Button onClick={showForm ? closeForm : openCreateForm}>{showForm ? 'Hide form' : '+ New Event'}</Button>}
    >
      <Card className="mb-6">
        <CardHeader>
          <div className="stack" style={{ gap: '0.5rem' }}>
            <CardTitle>Upcoming events</CardTitle>
            <div className="button-row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <p className="muted" style={{ margin: 0 }}>Next {horizon} days</p>
              <label className="button-row" style={{ gap: '0.5rem' }}>
                <span className="muted">Window</span>
                <select className="input" value={horizon} onChange={(event) => setHorizon(Number(event.target.value))}>
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                </select>
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingEventsQuery.isLoading ? (
            <SkeletonLoader variant="rect" height={96} />
          ) : upcomingEventsQuery.isError ? (
            <ErrorState error={normalizeApiError(upcomingEventsQuery.error)} onRetry={() => void upcomingEventsQuery.refetch()} />
          ) : upcomingEvents.length === 0 ? (
            <EmptyState title="No upcoming events" body={`No events are scheduled in the next ${horizon} days.`} />
          ) : (
            <div className="stack" style={{ gap: '0.75rem' }}>
              {upcomingEvents.map((event) => (
                <div key={event.id} className="button-row" style={{ justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                  <Badge variant={EVENT_TYPE_VARIANTS[event.event_type] ?? 'secondary'}>{event.event_type}</Badge>
                  <strong>{event.event_name}</strong>
                  <span className="muted">
                    {event.start_date} to {event.end_date}
                  </span>
                  {event.expected_impact_pct != null ? (
                    <Badge variant="info">{`${event.expected_impact_pct > 0 ? '+' : ''}${event.expected_impact_pct}%`}</Badge>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showForm ? (
        <EventForm
          mode={formMode}
          value={form}
          onChange={setForm}
          onSubmit={submitForm}
          onCancel={closeForm}
          loading={formPending}
          error={formError ?? (createMutation.isError || updateMutation.isError ? normalizeApiError(createMutation.error ?? updateMutation.error).message : null)}
        />
      ) : null}

      <Card>
        <CardHeader>
          <div className="button-row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <CardTitle>All events</CardTitle>
            <Badge variant="secondary">{events.length} total</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {eventsQuery.isLoading ? (
            <SkeletonLoader variant="rect" height={240} />
          ) : events.length === 0 ? (
            <EmptyState title="No events" body="Create the first event to start tracking scheduled impact." />
          ) : (
            <DataTable<EventRecord>
              columns={[
                { key: 'name', header: 'Event', render: (row) => row.event_name },
                { key: 'type', header: 'Type', render: (row) => <Badge variant={EVENT_TYPE_VARIANTS[row.event_type] ?? 'secondary'}>{row.event_type}</Badge> },
                { key: 'start', header: 'Start', render: (row) => row.start_date },
                { key: 'end', header: 'End', render: (row) => row.end_date },
                { key: 'impact', header: 'Impact', render: (row) => (row.expected_impact_pct == null ? 'N/A' : `${row.expected_impact_pct}%`) },
                { key: 'recurring', header: 'Recurring', render: (row) => (row.is_recurring ? 'Yes' : 'No') },
                { key: 'actions', header: 'Actions', render: (row) => (
                  <div className="button-row" style={{ justifyContent: 'flex-start' }}>
                    <Button size="sm" variant="secondary" onClick={() => openEditForm(row)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(row.id)}>
                      Delete
                    </Button>
                  </div>
                ) },
              ]}
              data={events}
              emptyMessage="No events"
            />
          )}
        </CardContent>
      </Card>

      {deleteTarget ? (
        <ConfirmDialog
          open
          title="Delete Event"
          body="Are you sure you want to delete this event? This cannot be undone."
          confirmLabel="Delete"
          destructive
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      ) : null}
    </PageFrame>
  );
}
