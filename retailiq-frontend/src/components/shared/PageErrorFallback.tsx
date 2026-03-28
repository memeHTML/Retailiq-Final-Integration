import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { PageFrame } from '@/components/layout/PageFrame';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export function PageErrorFallback() {
  return (
    <PageFrame title="Something went wrong" subtitle="We could not load this page.">
      <Card>
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="muted">Please reload the page or return to the dashboard to continue.</p>
          <div className="button-row">
            <Button type="button" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
            <Link className="button button--secondary" to="/dashboard">
              Go to Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </PageFrame>
  );
}

export default PageErrorFallback;
