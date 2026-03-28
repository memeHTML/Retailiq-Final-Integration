import { useQuery } from '@tanstack/react-query';
import { PageFrame } from '@/components/layout/PageFrame';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { analyticsApi } from '@/api/analytics';
import { normalizeApiError } from '@/utils/errors';
import { formatCurrency } from '@/utils/numbers';

export default function AnalyticsPage() {
  const dashboardQuery = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => analyticsApi.getDashboardSnapshot(),
    staleTime: 60_000,
  });

  const profitQuery = useQuery({
    queryKey: ['analytics', 'profit'],
    queryFn: () => analyticsApi.getProfitMetrics(),
    staleTime: 60_000,
  });

  const revenueQuery = useQuery({
    queryKey: ['analytics', 'revenue'],
    queryFn: () => analyticsApi.getRevenueMetrics(),
    staleTime: 60_000,
  });

  const topProductsQuery = useQuery({
    queryKey: ['analytics', 'top-products'],
    queryFn: () => analyticsApi.getTopProducts(),
    staleTime: 60_000,
  });

  const categoryQuery = useQuery({
    queryKey: ['analytics', 'category-breakdown'],
    queryFn: () => analyticsApi.getCategoryBreakdown(),
    staleTime: 60_000,
  });

  const paymentModesQuery = useQuery({
    queryKey: ['analytics', 'payment-modes'],
    queryFn: () => analyticsApi.getPaymentModeSummary(),
    staleTime: 60_000,
  });

  const isLoading = [
    dashboardQuery.isLoading,
    profitQuery.isLoading,
    revenueQuery.isLoading,
    topProductsQuery.isLoading,
    categoryQuery.isLoading,
    paymentModesQuery.isLoading,
  ].some(Boolean);

  const firstError = [
    dashboardQuery.error,
    profitQuery.error,
    revenueQuery.error,
    topProductsQuery.error,
    categoryQuery.error,
    paymentModesQuery.error,
  ].find(Boolean);

  if (isLoading) {
    return (
      <PageFrame title="Analytics" subtitle="Owner-level reporting backed by the production analytics API.">
        <SkeletonLoader variant="rect" height={360} />
      </PageFrame>
    );
  }

  if (firstError) {
    return (
      <PageFrame title="Analytics">
        <ErrorState error={normalizeApiError(firstError)} />
      </PageFrame>
    );
  }

  const dashboard = dashboardQuery.data;
  const profit = profitQuery.data;
  const revenue = revenueQuery.data;
  const topProducts = topProductsQuery.data ?? [];
  const categoryBreakdown = categoryQuery.data ?? [];
  const paymentModes = paymentModesQuery.data ?? [];

  const todayKpis = dashboard?.today_kpis;
  const insights = dashboard?.insights ?? [];
  const topProductsToday = dashboard?.top_products_today ?? [];

  return (
    <PageFrame title="Analytics" subtitle="Revenue, profitability, dashboard snapshots, and category mix from the backend aggregation layer.">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Revenue Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{formatCurrency(todayKpis?.revenue ?? 0)}</div>
              <div className="text-sm text-gray-500">7d aggregate: {formatCurrency(revenue?.total_revenue ?? 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{formatCurrency(profit?.total_profit ?? 0)}</div>
              <div className="text-sm text-gray-500">Growth: {(profit?.growth_rate ?? 0).toFixed(2)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Transactions Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{(todayKpis?.transactions ?? 0).toLocaleString()}</div>
              <div className="text-sm text-gray-500">7d total orders: {(revenue?.total_orders ?? 0).toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Average Margin</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{(profit?.average_margin_pct ?? 0).toFixed(2)}%</div>
              <div className="text-sm text-gray-500">Latest margin: {(profit?.latest_margin_pct ?? 0).toFixed(2)}%</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.length === 0 ? (
                <p className="text-sm text-gray-500">No dashboard insights were returned by the backend.</p>
              ) : (
                insights.map((insight, index) => (
                  <div key={`${insight.title}-${index}`} className="rounded-md border p-4">
                    <div className="font-medium">{insight.title}</div>
                    <div className="text-sm text-gray-500">{insight.body}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alert Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {Object.entries(dashboard?.alerts_summary ?? {}).length === 0 ? (
                <p className="text-gray-500">No alert summary data available.</p>
              ) : (
                Object.entries(dashboard?.alerts_summary ?? {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span>{key}</span>
                    <span>{String(value)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top Products Today</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  { key: 'name', header: 'Product', render: (row) => row.name },
                  { key: 'units_sold', header: 'Units', render: (row) => Number(row.units_sold ?? 0).toLocaleString() },
                  { key: 'revenue', header: 'Revenue', render: (row) => formatCurrency(Number(row.revenue ?? 0)) },
                ]}
                data={topProductsToday}
                emptyMessage="No top-product snapshot available yet."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Products (Range)</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  { key: 'name', header: 'Product', render: (row) => row.name },
                  { key: 'sku_code', header: 'SKU', render: (row) => row.sku_code || '-' },
                  { key: 'total_sold', header: 'Units Sold', render: (row) => row.total_sold.toLocaleString() },
                  { key: 'revenue', header: 'Revenue', render: (row) => formatCurrency(row.revenue) },
                ]}
                data={topProducts}
                emptyMessage="No top-product data available for the selected range."
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  { key: 'name', header: 'Category', render: (row) => row.name },
                  { key: 'revenue', header: 'Revenue', render: (row) => formatCurrency(row.revenue) },
                  { key: 'profit', header: 'Profit', render: (row) => formatCurrency(row.profit) },
                  { key: 'percentage', header: 'Share', render: (row) => `${row.percentage.toFixed(2)}%` },
                ]}
                data={categoryBreakdown}
                emptyMessage="No category revenue breakdown was returned."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Mode Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  { key: 'payment_mode', header: 'Payment Mode', render: (row) => row.payment_mode },
                  { key: 'count', header: 'Orders', render: (row) => row.count.toLocaleString() },
                  { key: 'amount', header: 'Revenue', render: (row) => formatCurrency(row.amount) },
                  { key: 'percentage', header: 'Share', render: (row) => `${row.percentage.toFixed(2)}%` },
                ]}
                data={paymentModes}
                emptyMessage="No payment-mode data was returned."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageFrame>
  );
}
