import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useProductQuery, useProductsQuery } from '@/hooks/inventory';
import {
  useLinkSupplierProduct,
  useSupplier,
  useUnlinkSupplierProduct,
} from '@/hooks/suppliers';
import { uiStore } from '@/stores/uiStore';
import { normalizeApiError } from '@/utils/errors';
import { formatCurrency } from '@/utils/numbers';
import type { ApiError } from '@/types/api';

type TabKey = 'details' | 'products' | 'orders';

function ProductLookupOption({ productId }: { productId: number }) {
  const { data } = useProductQuery(productId);
  return <span>{data?.name ?? `Product #${productId}`}</span>;
}

export default function SupplierDetailPage() {
  const navigate = useNavigate();
  const { supplierId } = useParams<{ supplierId?: string; id?: string }>();
  const resolvedSupplierId = supplierId ?? '';
  const addToast = uiStore((state) => state.addToast);
  const { data: supplier, isLoading, error, refetch } = useSupplier(resolvedSupplierId);
  const productsQuery = useProductsQuery({ page_size: 500 });
  const linkMutation = useLinkSupplierProduct();
  const unlinkMutation = useUnlinkSupplierProduct();
  const [activeTab, setActiveTab] = useState<TabKey>('details');
  const [linkOpen, setLinkOpen] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [productId, setProductId] = useState('');
  const [quotedPrice, setQuotedPrice] = useState('');
  const [leadTimeDays, setLeadTimeDays] = useState('');
  const [preferred, setPreferred] = useState(false);

  const productOptions = useMemo(() => {
    const products = productsQuery.data?.data ?? [];
    const needle = search.trim().toLowerCase();
    const linkedIds = new Set(supplier?.sourced_products.map((item) => item.product_id) ?? []);
    return products.filter((product) => {
      if (linkedIds.has(product.product_id)) {
        return false;
      }
      if (!needle) {
        return true;
      }
      return [product.name, product.sku_code ?? '', String(product.product_id)]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [productsQuery.data, search, supplier?.sourced_products]);

  const selectedProduct = Number(productId || 0);

  const resetLinkForm = () => {
    setProductId('');
    setQuotedPrice('');
    setLeadTimeDays('');
    setPreferred(false);
    setSearch('');
  };

  const handleLinkProduct = async () => {
    if (!resolvedSupplierId || !productId || !quotedPrice) {
      return;
    }

    try {
      await linkMutation.mutateAsync({
        supplierId: resolvedSupplierId,
        payload: {
          product_id: Number(productId),
          quoted_price: Number(quotedPrice),
          lead_time_days: leadTimeDays ? Number(leadTimeDays) : undefined,
          is_preferred_supplier: preferred,
        },
      });
      addToast({
        title: 'Product linked',
        message: 'Supplier-product relationship saved',
        variant: 'success',
      });
      setLinkOpen(false);
      resetLinkForm();
    } catch {
      // surfaced by mutation error state
    }
  };

  const handleUnlink = async () => {
    if (!resolvedSupplierId || unlinkTarget === null) {
      return;
    }

    try {
      await unlinkMutation.mutateAsync({ supplierId: resolvedSupplierId, productId: unlinkTarget });
      addToast({
        title: 'Product unlinked',
        message: `Product #${unlinkTarget} removed from supplier`,
        variant: 'success',
      });
      setUnlinkTarget(null);
    } catch {
      // surfaced by mutation error state
    }
  };

  if (isLoading) {
    return (
      <PageFrame title="Supplier Details" subtitle="Backend-sourced supplier profile">
        <SkeletonLoader width="100%" height="280px" variant="rect" />
      </PageFrame>
    );
  }

  if (error) {
    return (
      <PageFrame title="Supplier Details" subtitle="Backend-sourced supplier profile">
        <ErrorState error={normalizeApiError(error) as ApiError} onRetry={() => refetch()} />
      </PageFrame>
    );
  }

  if (!supplier) {
    return (
      <PageFrame title="Supplier Details" subtitle="Backend-sourced supplier profile">
        <EmptyState title="Supplier not found" body="The supplier may have been deleted or you may not have access." />
      </PageFrame>
    );
  }

  return (
    <PageFrame
      title={supplier.name}
      subtitle={supplier.contact.name ?? 'Supplier profile'}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => navigate('/suppliers')}>
            Back
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(`/suppliers/${supplier.id}/edit`)}>
            Edit Supplier
          </Button>
          <Button type="button" onClick={() => navigate('/purchase-orders/create')}>
            Create PO
          </Button>
        </div>
      }
    >
      <div className="mb-6 flex flex-wrap gap-3">
        <Badge variant={supplier.is_active ? 'success' : 'secondary'}>{supplier.is_active ? 'Active' : 'Inactive'}</Badge>
        <Badge variant="secondary">Payment terms: {supplier.payment_terms_days ?? '—'} days</Badge>
        <Badge variant="secondary">Fill rate: {supplier.analytics.fill_rate_90d.toFixed(1)}%</Badge>
        <Badge variant="secondary">
          Avg lead time: {supplier.analytics.avg_lead_time_days === null ? '—' : supplier.analytics.avg_lead_time_days}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Supplier Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Detail label="Contact Person" value={supplier.contact.name} />
              <Detail label="Email" value={supplier.contact.email} />
              <Detail label="Phone" value={supplier.contact.phone} />
              <Detail label="Address" value={supplier.contact.address} full />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Detail label="Payment Terms" value={supplier.payment_terms_days === null ? '—' : `${supplier.payment_terms_days} days`} />
              <Detail label="Avg Lead Time" value={supplier.analytics.avg_lead_time_days === null ? '—' : `${supplier.analytics.avg_lead_time_days} days`} />
              <Detail label="Fill Rate" value={`${supplier.analytics.fill_rate_90d.toFixed(1)}%`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Purchase Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {supplier.recent_purchase_orders.length === 0 ? (
              <EmptyState title="No purchase orders" body="This supplier has no recent purchase orders yet." />
            ) : (
              supplier.recent_purchase_orders.map((po) => (
                <div key={po.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">{po.id}</div>
                      <div className="text-xs text-muted-foreground">{po.created_at}</div>
                    </div>
                    <Badge variant={po.status === 'FULFILLED' ? 'success' : po.status === 'CANCELLED' ? 'secondary' : 'info'}>
                      {po.status === 'FULFILLED' ? 'Received' : po.status}
                    </Badge>
                  </div>
                  <div className="mt-3 text-sm text-muted-foreground">
                    Expected delivery: {po.expected_delivery_date ?? '—'}
                  </div>
                  <div className="mt-3">
                    <Button type="button" variant="secondary" onClick={() => navigate(`/purchase-orders/${po.id}`)}>
                      View PO
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 border-b border-border">
        <div className="flex gap-4">
          {(['details', 'products', 'orders'] as TabKey[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 px-1 py-3 text-sm font-medium ${
                activeTab === tab ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground'
              }`}
            >
              {tab === 'details' ? 'Details' : tab === 'products' ? 'Products' : 'Purchase Orders'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'details' ? (
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Metric title="Linked Products" value={supplier.sourced_products.length} />
          <Metric title="Recent POs" value={supplier.recent_purchase_orders.length} />
          <Metric title="Fill Rate" value={`${supplier.analytics.fill_rate_90d.toFixed(1)}%`} />
          <Metric
            title="Avg Lead Time"
            value={supplier.analytics.avg_lead_time_days === null ? '—' : `${supplier.analytics.avg_lead_time_days} days`}
          />
        </div>
      ) : null}

      {activeTab === 'products' ? (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Linked Products</CardTitle>
              <Button type="button" onClick={() => setLinkOpen(true)}>
                Link Product
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {supplier.sourced_products.length === 0 ? (
              <EmptyState title="No linked products" body="Link products to define supplier pricing and lead times." />
            ) : (
              supplier.sourced_products.map((item) => (
                <div key={item.product_id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">Product ID: {item.product_id}</div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span>Quoted: {formatCurrency(item.quoted_price)}</span>
                      <span>Lead time: {item.lead_time_days ?? '—'} days</span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button type="button" variant="secondary" onClick={() => setUnlinkTarget(item.product_id)}>
                      Unlink
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setLinkOpen(true);
                        setProductId(String(item.product_id));
                        setQuotedPrice(String(item.quoted_price));
                        setLeadTimeDays(item.lead_time_days === null ? '' : String(item.lead_time_days));
                        setPreferred(false);
                      }}
                    >
                      Edit Link
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === 'orders' ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Purchase Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {supplier.recent_purchase_orders.length === 0 ? (
              <EmptyState title="No purchase orders" body="This supplier has no purchase order history yet." />
            ) : (
              <div className="space-y-3">
                {supplier.recent_purchase_orders.map((po) => (
                  <div key={po.id} className="rounded-lg border border-border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">{po.id}</div>
                        <div className="text-xs text-muted-foreground">{po.created_at}</div>
                      </div>
                      <Badge variant={po.status === 'FULFILLED' ? 'success' : po.status === 'CANCELLED' ? 'secondary' : 'info'}>
                        {po.status === 'FULFILLED' ? 'Received' : po.status}
                      </Badge>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button type="button" variant="secondary" onClick={() => navigate(`/purchase-orders/${po.id}`)}>
                        View PO
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {linkOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-background p-6 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">Link Product</h3>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setLinkOpen(false);
                  resetLinkForm();
                }}
              >
                Close
              </Button>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium">Search products</span>
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products" />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium">Product</span>
                <select
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  value={productId}
                  onChange={(event) => setProductId(event.target.value)}
                >
                  <option value="">Select product</option>
                  {productOptions.map((product) => (
                    <option key={product.product_id} value={product.product_id}>
                      {product.name} ({product.product_id})
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium">Quoted Price</span>
                <Input type="number" min={0} step="0.01" value={quotedPrice} onChange={(event) => setQuotedPrice(event.target.value)} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium">Lead Time Days</span>
                <Input type="number" min={0} step="1" value={leadTimeDays} onChange={(event) => setLeadTimeDays(event.target.value)} />
              </label>
              <label className="flex items-center gap-2 md:col-span-2">
                <input type="checkbox" checked={preferred} onChange={(event) => setPreferred(event.target.checked)} />
                <span className="text-sm font-medium">Preferred supplier</span>
              </label>
            </div>
            <div className="mt-6 flex gap-3">
              <Button type="button" loading={linkMutation.isPending} onClick={handleLinkProduct}>
                Save Link
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setLinkOpen(false);
                  resetLinkForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={unlinkTarget !== null}
        title="Unlink Product"
        body={`Remove product #${unlinkTarget ?? ''} from this supplier?`}
        confirmLabel={unlinkMutation.isPending ? 'Removing…' : 'Unlink'}
        destructive
        onConfirm={handleUnlink}
        onCancel={() => setUnlinkTarget(null)}
      />
    </PageFrame>
  );
}

function Detail({ label, value, full = false }: { label: string; value: string | null; full?: boolean }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value ?? '—'}</div>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}
