/**
 * src/pages/ServerError.tsx
 * Oracle Document sections consumed: 8, 10, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { Link } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { routes } from '@/routes/routes';

const referenceId = typeof window !== 'undefined' ? window.sessionStorage.getItem('retailiq_reference_id') : null;

export default function ServerErrorPage() {
  return (
    <PageFrame title="500 - Server error" subtitle="Something went wrong while loading this screen.">
      <section className="card">
        <div className="card__body stack">
          <p className="muted">Please retry or return home. If the issue persists, share the reference ID with support.</p>
          {referenceId ? <p className="muted">Reference ID: {referenceId}</p> : null}
          <div className="button-row">
            <Link className="button" to={routes.dashboard}>Go to Dashboard</Link>
            <button className="button button--secondary" type="button" onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      </section>
    </PageFrame>
  );
}
