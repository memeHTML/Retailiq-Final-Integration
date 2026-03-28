import { Link, useNavigate } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useMarketplaceOrdersQuery, useMarketplaceRecommendationsQuery } from '@/hooks/marketplace';
import {
  useOptStatusQuery,
  useWhatsAppAnalyticsQuery,
  useWhatsAppCampaignsQuery,
  useWhatsAppConfigQuery,
} from '@/hooks/whatsapp';
import { formatDate } from '@/utils/dates';
import { formatCurrency } from '@/utils/numbers';

export default function OmnichannelPage() {
  const navigate = useNavigate();
  const marketplaceOrdersQuery = useMarketplaceOrdersQuery({ page: 1 });
  const marketplaceRecommendationsQuery = useMarketplaceRecommendationsQuery();
  const whatsappConfigQuery = useWhatsAppConfigQuery();
  const whatsappAnalyticsQuery = useWhatsAppAnalyticsQuery();
  const whatsappCampaignsQuery = useWhatsAppCampaignsQuery();
  const optStatusQuery = useOptStatusQuery(whatsappConfigQuery.data?.phone_number ?? '');

  const marketplaceOrders = marketplaceOrdersQuery.data?.orders ?? [];
  const marketplaceRecommendations = marketplaceRecommendationsQuery.data ?? [];
  const campaigns = whatsappCampaignsQuery.data ?? [];

  const marketplaceColumns: Column<(typeof marketplaceOrders)[number]>[] = [
    { key: 'number', header: 'Order #', render: (row) => row.order_number },
    { key: 'supplier', header: 'Supplier', render: (row) => row.supplier_profile_id },
    { key: 'status', header: 'Status', render: (row) => <Badge variant="info">{row.status}</Badge> },
    { key: 'total', header: 'Total', render: (row) => formatCurrency(row.total) },
    { key: 'created', header: 'Created', render: (row) => formatDate(row.created_at) },
  ];

  const recommendationColumns: Column<(typeof marketplaceRecommendations)[number]>[] = [
    { key: 'product', header: 'Product', render: (row) => row.product_name },
    { key: 'category', header: 'Category', render: (row) => row.category ?? '—' },
    { key: 'urgency', header: 'Urgency', render: (row) => <Badge variant={row.urgency === 'HIGH' ? 'danger' : row.urgency === 'MEDIUM' ? 'warning' : 'secondary'}>{row.urgency}</Badge> },
    { key: 'qty', header: 'Suggested Qty', render: (row) => row.suggested_qty.toLocaleString() },
  ];

  const campaignColumns: Column<(typeof campaigns)[number]>[] = [
    { key: 'name', header: 'Campaign', render: (row) => row.name },
    { key: 'template', header: 'Template', render: (row) => row.template_name },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={row.status === 'COMPLETED' ? 'success' : row.status === 'FAILED' ? 'danger' : 'warning'}>{row.status}</Badge> },
    { key: 'recipients', header: 'Recipients', render: (row) => row.recipient_count.toLocaleString() },
    { key: 'sent', header: 'Sent', render: (row) => row.sent_count.toLocaleString() },
  ];

  return (
    <PageFrame
      title="Omnichannel"
      subtitle="Marketplace and WhatsApp status in one operational shell."
      actions={<Link className="button button--secondary" to="/whatsapp">Open WhatsApp</Link>}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium text-gray-500">Marketplace Orders</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{marketplaceOrders.length.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Live order feed from marketplace</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium text-gray-500">Recommendations</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{marketplaceRecommendations.length.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Suggested replenishment items</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium text-gray-500">WhatsApp Status</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{whatsappConfigQuery.data?.is_connected ? 'Connected' : 'Offline'}</div>
              <div className="text-sm text-gray-500">{whatsappConfigQuery.data?.phone_number ?? 'No phone configured'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium text-gray-500">Delivery Rate</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{(whatsappAnalyticsQuery.data?.delivery_rate ?? 0).toFixed(2)}%</div>
              <div className="text-sm text-gray-500">Read rate: {(whatsappAnalyticsQuery.data?.read_rate ?? 0).toFixed(2)}%</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="marketplace">
          <TabsList>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          </TabsList>

          <TabsContent value="marketplace">
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
                    <DataTable columns={marketplaceColumns} data={marketplaceOrders} emptyMessage="No marketplace orders found." />
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
                    <EmptyState title="No recommendations" body="No market intelligence recommendations were returned." />
                  ) : (
                    <DataTable columns={recommendationColumns} data={marketplaceRecommendations} emptyMessage="No recommendations found." />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="whatsapp">
            {!whatsappConfigQuery.data?.is_connected ? (
              <EmptyState
                title="WhatsApp not connected"
                body="Connect WhatsApp in the full messaging page to enable omnichannel campaigns and notifications."
                action={{ label: 'Open WhatsApp settings', onClick: () => navigate('/whatsapp') }}
              />
            ) : (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader><CardTitle className="text-sm font-medium text-gray-500">Phone Number</CardTitle></CardHeader>
                    <CardContent><div className="text-xl font-semibold">{whatsappConfigQuery.data.phone_number}</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-sm font-medium text-gray-500">Campaigns</CardTitle></CardHeader>
                    <CardContent><div className="text-xl font-semibold">{campaigns.length.toLocaleString()}</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-sm font-medium text-gray-500">Opt Status</CardTitle></CardHeader>
                    <CardContent>
                      <div className="text-xl font-semibold">{optStatusQuery.data?.status ?? 'UNKNOWN'}</div>
                      <div className="text-sm text-gray-500">For {whatsappConfigQuery.data.phone_number}</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Campaigns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {whatsappCampaignsQuery.isError ? (
                      <EmptyState title="Campaigns unavailable" body="The WhatsApp campaigns could not be loaded." />
                    ) : whatsappCampaignsQuery.isLoading ? (
                      <p className="text-sm text-gray-500">Loading campaigns...</p>
                    ) : campaigns.length === 0 ? (
                      <EmptyState title="No campaigns" body="No WhatsApp campaigns were returned by the backend." />
                    ) : (
                      <DataTable columns={campaignColumns} data={campaigns} emptyMessage="No campaigns found." />
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageFrame>
  );
}
