import { PageFrame } from '@/components/layout/PageFrame';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { normalizeApiError } from '@/utils/errors';
import { useDecisionsQuery } from '@/hooks/decisions';
import type { Decision } from '@/types/models';

export default function DecisionsPage() {
  const decisionsQuery = useDecisionsQuery();

  if (decisionsQuery.isError) {
    return <ErrorState error={normalizeApiError(decisionsQuery.error)} onRetry={() => void decisionsQuery.refetch()} />;
  }

  if (decisionsQuery.isLoading) {
    return (
      <PageFrame title="AI Decisions" subtitle="Loading recommendations...">
        <div className="grid grid--2">
          <SkeletonLoader variant="rect" height={180} />
          <SkeletonLoader variant="rect" height={180} />
          <SkeletonLoader variant="rect" height={180} />
          <SkeletonLoader variant="rect" height={180} />
        </div>
      </PageFrame>
    );
  }

  const response = decisionsQuery.data;
  const decisions: Decision[] = response?.data ?? [];
  const meta = response?.meta;

  const getPriorityVariant = (priority: string): 'danger' | 'warning' | 'info' | 'secondary' => {
    if (priority === 'high' || priority === 'critical') return 'danger';
    if (priority === 'medium') return 'warning';
    if (priority === 'low') return 'info';
    return 'secondary';
  };

  return (
    <PageFrame title="AI Decisions" subtitle="Intelligent recommendations powered by your store data.">
      {meta && (
        <div className="button-row" style={{ marginBottom: '1.5rem', gap: '1rem' }}>
          <Badge variant="info">{meta.total_recommendations} recommendations</Badge>
          <span className="muted">Generated in {meta.execution_time_ms}ms</span>
          {meta.whatsapp_enabled && <Badge variant="success">WhatsApp enabled</Badge>}
        </div>
      )}

      {decisions.length === 0 ? (
        <EmptyState title="No recommendations" body="The AI decision engine has no actionable recommendations at this time." />
      ) : (
        <div className="grid grid--2">
          {decisions.map((d) => (
            <Card key={d.id}>
              <CardHeader>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <CardTitle>{d.title}</CardTitle>
                  <Badge variant={getPriorityVariant(d.priority)}>{d.priority}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="mb-2">{d.category}</Badge>
                <p style={{ margin: '0.5rem 0' }}>{d.description}</p>
                <div style={{ marginBottom: '0.5rem' }}>
                  <span className="muted">Impact: </span><strong>{d.impact}</strong>
                </div>
                {d.available_actions.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                    {d.available_actions.map((action, i) => (
                      <span key={i} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100">{action}</span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageFrame>
  );
}
