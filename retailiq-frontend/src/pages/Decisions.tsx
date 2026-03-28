import { useMemo } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { normalizeApiError } from '@/utils/errors';
import { useDecisionsQuery } from '@/hooks/decisions';
import type { Decision } from '@/types/models';

type DecisionGroup = {
  category: string;
  items: Decision[];
};

const priorityVariant = (priority: string): 'danger' | 'warning' | 'info' | 'secondary' => {
  if (priority === 'high' || priority === 'critical') return 'danger';
  if (priority === 'medium') return 'warning';
  if (priority === 'low') return 'info';
  return 'secondary';
};

export default function DecisionsPage() {
  const decisionsQuery = useDecisionsQuery();

  const groups = useMemo<DecisionGroup[]>(() => {
    const decisions: Decision[] = decisionsQuery.data?.data ?? [];
    const byCategory = new Map<string, Decision[]>();

    decisions.forEach((decision) => {
      const key = decision.category || 'General';
      const list = byCategory.get(key) ?? [];
      list.push(decision);
      byCategory.set(key, list);
    });

    return [...byCategory.entries()].map(([category, items]) => ({ category, items }));
  }, [decisionsQuery.data]);

  if (decisionsQuery.isError) {
    return <ErrorState error={normalizeApiError(decisionsQuery.error)} onRetry={() => void decisionsQuery.refetch()} />;
  }

  if (decisionsQuery.isLoading) {
    return (
      <PageFrame title="AI Decisions" subtitle="Loading recommendations...">
        <div className="grid gap-4 md:grid-cols-2">
          <SkeletonLoader variant="rect" height={180} />
          <SkeletonLoader variant="rect" height={180} />
          <SkeletonLoader variant="rect" height={180} />
          <SkeletonLoader variant="rect" height={180} />
        </div>
      </PageFrame>
    );
  }

  const meta = decisionsQuery.data?.meta;

  return (
    <PageFrame title="AI Decisions" subtitle="Recommended actions for your business.">
      <div className="space-y-6">
        {meta ? (
          <div className="flex flex-wrap gap-3">
            <Badge variant="info">{meta.total_recommendations} recommendations</Badge>
            <Badge variant="secondary">Generated in {meta.execution_time_ms}ms</Badge>
            {meta.whatsapp_enabled ? <Badge variant="success">WhatsApp enabled</Badge> : null}
          </div>
        ) : null}

        {groups.length === 0 ? (
          <EmptyState
            title="No recommendations"
            body="The AI decision engine has no actionable recommendations at this time."
          />
        ) : (
          <div className="space-y-5">
            {groups.map((group) => (
              <Card key={group.category}>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle>{group.category}</CardTitle>
                    <Badge variant="secondary">{group.items.length} item{group.items.length === 1 ? '' : 's'}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {group.items.map((decision) => (
                    <div key={decision.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <strong>{decision.title}</strong>
                            <Badge variant={priorityVariant(decision.priority)}>{decision.priority}</Badge>
                          </div>
                          <p className="mt-2 text-sm text-gray-600">{decision.description}</p>
                        </div>
                        <div className="min-w-[140px] text-right text-sm text-gray-600">
                          <div className="font-medium text-gray-900">Impact</div>
                          <div>{decision.impact}</div>
                        </div>
                      </div>
                      {decision.available_actions.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {decision.available_actions.map((action) => (
                            <Badge key={action} variant="info">
                              {action}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageFrame>
  );
}
