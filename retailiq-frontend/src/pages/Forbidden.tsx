/**
 * src/pages/Forbidden.tsx
 * Oracle Document sections consumed: 8, 10, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { Link } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { routes } from '@/routes/routes';

export default function ForbiddenPage() {
  return (
    <PageFrame title="403 - Forbidden" subtitle="You do not have access to this resource.">
      <section className="card">
        <div className="card__body stack">
          <p className="muted">If you believe this is a mistake, ask an owner to grant the necessary access.</p>
          <Link className="button" to={routes.dashboard}>Go to Dashboard</Link>
        </div>
      </section>
    </PageFrame>
  );
}
