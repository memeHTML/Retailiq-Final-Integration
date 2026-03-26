/**
 * src/pages/NotFound.tsx
 * Oracle Document sections consumed: 8, 10, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { Link } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { routes } from '@/routes/routes';

export default function NotFoundPage() {
  return (
    <PageFrame title="404 - Not found" subtitle="The page you requested does not exist.">
      <section className="card">
        <div className="card__body stack">
          <p className="muted">Please check the URL or return to the dashboard.</p>
          <Link className="button" to={routes.dashboard}>Go to Dashboard</Link>
        </div>
      </section>
    </PageFrame>
  );
}
