import { PageFrame } from '@/components/layout/PageFrame';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useCreditScoreQuery, useRefreshCreditScoreMutation } from '@/hooks/finance';
import { formatDate } from '@/utils/dates';
import { normalizeApiError } from '@/utils/errors';

export default function FinanceCreditScorePage() {
  const creditScoreQuery = useCreditScoreQuery();
  const refreshMutation = useRefreshCreditScoreMutation();

  if (creditScoreQuery.error) {
    return (
      <PageFrame title="Credit Score" subtitle="Merchant finance score and factor breakdown.">
        <ErrorState error={normalizeApiError(creditScoreQuery.error)} />
      </PageFrame>
    );
  }

  const score = creditScoreQuery.data;
  const percent = score ? Math.max(0, Math.min(100, Math.round((Number(score.score ?? 0) / Number(score.max_score ?? 900)) * 100))) : 0;

  return (
    <PageFrame
      title="Credit Score"
      subtitle="Inspect the merchant credit score and refresh it on demand."
      actions={
        <Button onClick={() => void refreshMutation.mutateAsync()} loading={refreshMutation.isPending}>
          Refresh score
        </Button>
      }
    >
      {creditScoreQuery.isLoading ? (
        <div className="space-y-6">
          <SkeletonLoader variant="rect" height={180} />
          <SkeletonLoader variant="rect" height={240} />
        </div>
      ) : score ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium text-gray-500">Score</CardTitle></CardHeader>
              <CardContent>
                <div className="text-5xl font-semibold">{score.score}</div>
                <div className="mt-3 h-2 rounded-full bg-gray-200">
                  <div className="h-2 rounded-full bg-blue-600" style={{ width: `${percent}%` }} />
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {percent}% of the maximum score {score.max_score}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium text-gray-500">Tier</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{score.tier ?? 'Standard'}</div>
                <div className="mt-2 text-sm text-gray-500">Backend-assigned merchant credit tier.</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium text-gray-500">Last updated</CardTitle></CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">{formatDate(score.last_updated)}</div>
                <div className="mt-2 text-sm text-gray-500">Latest backend recalculation timestamp.</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Score factors</CardTitle></CardHeader>
            <CardContent>
              {score.factors?.length ? (
                <div className="flex flex-wrap gap-2">
                  {score.factors.map((factor) => (
                    <Badge key={factor} variant="secondary">{factor}</Badge>
                  ))}
                </div>
              ) : (
                <EmptyState title="No factors available" body="The backend did not return a factor breakdown for this score." />
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <EmptyState title="No score available" body="The backend has not returned a credit score yet." />
      )}
    </PageFrame>
  );
}
