/**
 * src/components/ui/ErrorState.tsx
 * Oracle Document sections consumed: 7, 9, 10
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import type { ApiError } from '@/types/api';
import { formatCorrelationId } from '@/utils/errors';

interface ErrorStateProps {
  error: ApiError;
  onRetry?: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const fieldEntries = error.fields ? Object.entries(error.fields) : [];

  return (
    <section className="card" style={{ padding: '1.25rem' }} role="alert">
      <h3 style={{ marginTop: 0 }}>Something went wrong</h3>
      <p>{error.message}</p>
      {fieldEntries.length ? (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
          <p className="mb-2 text-sm font-medium text-red-900">Validation details</p>
          <ul className="space-y-1 text-sm text-red-800">
            {fieldEntries.map(([field, message]) => (
              <li key={field}>
                <span className="font-medium">{field}:</span> {message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {error.code ? <p className="muted">Code: {error.code}</p> : null}
      {error.timestamp ? <p className="muted">Timestamp: {error.timestamp}</p> : null}
      {error.correlationId ? <p className="muted">{formatCorrelationId(error.correlationId)}</p> : null}
      {onRetry ? (
        <button className="button" type="button" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </section>
  );
}
