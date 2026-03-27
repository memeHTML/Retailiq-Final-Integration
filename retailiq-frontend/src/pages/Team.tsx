import { PageFrame } from '@/components/layout/PageFrame';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useTeamPingQuery } from '@/hooks/platform';
import type { ApiError } from '@/types/api';
import { normalizeApiError } from '@/utils/errors';

function buildTeamError(message: string): ApiError {
  return {
    message,
    status: 502,
    details: undefined,
    raw: undefined,
  };
}

export default function TeamPage() {
  const teamPingQuery = useTeamPingQuery();

  if (teamPingQuery.isLoading) {
    return (
      <PageFrame title="Team" subtitle="Backend connectivity and operational status for the team service.">
        <SkeletonLoader variant="rect" height={180} />
      </PageFrame>
    );
  }

  if (teamPingQuery.isError) {
    return (
      <PageFrame title="Team" subtitle="Backend connectivity and operational status for the team service.">
        <ErrorState error={normalizeApiError(teamPingQuery.error)} onRetry={() => void teamPingQuery.refetch()} />
      </PageFrame>
    );
  }

  if (teamPingQuery.data?.success !== true) {
    return (
      <PageFrame title="Team" subtitle="Backend connectivity and operational status for the team service.">
        <ErrorState
          error={buildTeamError('The team service returned an unexpected response.')}
          onRetry={() => void teamPingQuery.refetch()}
        />
      </PageFrame>
    );
  }

  return (
    <PageFrame title="Team" subtitle="Backend connectivity and operational status for the team service.">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-base">
            Team connectivity
            <Badge variant="success">Healthy</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600">The backend ping endpoint responded successfully.</p>
          <p className="text-sm text-gray-600">No additional payload is required or expected beyond <code>{`{ success: true }`}</code>.</p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => void teamPingQuery.refetch()}>
              Recheck status
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageFrame>
  );
}
