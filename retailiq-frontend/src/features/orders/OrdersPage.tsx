import { Link } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useDailySummaryQuery, useTransactionsQuery } from '@/hooks/transactions';
import { usePurchaseOrders } from '@/hooks/purchaseOrders';
import { useMarketplaceOrdersQuery, useMarketplaceRecommendationsQuery } from '@/hooks/marketplace';
import { formatDate } from '@/utils/dates';
import { formatCurrency } from '@/utils/numbers';
import type { ListMarketplaceOrdersResponse, MarketplaceRecommendation } from '@/types/api';
import type { TransactionSummaryRow } from '@/types/models';
import { getPurchaseOrderStatusVariant, normalizePurchaseOrderPreviewRow, type PurchaseOrderPreviewRow } from './models';

type MarketplaceOrderRow = ListMarketplaceOrdersResponse['orders'][number];

export default function OrdersPage() {
  const todaySummaryQuery = useDailySummaryQuery({});
  const recentTransactionsQuery = useTransactionsQuery({ page: 1, page_size: 5 });
  const purchaseOrdersQuery = usePurchaseOrders({});
  const marketplaceOrdersQuery = useMarketplaceOrdersQuery({ page: 1 });
  const marketplaceRecommendationsQuery = useMarketplaceRecommendationsQuery();

  const latestTransactions = recentTransactionsQuery.data?.data ?? [];
  const purchaseOrders = (purchaseOrdersQuery.data ?? []).map(normalizePurchaseOrderPreviewRow);
  const marketplaceOrders = marketplaceOrdersQuery.data?.orders ?? [];
  const marketplaceRecommendations = (marketplaceRecommendationsQuery.data ?? []) as MarketplaceRecommendation[];

  const salesColumns: Column<TransactionSummaryRow>[] = [
    { key: 'id', header: 'Transaction ID', render: (row) => row.transaction_id },
    { key: 'date', header: 'Date', render: (row) => formatDate(row.created_at) },
    { key: 'mode', header: 'Payment Mode', render: (row) => row.payment_mode },
    { key: 'return', header: 'Return', render: (row) => (row.is_return ? 'Yes' : 'No') },
  ];

  const purchaseOrderColumns: Column<PurchaseOrderPreviewRow>[] = [
    { key: 'id', header: 'PO Number', render: (row) => row.id },
    { key: 'supplier', header: 'Supplier', render: (row) => row.supplierId },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={getPurchaseOrderStatusVariant(row.status)}>{row.status}</Badge> },
    { key: 'expected', header: 'Expected', render: (row) => (row.expectedDeliveryDate ? formatDate(row.expectedDeliveryDate) : '-') },
    { key: 'created', header: 'Created', render: (row) => (row.createdAt ? formatDate(row.createdAt) : '-') },
  ];

  const marketplaceOrderColumns: Column<MarketplaceOrderRow>[] = [
    { key: 'id', header: 'Order #', render: (row) => row.order_number },
    { key: 'supplier', header: 'Supplier', render: (row) => String(row.supplier_profile_id) },
    { key: 'status', header: 'Status', render: (row) => <Badge variant="info">{row.status}</Badge> },
    { key: 'total', header: 'Total', render: (row) => formatCurrency(row.total) },
    { key: 'created', header: 'Created', render: (row) => formatDate(row.created_at) },
  ];

  const recommendationColumns: Column<MarketplaceRecommendation>[] = [
    { key: 'product', header: 'Product', render: (row) => row.product_name },
    { key: 'category', header: 'Category', render: (row) => row.category ?? '-' },
    {
      key: 'urgency',
      header: 'Urgency',
      render: (row) => <Badge variant={row.urgency === 'HIGH' ? 'danger' : row.urgency === 'MEDIUM' ? 'warning' : 'secondary'}>{row.urgency}</Badge>,
    },
    { key: 'qty', header: 'Suggested Qty', render: (row) => row.suggested_qty.toLocaleString() },
  ];

  return (
    <PageFrame
      title="Orders"
      subtitle="A unified hub for sales, purchase orders, and marketplace activity."
      actions={<Link className="button button--secondary" to="/purchase-orders">Open Purchase Orders</Link>}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Sales Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{formatCurrency(todaySummaryQuery.data?.total_sales ?? 0)}</div>
              <div className="text-sm text-gray-500">{(todaySummaryQuery.data?.total_transactions ?? 0).toLocaleString()} transactions</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Purchase Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{purchaseOrders.length.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Latest status tracked from the backend</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Marketplace Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{marketplaceOrders.length.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Connected marketplace order feed</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{marketplaceRecommendations.length.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Suggested replenishment items</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="sales">
          <TabsList>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          </TabsList>

          <TabsContent value="sales">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Sales Summary</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-sm text-gray-500">Total Sales</div>
                    <div className="text-2xl font-semibold">{formatCurrency(todaySummaryQuery.data?.total_sales ?? 0)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Transactions</div>
                    <div className="text-2xl font-semibold">{(todaySummaryQuery.data?.total_transactions ?? 0).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Net Sales</div>
                    <div className="text-2xl font-semibold">{formatCurrency(todaySummaryQuery.data?.net_sales ?? todaySummaryQuery.data?.total_sales ?? 0)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Returns</div>
                    <div className="text-2xl font-semibold">{(todaySummaryQuery.data?.total_returns ?? 0).toLocaleString()}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentTransactionsQuery.isError ? (
                    <EmptyState title="Sales unavailable" body="Recent transactions could not be loaded from the backend." />
                  ) : recentTransactionsQuery.isLoading ? (
                    <p className="text-sm text-gray-500">Loading recent transactions...</p>
                  ) : latestTransactions.length === 0 ? (
                    <EmptyState title="No sales yet" body="No recent transactions were returned by the backend." />
                  ) : (
                    <DataTable columns={salesColumns} data={latestTransactions} emptyMessage="No recent transactions found." />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="purchase-orders">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Purchase Orders</h2>
                  <p className="text-sm text-gray-500">Preview purchase orders from the contract-backed list endpoint.</p>
                </div>
                <Link className="button" to="/purchase-orders">Open full purchase-order page</Link>
              </div>
              {purchaseOrdersQuery.isError ? (
                <EmptyState title="Purchase orders unavailable" body="The purchase-order list could not be loaded from the backend." />
              ) : purchaseOrdersQuery.isLoading ? (
                <p className="text-sm text-gray-500">Loading purchase orders...</p>
              ) : purchaseOrders.length === 0 ? (
                <EmptyState title="No purchase orders" body="The backend did not return any purchase orders for the hub preview." />
              ) : (
                <DataTable columns={purchaseOrderColumns} data={purchaseOrders} emptyMessage="No purchase orders found." />
              )}
            </div>
          </TabsContent>

          <TabsContent value="marketplace">
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Marketplace Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {marketplaceOrdersQuery.isError ? (
                      <EmptyState title="Marketplace orders unavailable" body="The marketplace order feed could not be loaded." />
                    ) : marketplaceOrdersQuery.isLoading ? (
                      <p className="text-sm text-gray-500">Loading marketplace orders...</p>
                    ) : marketplaceOrders.length === 0 ? (
                      <EmptyState title="No marketplace orders" body="No marketplace orders were returned by the backend." />
                    ) : (
                      <DataTable columns={marketplaceOrderColumns} data={marketplaceOrders} emptyMessage="No marketplace orders found." />
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Marketplace Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {marketplaceRecommendationsQuery.isError ? (
                      <EmptyState title="Recommendations unavailable" body="The marketplace recommendations could not be loaded." />
                    ) : marketplaceRecommendationsQuery.isLoading ? (
                      <p className="text-sm text-gray-500">Loading recommendations...</p>
                    ) : marketplaceRecommendations.length === 0 ? (
                      <EmptyState title="No recommendations" body="No market recommendations were returned for this account." />
                    ) : (
                      <DataTable columns={recommendationColumns} data={marketplaceRecommendations} emptyMessage="No recommendations found." />
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="button-row">
                <Link className="button button--secondary" to="/orders/marketplace">Open marketplace page</Link>
                <Link className="button button--secondary" to="/suppliers">View suppliers</Link>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageFrame>
  );
}
