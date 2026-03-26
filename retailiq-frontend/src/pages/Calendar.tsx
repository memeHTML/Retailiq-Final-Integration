import { useEffect, useMemo, useState } from 'react';
import { format, isSameMonth, startOfMonth, endOfMonth, addMonths, subMonths, parseISO } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { PageFrame } from '@/components/layout/PageFrame';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { normalizeApiError } from '@/utils/errors';
import { useCreateEventMutation, useEventsQuery } from '@/hooks/events';
import type { EventRecord } from '@/types/models';

const EVENT_STYLES: Record<string, string> = {
  HOLIDAY: 'bg-sky-500',
  FESTIVAL: 'bg-violet-500',
  PROMOTION: 'bg-emerald-500',
  SALE_DAY: 'bg-amber-500',
  CLOSURE: 'bg-rose-500',
};

const eventTypeOptions = ['HOLIDAY', 'FESTIVAL', 'PROMOTION', 'SALE_DAY', 'CLOSURE'] as const;

const isWithinDay = (event: EventRecord, day: Date) => {
  const start = event.start_date ? parseISO(event.start_date) : null;
  const end = event.end_date ? parseISO(event.end_date) : start;
  if (!start || !end) return false;
  return day >= start && day <= end;
};

export default function CalendarPage() {
  const [visibleMonth, setVisibleMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);
  const [form, setForm] = useState({
    event_name: '',
    event_type: 'PROMOTION',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    expected_impact_pct: '',
    is_recurring: false,
    recurrence_rule: '',
  });

  const rangeStart = format(startOfMonth(visibleMonth), 'yyyy-MM-dd');
  const rangeEnd = format(endOfMonth(visibleMonth), 'yyyy-MM-dd');
  const eventsQuery = useEventsQuery({ from: rangeStart, to: rangeEnd });
  const createEventMutation = useCreateEventMutation();

  const events = eventsQuery.data ?? [];

  useEffect(() => {
    if (!selectedEventId && events.length) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  const calendarDays = useMemo(() => {
    const start = startOfMonth(visibleMonth);
    const end = endOfMonth(visibleMonth);
    const startOffset = start.getDay();
    const daysInMonth = end.getDate();
    const cells: Array<Date | null> = [];

    for (let i = 0; i < startOffset; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day));
    }

    return cells;
  }, [visibleMonth]);

  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? null;
  const eventsForSelectedDay = useMemo(() => {
    const selected = parseISO(selectedDate);
    return events.filter((event) => isWithinDay(event, selected));
  }, [events, selectedDate]);

  const handleCreate = () => {
    if (!form.event_name || !form.start_date || !form.end_date) return;

    createEventMutation.mutate({
      event_name: form.event_name,
      event_type: form.event_type,
      start_date: form.start_date,
      end_date: form.end_date,
      expected_impact_pct: form.expected_impact_pct ? Number(form.expected_impact_pct) : null,
      is_recurring: form.is_recurring,
      recurrence_rule: form.recurrence_rule || null,
    }, {
      onSuccess: () => {
        setForm({
          event_name: '',
          event_type: 'PROMOTION',
          start_date: selectedDate,
          end_date: selectedDate,
          expected_impact_pct: '',
          is_recurring: false,
          recurrence_rule: '',
        });
      },
    });
  };

  return (
    <PageFrame
      title="Financial Calendar"
      subtitle="Browse GST deadlines, promotions, closures, and recurring business events."
      actions={
        <Button variant="secondary" onClick={() => setShowForm((current) => !current)}>
          <Plus className="mr-2 h-4 w-4" />
          {showForm ? 'Hide form' : 'Add event'}
        </Button>
      }
    >
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>{format(visibleMonth, 'MMMM yyyy')}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{events.length} events in the selected month.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setVisibleMonth((current) => subMonths(current, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setVisibleMonth((current) => addMonths(current, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Badge variant="secondary"><CalendarDays className="mr-1 h-3.5 w-3.5" /> Monthly view</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {eventsQuery.isLoading ? (
            <SkeletonLoader variant="rect" height={520} />
          ) : eventsQuery.isError ? (
            <ErrorState error={normalizeApiError(eventsQuery.error)} onRetry={() => void eventsQuery.refetch()} />
          ) : (
            <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
              <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
                <div className="grid grid-cols-7 border-b border-border/60 bg-slate-50 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="px-2 py-3">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {calendarDays.map((day, index) => {
                    const dayEvents = day ? events.filter((event) => isWithinDay(event, day)) : [];
                    const isSelected = day ? format(day, 'yyyy-MM-dd') === selectedDate : false;
                    const isInCurrentMonth = day ? isSameMonth(day, visibleMonth) : false;

                    return (
                      <button
                        key={`${day ? format(day, 'yyyy-MM-dd') : 'empty'}-${index}`}
                        type="button"
                        onClick={() => day && setSelectedDate(format(day, 'yyyy-MM-dd'))}
                        className={`min-h-[110px] border-r border-b border-border/40 p-2 text-left transition-colors hover:bg-slate-50 ${
                          day ? '' : 'bg-slate-50/60'
                        } ${isSelected ? 'bg-sky-50' : ''}`}
                      >
                        {day ? (
                          <>
                            <div className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                              isSelected ? 'bg-primary text-primary-foreground' : isInCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                            }`}>
                              {format(day, 'd')}
                            </div>
                            <div className="mt-2 space-y-1">
                              {dayEvents.slice(0, 3).map((event) => (
                                <div
                                  key={event.id}
                                  onClick={(eventClick) => {
                                    eventClick.stopPropagation();
                                    setSelectedEventId(event.id);
                                  }}
                                  className="cursor-pointer rounded-lg border border-border/40 bg-white px-2 py-1 text-[11px] font-semibold shadow-sm"
                                >
                                  <span className={`mr-1 inline-block h-2 w-2 rounded-full align-middle ${EVENT_STYLES[event.event_type] ?? 'bg-slate-400'}`} />
                                  {event.event_name}
                                </div>
                              ))}
                              {dayEvents.length > 3 ? <div className="text-[10px] text-muted-foreground">+{dayEvents.length - 3} more</div> : null}
                            </div>
                          </>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-6">
                <Card className="border-border/60 shadow-sm">
                  <CardHeader>
                    <CardTitle>Selected Day</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-muted-foreground">{format(parseISO(selectedDate), 'EEEE, MMMM d')}</div>
                    {eventsForSelectedDay.length ? (
                      <div className="space-y-3">
                        {eventsForSelectedDay.map((event) => (
                          <button
                            key={event.id}
                            type="button"
                            onClick={() => setSelectedEventId(event.id)}
                            className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                              selectedEvent?.id === event.id ? 'border-primary bg-primary/5' : 'border-border/60 bg-white hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-semibold text-foreground">{event.event_name}</div>
                              <Badge variant="secondary">{event.event_type}</Badge>
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                              {event.start_date} to {event.end_date}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <EmptyState title="No events on this day" body="Select another date or create a new calendar event." />
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/60 shadow-sm">
                  <CardHeader>
                    <CardTitle>Event Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedEvent ? (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="info">{selectedEvent.event_type}</Badge>
                          {selectedEvent.is_recurring ? <Badge variant="secondary">Recurring</Badge> : null}
                        </div>
                        <div className="text-lg font-semibold text-foreground">{selectedEvent.event_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedEvent.start_date} to {selectedEvent.end_date}
                        </div>
                        {selectedEvent.expected_impact_pct != null ? (
                          <div className="text-sm font-medium text-emerald-700">
                            Expected impact {selectedEvent.expected_impact_pct > 0 ? '+' : ''}
                            {selectedEvent.expected_impact_pct}%
                          </div>
                        ) : null}
                        {selectedEvent.recurrence_rule ? (
                          <div className="text-sm text-muted-foreground">RRULE: {selectedEvent.recurrence_rule}</div>
                        ) : null}
                      </div>
                    ) : (
                      <EmptyState title="No event selected" body="Click an event to inspect its details." />
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/60 shadow-sm">
                  <CardHeader>
                    <CardTitle>Month Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {eventTypeOptions.map((type) => (
                      <div key={type} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                        <span className="text-sm font-medium text-foreground">{type}</span>
                        <Badge variant="secondary">{events.filter((event) => event.event_type === type).length}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showForm ? (
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Add Event</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Input label="Event name" value={form.event_name} onChange={(event) => setForm((current) => ({ ...current, event_name: event.target.value }))} />
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Type</label>
              <select
                value={form.event_type}
                onChange={(event) => setForm((current) => ({ ...current, event_type: event.target.value }))}
                className="w-full rounded-2xl border border-border bg-white px-3 py-2 text-sm"
              >
                {eventTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <Input label="Start date" type="date" value={form.start_date} onChange={(event) => setForm((current) => ({ ...current, start_date: event.target.value }))} />
            <Input label="End date" type="date" value={form.end_date} onChange={(event) => setForm((current) => ({ ...current, end_date: event.target.value }))} />
            <Input label="Expected impact %" value={form.expected_impact_pct} onChange={(event) => setForm((current) => ({ ...current, expected_impact_pct: event.target.value }))} />
            <Input label="Recurrence rule" value={form.recurrence_rule} onChange={(event) => setForm((current) => ({ ...current, recurrence_rule: event.target.value }))} />
            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={form.is_recurring}
                  onChange={(event) => setForm((current) => ({ ...current, is_recurring: event.target.checked }))}
                />
                Recurring
              </label>
              <Button loading={createEventMutation.isPending} onClick={handleCreate}>
                Save event
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </PageFrame>
  );
}
