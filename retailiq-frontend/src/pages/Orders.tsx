import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { routes } from '@/routes/routes';

type OrdersTab = 'sales' | 'purchase-orders' | 'marketplace';

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<OrdersTab>('sales');

  return (
    <PageFrame
      title="Orders Hub"
      subtitle="Centralize sales, purchase orders, and marketplace order flows."
    >
      <div className="button-row mb-4">
        <Button variant={activeTab === 'sales' ? 'primary' : 'ghost'} onClick={() => setActiveTab('sales')}>
          Sales
        </Button>
        <Button variant={activeTab === 'purchase-orders' ? 'primary' : 'ghost'} onClick={() => setActiveTab('purchase-orders')}>
          Purchase Orders
        </Button>
        <Button variant={activeTab === 'marketplace' ? 'primary' : 'ghost'} onClick={() => setActiveTab('marketplace')}>
          Marketplace Orders
        </Button>
      </div>

      {activeTab === 'sales' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Sales entry points</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="muted">Jump to POS or review recent transactions from one place.</p>
              <div className="button-row">
                <Link className="button" to={routes.pos}>Open POS</Link>
                <Link className="button button--secondary" to={routes.transactions}>View Transactions</Link>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Sales summary</CardTitle></CardHeader>
            <CardContent>
              <EmptyState title="Sales overview" body="Use the dashboard and transaction list to monitor live sales activity." />
            </CardContent>
          </Card>
        </div>
      ) : null}

      {activeTab === 'purchase-orders' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Purchase order hub</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="muted">Manage supplier purchase orders from the dedicated purchase-order surface.</p>
              <div className="button-row">
                <Link className="button" to="/purchase-orders">Open Purchase Orders</Link>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Status</CardTitle></CardHeader>
            <CardContent>
              <EmptyState title="Branch B surface" body="Detailed purchase-order workflows remain on the purchase-order pages." />
            </CardContent>
          </Card>
        </div>
      ) : null}

      {activeTab === 'marketplace' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Marketplace orders</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="muted">Browse procurement activity and supplier marketplace orders.</p>
              <div className="button-row">
                <Link className="button" to={routes.marketplace}>Open Marketplace</Link>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Market links</CardTitle></CardHeader>
            <CardContent>
              <EmptyState title="Marketplace surface" body="Marketplace order management stays in the marketplace module." />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </PageFrame>
  );
}
