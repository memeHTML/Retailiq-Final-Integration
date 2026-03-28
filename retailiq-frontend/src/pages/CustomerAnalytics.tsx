import { useQuery } from '@tanstack/react-query';
import { PageFrame } from '@/components/layout/PageFrame';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { DataTable } from '@/components/ui/DataTable';
import { analyticsApi } from '@/api/analytics';
import { normalizeApiError } from '@/utils/errors';
import { formatCurrency } from '@/utils/numbers';

type SummaryMap = Record<string, unknown>;

function asArray<T = Record<string, unknown>>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function getNumber(value: unknown) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

export default function CustomerAnalyticsPage() {
  const analyticsQuery = useQuery({
    queryKey: ['customers', 'analytics', 'monthly'],
    queryFn: () => analyticsApi.getCustomerAnalytics(),
    staleTime: 120_000,
  });

  const summaryQuery = useQuery({
    queryKey: ['customers', 'analytics', 'summary-panel'],
    queryFn: () => analyticsApi.getCustomerSummaryAnalytics(),
    staleTime: 120_000,
  });

  const loading = analyticsQuery.isLoading || summaryQuery.isLoading;
  const error = analyticsQuery.error ?? summaryQuery.error;
  const analytics = (analyticsQuery.data ?? {}) as SummaryMap;
  const summary = (summaryQuery.data ?? {}) as SummaryMap;

  if (loading) {
    return (
      <PageFrame title="Customer Analytics" subtitle="Loading customer analytics and summary data...">
        <SkeletonLoader variant="rect" height={320} />
      </PageFrame>
    );
  }

  if (error) {
    return (
      <PageFrame title="Customer Analytics">
        <ErrorState error={normalizeApiError(error)} />
      </PageFrame>
    );
  }

  const topCategories = asArray<{ category?: string; amount?: number }>(summary.top_categories);
  const acquisitionTrend = asArray<{ month?: string; new_customers?: number; returning_customers?: number }>(
    summary.acquisition_trend ?? analytics.acquisition_trend,
  );
  const geographicDistribution = asArray<{ region?: string; count?: number; percentage?: number }>(
    summary.geographic_distribution ?? analytics.geographic_distribution,
  );
  const churnRate = getNumber(summary.churn_rate ?? analytics.churn_rate);
  const retentionRate = getNumber(summary.retention_rate ?? analytics.retention_rate ?? analytics.returning_rate);

  return (
    <PageFrame
      title="Customer Analytics"
      subtitle="Dedicated customer insights powered by the customer analytics endpoint."
      actions={<Badge variant="secondary">{getNumber(analytics.new_customers).toLocaleString()} new customers</Badge>}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>New Customers</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{getNumber(analytics.new_customers).toLocaleString()}</div>
            <div className="text-sm text-gray-500">Current month</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Active Customers</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{getNumber(analytics.active_customers).toLocaleString()}</div>
            <div className="text-sm text-gray-500">Current month</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Returning Rate</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{getNumber(analytics.returning_rate).toFixed(1)}%</div>
            <div className="text-sm text-gray-500">Retention and repeat purchase signal</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Acquisition Trend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {acquisitionTrend.length > 0 ? (
              acquisitionTrend.map((item, index) => {
                const newCustomers = getNumber(item.new_customers);
                const returningCustomers = getNumber(item.returning_customers);
                const max = Math.max(newCustomers, returningCustomers, 1);
                return (
                  <div key={`${item.month ?? 'month'}-${index}`} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.month ?? `Period ${index + 1}`}</span>
                      <span className="text-gray-500">
                        {newCustomers.toLocaleString()} new · {returningCustomers.toLocaleString()} returning
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 rounded-full bg-gray-100">
                        <div className="h-2 rounded-full bg-blue-600" style={{ width: `${(newCustomers / max) * 100}%` }} />
                      </div>
                      <div className="h-2 rounded-full bg-gray-100">
                        <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${(returningCustomers / max) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState title="No acquisition trend" body="The backend did not provide a customer acquisition trend yet." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Retention Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Retention</div>
                <div className="mt-1 text-2xl font-semibold">{retentionRate.toFixed(1)}%</div>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Churn</div>
                <div className="mt-1 text-2xl font-semibold">{churnRate.toFixed(1)}%</div>
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Returning Rate</span>
                <span className="text-gray-500">{getNumber(analytics.returning_rate).toFixed(1)}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-gray-100">
                <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${Math.max(4, getNumber(analytics.returning_rate))}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spend Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topCategories.length > 0 ? (
              topCategories.map((item) => {
                const amount = getNumber(item.amount);
                const width = Math.max(8, Math.min(100, amount > 0 ? amount / 10_000 : 8));
                return (
                  <div key={item.category ?? String(amount)} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.category ?? 'Uncategorised'}</span>
                      <span className="text-gray-500">{formatCurrency(amount)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100">
                      <div className="h-2 rounded-full bg-blue-600" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState title="No spend data" body="The backend did not return top category spend data." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {geographicDistribution.length > 0 ? (
              geographicDistribution.map((item) => {
                const percentage = getNumber(item.percentage ?? item.count);
                return (
                  <div key={item.region ?? String(percentage)} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.region ?? 'Unknown region'}</span>
                      <span className="text-gray-500">{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100">
                      <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${Math.max(4, Math.min(100, percentage))}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState title="No geographic data" body="The backend has not provided a geographic distribution yet." />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Raw Summary Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              { key: 'key', header: 'Key', render: (row: { key: string; value: string }) => row.key },
              { key: 'value', header: 'Value', render: (row: { key: string; value: string }) => row.value },
            ]}
            data={Object.entries(summary).map(([key, value]) => ({
              key,
              value: typeof value === 'string' ? value : JSON.stringify(value),
            }))}
          />
        </CardContent>
      </Card>
    </PageFrame>
  );
}
