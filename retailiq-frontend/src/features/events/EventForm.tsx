import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useId } from 'react';
import type { EventType } from '@/types/models';

export interface EventFormValues {
  event_name: string;
  event_type: EventType;
  start_date: string;
  end_date: string;
  expected_impact_pct: string;
  is_recurring: boolean;
  recurrence_rule: string;
}

interface EventFormProps {
  mode: 'create' | 'edit';
  value: EventFormValues;
  onChange: (value: EventFormValues) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

const EVENT_TYPE_OPTIONS: Array<{ value: EventType; label: string }> = [
  { value: 'HOLIDAY', label: 'Holiday' },
  { value: 'FESTIVAL', label: 'Festival' },
  { value: 'PROMOTION', label: 'Promotion' },
  { value: 'SALE_DAY', label: 'Sale Day' },
  { value: 'CLOSURE', label: 'Closure' },
];

export function EventForm({ mode, value, onChange, onSubmit, onCancel, loading = false, error = null }: EventFormProps) {
  const eventTypeId = useId();
  const recurringId = useId();

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{mode === 'edit' ? 'Edit Event' : 'Create Event'}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="stack" style={{ gap: '0.75rem' }}>
          <div className="grid grid--2" style={{ gap: '0.75rem' }}>
            <Input
              label="Event name"
              value={value.event_name}
              onChange={(event) => onChange({ ...value, event_name: event.target.value })}
              placeholder="Event name"
            />
            <label className="stack" htmlFor={eventTypeId} style={{ gap: '0.25rem' }}>
              <span className="muted">Event type</span>
              <select
                id={eventTypeId}
                className="input"
                value={value.event_type}
                onChange={(event) => onChange({ ...value, event_type: event.target.value as EventType })}
              >
                {EVENT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <Input
              type="date"
              label="Start date"
              value={value.start_date}
              onChange={(event) => onChange({ ...value, start_date: event.target.value })}
            />
            <Input
              type="date"
              label="End date"
              value={value.end_date}
              onChange={(event) => onChange({ ...value, end_date: event.target.value })}
            />
            <Input
              label="Expected impact %"
              value={value.expected_impact_pct}
              onChange={(event) => onChange({ ...value, expected_impact_pct: event.target.value })}
              placeholder="0"
            />
            <label className="stack" htmlFor={recurringId} style={{ gap: '0.25rem', justifyContent: 'end' }}>
              <span className="muted">Recurring</span>
              <div className="button-row" style={{ justifyContent: 'flex-start' }}>
                <input
                  id={recurringId}
                  type="checkbox"
                  checked={value.is_recurring}
                  onChange={(event) => onChange({ ...value, is_recurring: event.target.checked })}
                />
                <span>{value.is_recurring ? 'Enabled' : 'Disabled'}</span>
              </div>
            </label>
          </div>
          <Input
            label="Recurrence rule"
            value={value.recurrence_rule}
            onChange={(event) => onChange({ ...value, recurrence_rule: event.target.value })}
            placeholder="RRULE:FREQ=WEEKLY;BYDAY=MO"
          />

          {error ? <p className="text-danger" style={{ margin: 0 }}>{error}</p> : null}

          <div className="button-row" style={{ marginTop: '0.25rem' }}>
            <Button onClick={onSubmit} loading={loading}>
              {mode === 'edit' ? 'Save changes' : 'Create event'}
            </Button>
            <Button variant="secondary" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
