import { useEffect, useState } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  useCreateMarketplaceOrderMutation,
  useCreateRfqMutation,
  useMarketplaceOrderQuery,
  useMarketplaceOrdersQuery,
  useMarketplaceRecommendationsQuery,
  useMarketplaceSearchQuery,
  useMarketplaceTrackingQuery,
  useRfqQuery,
  useSupplierCatalogQuery,
  useSupplierDashboardQuery,
  useSupplierOnboardMutation,
} from '@/hooks/marketplace';
import { normalizeApiError } from '@/utils/errors';
import type {
  CreateMarketplaceOrderRequest,
  CreateRfqRequest,
  ListMarketplaceOrdersResponse,
  MarketplaceCatalogListing,
  MarketplaceRecommendation,
  MarketplaceSearchRequest,
  SupplierOnboardRequest,
} from '@/types/api';

type MarketplaceTab = 'catalog' | 'orders' | 'procurement' | 'suppliers';
type RfqRow = {
  category: string;
  description: string;
  quantity: string;
  catalog_item_id?: string;
  supplier_profile_id?: string;
  unit_price?: number;
};
type OrderRow = { catalog_item_id: string; quantity: string };

const PAGE_SIZE = 20;
const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value);

const emptyRfqRow = (): RfqRow => ({ category: '', description: '', quantity: '1' });
const emptyOrderRow = (): OrderRow => ({ catalog_item_id: '', quantity: '1' });

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<MarketplaceTab>('catalog');

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [supplierRatingMin, setSupplierRatingMin] = useState('');
  const [moqMax, setMoqMax] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [catalogPage, setCatalogPage] = useState(1);
  const [recommendationUrgency, setRecommendationUrgency] = useState('HIGH');

  const [orderStatus, setOrderStatus] = useState('');
  const [orderSupplierId, setOrderSupplierId] = useState('');
  const [ordersPage, setOrdersPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedRfqId, setSelectedRfqId] = useState('');

  const [rfqRows, setRfqRows] = useState<RfqRow[]>([emptyRfqRow()]);
  const [orderRows, setOrderRows] = useState<OrderRow[]>([emptyOrderRow()]);
  const [paymentTerms, setPaymentTerms] = useState('prepaid');
  const [financeRequested, setFinanceRequested] = useState(false);

  const [supplierLookupId, setSupplierLookupId] = useState('');
  const [supplierCatalogPage, setSupplierCatalogPage] = useState(1);
  const [rfqFeedback, setRfqFeedback] = useState('');
  const [orderFeedback, setOrderFeedback] = useState('');
  const [onboardForm, setOnboardForm] = useState({
    supplier_id: '',
    business_name: '',
    business_type: 'WHOLESALER',
    categories: '',
    payment_terms: '',
  });

  const searchParams: MarketplaceSearchRequest = {
    query: query.trim() || undefined,
    category: category.trim() || undefined,
    price_min: priceMin.trim() ? Number(priceMin) : undefined,
    price_max: priceMax.trim() ? Number(priceMax) : undefined,
    supplier_rating_min: supplierRatingMin.trim() ? Number(supplierRatingMin) : undefined,
    moq_max: moqMax.trim() ? Number(moqMax) : undefined,
    sort_by: sortBy || undefined,
    page: catalogPage,
  };

  const catalogQuery = useMarketplaceSearchQuery(searchParams);
  const recommendationsQuery = useMarketplaceRecommendationsQuery({
    category: category.trim() || undefined,
    urgency: recommendationUrgency === 'ALL' ? undefined : recommendationUrgency,
  });
  const ordersQuery = useMarketplaceOrdersQuery({ status: orderStatus.trim() || undefined, supplier_id: orderSupplierId.trim() ? Number(orderSupplierId) : undefined, page: ordersPage });
  const selectedOrderQuery = useMarketplaceOrderQuery(selectedOrderId);
  const selectedTrackingQuery = useMarketplaceTrackingQuery(selectedOrderId);
  const selectedRfqQuery = useRfqQuery(selectedRfqId);
  const supplierDashboardQuery = useSupplierDashboardQuery(supplierLookupId.trim() || '');
  const supplierCatalogQuery = useSupplierCatalogQuery(supplierLookupId.trim() || '', supplierCatalogPage);

  const createRfqMutation = useCreateRfqMutation();
  const createOrderMutation = useCreateMarketplaceOrderMutation();
  const onboardSupplierMutation = useSupplierOnboardMutation();

  const catalogItems = catalogQuery.data?.items ?? [];
  const recommendations = recommendationsQuery.data ?? [];
  const orders = ordersQuery.data?.orders ?? [];
  const catalogPages = Math.max(1, Math.ceil((catalogQuery.data?.total ?? 0) / PAGE_SIZE));
  const orderPages = Math.max(1, Math.ceil((ordersQuery.data?.total ?? 0) / PAGE_SIZE));

  useEffect(() => {
    setCatalogPage(1);
  }, [query, category, priceMin, priceMax, supplierRatingMin, moqMax, sortBy]);

  useEffect(() => {
    setOrdersPage(1);
    setSelectedOrderId('');
  }, [orderStatus, orderSupplierId]);

  useEffect(() => {
    setSupplierCatalogPage(1);
  }, [supplierLookupId]);

  const tabs: Array<{ key: MarketplaceTab; label: string }> = [
    { key: 'catalog', label: 'Catalog' },
    { key: 'orders', label: 'Orders' },
    { key: 'procurement', label: 'Procurement' },
    { key: 'suppliers', label: 'Suppliers' },
  ];

  const addRfqRow = () => {
    setRfqFeedback('');
    setRfqRows((rows) => [...rows, emptyRfqRow()]);
  };
  const addOrderRow = () => {
    setOrderFeedback('');
    setOrderRows((rows) => [...rows, emptyOrderRow()]);
  };

  const updateRfqRow = (index: number, nextRow: Partial<RfqRow>) => {
    setRfqFeedback('');
    setRfqRows((rows) =>
      rows.map((entry, rowIndex) =>
        rowIndex === index
          ? {
              ...entry,
              ...nextRow,
              catalog_item_id: undefined,
              supplier_profile_id: undefined,
              unit_price: undefined,
            }
          : entry,
      ),
    );
  };

  const appendCatalogToRfq = (item: MarketplaceCatalogListing) => {
    setRfqRows((rows) =>
      rows.some((row) => row.catalog_item_id === item.id)
        ? rows
        : [
            ...rows,
            {
              category: item.category ?? '',
              description: item.name,
              quantity: '1',
              catalog_item_id: item.id,
              supplier_profile_id: String(item.supplier_profile_id),
              unit_price: item.unit_price,
            },
          ],
    );
  };

  const appendCatalogToOrder = (item: MarketplaceCatalogListing) => {
    setOrderFeedback('');
    setOrderRows((rows) =>
      rows.some((row) => row.catalog_item_id === item.id)
        ? rows
        : [...rows, { catalog_item_id: item.id, quantity: '1' }],
    );
    setOrderSupplierId(String(item.supplier_profile_id));
    setActiveTab('procurement');
  };

  const submitRfq = () => {
    const items = rfqRows
      .map((row) => ({
        category: row.category.trim() || undefined,
        description: row.description.trim() || undefined,
        quantity: Number(row.quantity),
        catalog_item_id: row.catalog_item_id,
        supplier_profile_id: row.supplier_profile_id,
        unit_price: row.unit_price,
      }))
      .filter((row) => row.quantity > 0 && (row.category || row.description));

    if (!items.length) {
      setRfqFeedback('Add at least one valid RFQ row before submitting.');
      return;
    }

    setRfqFeedback('');
    createRfqMutation.mutate({ items } satisfies CreateRfqRequest, {
      onSuccess: (response) => {
        setSelectedRfqId(String(response.rfq_id));
        setRfqRows([emptyRfqRow()]);
        setRfqFeedback('');
      },
    });
  };

  const submitOrder = () => {
    const items = orderRows
      .map((row) => ({ catalog_item_id: Number(row.catalog_item_id), quantity: Number(row.quantity) }))
      .filter((row) => Number.isFinite(row.catalog_item_id) && row.catalog_item_id > 0 && row.quantity > 0);
    const supplier_id = Number(orderSupplierId);
    if (!Number.isFinite(supplier_id) || supplier_id <= 0) {
      setOrderFeedback('Enter a valid supplier ID before creating an order.');
      return;
    }

    if (!items.length) {
      setOrderFeedback('Add at least one valid item before creating an order.');
      return;
    }

    const payload: CreateMarketplaceOrderRequest = {
      supplier_id,
      items,
      payment_terms: paymentTerms.trim() || undefined,
      finance_requested: financeRequested,
    };

    if (!payload.items.length) {
      setOrderFeedback('Add at least one valid item before creating an order.');
      return;
    }

    setOrderFeedback('');
    createOrderMutation.mutate(payload, {
      onSuccess: (response) => {
        setSelectedOrderId(String(response.order_id));
        setOrderRows([emptyOrderRow()]);
        setActiveTab('orders');
        setOrderFeedback('');
      },
    });
  };

  const submitSupplier = () => {
    const categories = onboardForm.categories.split(',').map((value) => value.trim()).filter(Boolean);
    const paymentTermsValue = onboardForm.payment_terms.trim()
      ? (() => {
          try {
            return JSON.parse(onboardForm.payment_terms);
          } catch {
            return onboardForm.payment_terms.split(',').map((value) => value.trim()).filter(Boolean);
          }
        })()
      : undefined;

    const payload: SupplierOnboardRequest = {
      supplier_id: onboardForm.supplier_id.trim() || undefined,
      business_name: onboardForm.business_name.trim() || undefined,
      business_type: onboardForm.business_type,
      categories: categories.length ? categories : undefined,
      payment_terms: paymentTermsValue,
    };

    onboardSupplierMutation.mutate(payload, {
      onSuccess: (response) => setSupplierLookupId(String(response.id)),
    });
  };

  const catalogColumns: Column<MarketplaceCatalogListing>[] = [
    { key: 'name', header: 'Product', render: (row) => row.name },
    { key: 'category', header: 'Category', render: (row) => row.category ?? 'N/A' },
    { key: 'sku', header: 'SKU', render: (row) => row.sku ?? 'N/A' },
    { key: 'supplier_profile_id', header: 'Supplier ID', render: (row) => row.supplier_profile_id },
    { key: 'moq', header: 'MOQ', render: (row) => row.moq.toLocaleString() },
    { key: 'unit_price', header: 'Price', render: (row) => formatMoney(row.unit_price) },
    { key: 'actions', header: 'Actions', render: (row) => <div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => appendCatalogToRfq(row)}>Add to RFQ</Button><Button variant="ghost" size="sm" onClick={() => appendCatalogToOrder(row)}>Add to Order</Button></div> },
  ];

  const recommendationColumns: Column<MarketplaceRecommendation>[] = [
    { key: 'product_name', header: 'Product', render: (row) => row.product_name },
    { key: 'category', header: 'Category', render: (row) => row.category ?? 'N/A' },
    { key: 'urgency', header: 'Urgency', render: (row) => <Badge variant={row.urgency === 'CRITICAL' ? 'danger' : row.urgency === 'HIGH' ? 'warning' : 'info'}>{row.urgency}</Badge> },
    { key: 'suggested_qty', header: 'Suggested Qty', render: (row) => row.suggested_qty.toLocaleString() },
    { key: 'suggested_supplier_id', header: 'Supplier ID', render: (row) => row.suggested_supplier_id ?? 'N/A' },
  ];

  const orderColumns: Column<ListMarketplaceOrdersResponse['orders'][number]>[] = [
    { key: 'id', header: 'Order ID', render: (row) => row.id },
    { key: 'order_number', header: 'Order #', render: (row) => row.order_number },
    { key: 'supplier_profile_id', header: 'Supplier ID', render: (row) => row.supplier_profile_id },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={row.status === 'DELIVERED' ? 'success' : row.status === 'CANCELLED' ? 'danger' : 'warning'}>{row.status}</Badge> },
    { key: 'total', header: 'Total', render: (row) => formatMoney(row.total) },
    { key: 'payment_status', header: 'Payment', render: (row) => row.payment_status },
    { key: 'created_at', header: 'Created', render: (row) => new Date(row.created_at).toLocaleString() },
    { key: 'action', header: 'Action', render: (row) => <Button variant="ghost" size="sm" onClick={() => setSelectedOrderId(String(row.id))}>Open</Button> },
  ];

  return (
    <PageFrame title="Marketplace" subtitle="Search the catalog, place orders, create RFQs, and manage suppliers.">
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button key={tab.key} variant={activeTab === tab.key ? 'primary' : 'ghost'} onClick={() => setActiveTab(tab.key)}>
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === 'catalog' && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Catalog filters</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Input label="Query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search items" />
              <Input label="Category" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Beverages" />
              <Input label="Price min" type="number" value={priceMin} onChange={(event) => setPriceMin(event.target.value)} />
              <Input label="Price max" type="number" value={priceMax} onChange={(event) => setPriceMax(event.target.value)} />
              <Input label="Supplier rating min" type="number" step="0.1" value={supplierRatingMin} onChange={(event) => setSupplierRatingMin(event.target.value)} />
              <Input label="MOQ max" type="number" value={moqMax} onChange={(event) => setMoqMax(event.target.value)} />
              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">Sort by</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="price_asc">Price asc</SelectItem>
                    <SelectItem value="price_desc">Price desc</SelectItem>
                    <SelectItem value="rating_desc">Rating desc</SelectItem>
                    <SelectItem value="moq_asc">MOQ asc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle>Recommended procurement</CardTitle>
                <div className="grid gap-2 md:min-w-56">
                  <label className="text-sm font-medium text-gray-700">Urgency</label>
                  <Select value={recommendationUrgency} onValueChange={setRecommendationUrgency}>
                    <SelectTrigger aria-label="Recommendation urgency"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {recommendationsQuery.isLoading ? (
                <SkeletonLoader variant="rect" height={160} />
              ) : recommendationsQuery.isError ? (
                <ErrorState error={normalizeApiError(recommendationsQuery.error)} onRetry={() => void recommendationsQuery.refetch()} />
              ) : recommendations.length === 0 ? (
                <EmptyState title="No recommendations" body="The backend did not return procurement recommendations for the current filter." />
              ) : (
                <DataTable columns={recommendationColumns} data={recommendations.slice(0, 6)} emptyMessage="No recommendations available." />
              )}
            </CardContent>
          </Card>

          {catalogQuery.isLoading ? (
            <SkeletonLoader variant="rect" height={280} />
          ) : catalogQuery.isError ? (
            <ErrorState error={normalizeApiError(catalogQuery.error)} onRetry={() => void catalogQuery.refetch()} />
          ) : catalogItems.length === 0 ? (
            <EmptyState title="No catalog items found" body="Try broader search criteria." />
          ) : (
            <Card>
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle>Catalog results</CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Page {catalogPage} of {catalogPages}</span>
                  <Button variant="ghost" size="sm" disabled={catalogPage <= 1} onClick={() => setCatalogPage((page) => Math.max(1, page - 1))}>Previous</Button>
                  <Button variant="ghost" size="sm" disabled={catalogPage >= catalogPages} onClick={() => setCatalogPage((page) => Math.min(catalogPages, page + 1))}>Next</Button>
                </div>
              </CardHeader>
              <CardContent>
                <DataTable columns={catalogColumns} data={catalogItems} emptyMessage="No catalog items found." />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Order filters</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Input label="Status" value={orderStatus} onChange={(event) => setOrderStatus(event.target.value)} placeholder="SUBMITTED" />
                <Input label="Supplier ID" value={orderSupplierId} onChange={(event) => setOrderSupplierId(event.target.value)} placeholder="123" />
                <Input label="Open order by ID" value={selectedOrderId} onChange={(event) => setSelectedOrderId(event.target.value)} placeholder="Open any order" />
                <div className="flex items-end gap-2">
                  <Button variant="ghost" onClick={() => setSelectedOrderId('')}>Clear detail</Button>
                </div>
              </CardContent>
            </Card>

          {ordersQuery.isLoading ? (
            <SkeletonLoader variant="rect" height={280} />
          ) : ordersQuery.isError ? (
            <ErrorState error={normalizeApiError(ordersQuery.error)} onRetry={() => void ordersQuery.refetch()} />
          ) : orders.length === 0 ? (
            <EmptyState title="No orders found" body="Marketplace orders will appear once procurement starts." />
          ) : (
            <Card>
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle>Marketplace orders</CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Page {ordersPage} of {orderPages}</span>
                  <Button variant="ghost" size="sm" disabled={ordersPage <= 1} onClick={() => setOrdersPage((page) => Math.max(1, page - 1))}>Previous</Button>
                  <Button variant="ghost" size="sm" disabled={ordersPage >= orderPages} onClick={() => setOrdersPage((page) => Math.min(orderPages, page + 1))}>Next</Button>
                </div>
              </CardHeader>
              <CardContent>
                <DataTable columns={orderColumns} data={orders} emptyMessage="No orders found." />
              </CardContent>
            </Card>
          )}

          {selectedOrderId ? (
            <div className="grid gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Order detail</CardTitle></CardHeader>
                <CardContent>
                  {selectedOrderQuery.isLoading ? (
                    <SkeletonLoader variant="rect" height={220} />
                  ) : selectedOrderQuery.isError ? (
                    <ErrorState error={normalizeApiError(selectedOrderQuery.error)} onRetry={() => void selectedOrderQuery.refetch()} />
                  ) : selectedOrderQuery.data ? (
                    <pre className="whitespace-pre-wrap rounded-2xl bg-gray-50 p-4 text-sm">{JSON.stringify(selectedOrderQuery.data, null, 2)}</pre>
                  ) : (
                    <EmptyState title="No order selected" body="Pick an order from the table or type an ID." />
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Tracking</CardTitle></CardHeader>
                <CardContent>
                  {selectedTrackingQuery.isLoading ? (
                    <SkeletonLoader variant="rect" height={220} />
                  ) : selectedTrackingQuery.isError ? (
                    <ErrorState error={normalizeApiError(selectedTrackingQuery.error)} onRetry={() => void selectedTrackingQuery.refetch()} />
                  ) : selectedTrackingQuery.data ? (
                    <pre className="whitespace-pre-wrap rounded-2xl bg-gray-50 p-4 text-sm">{JSON.stringify(selectedTrackingQuery.data, null, 2)}</pre>
                  ) : (
                    <EmptyState title="No tracking data" body="The selected order did not return logistics events." />
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      )}

      {activeTab === 'procurement' && (
        <div className="space-y-6">
          <Card>
              <CardHeader><CardTitle>Build RFQ</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {rfqRows.map((row, index) => (
                  <div key={`rfq-${index}`} className="grid gap-3 md:grid-cols-[1fr_2fr_180px_auto]">
                  <Input label="Category" value={row.category} onChange={(event) => updateRfqRow(index, { category: event.target.value })} />
                  <Input label="Description" value={row.description} onChange={(event) => updateRfqRow(index, { description: event.target.value })} />
                  <Input label="Quantity" type="number" value={row.quantity} onChange={(event) => updateRfqRow(index, { quantity: event.target.value })} />
                  <div className="flex items-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setRfqRows((rows) => rows.length === 1 ? rows : rows.filter((_, rowIndex) => rowIndex !== index))}>Remove</Button>
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={addRfqRow}>Add RFQ row</Button>
                <Button onClick={submitRfq} loading={createRfqMutation.isPending}>Submit RFQ</Button>
              </div>
              {rfqFeedback ? <p className="text-sm text-red-600">{rfqFeedback}</p> : null}
              {createRfqMutation.isError ? <p className="text-sm text-red-600">{normalizeApiError(createRfqMutation.error).message}</p> : null}
              {createRfqMutation.isSuccess ? <p className="text-sm text-green-600">RFQ created successfully.</p> : null}
            </CardContent>
          </Card>

          <Card>
              <CardHeader><CardTitle>Place marketplace order</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                <Input label="Supplier ID" value={orderSupplierId} onChange={(event) => { setOrderFeedback(''); setOrderSupplierId(event.target.value); }} />
                <Input label="Payment terms" value={paymentTerms} onChange={(event) => setPaymentTerms(event.target.value)} placeholder="prepaid / net30" />
                <label className="flex items-end gap-2 text-sm font-medium text-gray-700">
                  <input type="checkbox" checked={financeRequested} onChange={(event) => setFinanceRequested(event.target.checked)} />
                  Finance requested
                </label>
              </div>
              {orderRows.map((row, index) => (
                <div key={`order-${index}`} className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
                  <Input label="Catalog item ID" value={row.catalog_item_id} onChange={(event) => { setOrderFeedback(''); setOrderRows((rows) => rows.map((entry, rowIndex) => rowIndex === index ? { ...entry, catalog_item_id: event.target.value } : entry)); }} />
                  <Input label="Quantity" type="number" value={row.quantity} onChange={(event) => { setOrderFeedback(''); setOrderRows((rows) => rows.map((entry, rowIndex) => rowIndex === index ? { ...entry, quantity: event.target.value } : entry)); }} />
                  <div className="flex items-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setOrderRows((rows) => rows.length === 1 ? rows : rows.filter((_, rowIndex) => rowIndex !== index))}>Remove</Button>
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={addOrderRow}>Add order row</Button>
                <Button onClick={submitOrder} loading={createOrderMutation.isPending}>Create order</Button>
              </div>
              {orderFeedback ? <p className="text-sm text-red-600">{orderFeedback}</p> : null}
              {createOrderMutation.isError ? <p className="text-sm text-red-600">{normalizeApiError(createOrderMutation.error).message}</p> : null}
              {createOrderMutation.isSuccess ? <p className="text-sm text-green-600">Order created successfully.</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Load RFQ by ID</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                <Input label="RFQ ID" value={selectedRfqId} onChange={(event) => setSelectedRfqId(event.target.value)} />
                <div className="flex items-end">
                  <Button variant="secondary" onClick={() => setSelectedRfqId((value) => value.trim())}>Load RFQ</Button>
                </div>
              </div>
              {selectedRfqId ? (
                selectedRfqQuery.isLoading ? (
                  <SkeletonLoader variant="rect" height={180} />
                ) : selectedRfqQuery.isError ? (
                  <ErrorState error={normalizeApiError(selectedRfqQuery.error)} onRetry={() => void selectedRfqQuery.refetch()} />
                ) : selectedRfqQuery.data ? (
                  <pre className="whitespace-pre-wrap rounded-2xl bg-gray-50 p-4 text-sm">{JSON.stringify(selectedRfqQuery.data, null, 2)}</pre>
                ) : (
                  <EmptyState title="RFQ not found" body="Load an RFQ by numeric ID to inspect responses." />
                )
              ) : (
                <EmptyState title="No RFQ selected" body="Create or load an RFQ to inspect it." />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'suppliers' && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Lookup supplier</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-[1fr_auto]">
              <Input label="Supplier ID" value={supplierLookupId} onChange={(event) => setSupplierLookupId(event.target.value)} />
              <div className="flex items-end"><Button variant="secondary" onClick={() => setSupplierCatalogPage(1)}>Load supplier</Button></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Supplier onboarding</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Input label="Supplier ID (optional)" value={onboardForm.supplier_id} onChange={(event) => setOnboardForm((form) => ({ ...form, supplier_id: event.target.value }))} />
              <Input label="Business name" value={onboardForm.business_name} onChange={(event) => setOnboardForm((form) => ({ ...form, business_name: event.target.value }))} />
              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">Business type</label>
                <Select value={onboardForm.business_type} onValueChange={(value) => setOnboardForm((form) => ({ ...form, business_type: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WHOLESALER">Wholesaler</SelectItem>
                    <SelectItem value="MANUFACTURER">Manufacturer</SelectItem>
                    <SelectItem value="DISTRIBUTOR">Distributor</SelectItem>
                    <SelectItem value="ARTISAN">Artisan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input label="Categories" value={onboardForm.categories} onChange={(event) => setOnboardForm((form) => ({ ...form, categories: event.target.value }))} placeholder="Beverages, Snacks" />
              <Input label="Payment terms JSON" value={onboardForm.payment_terms} onChange={(event) => setOnboardForm((form) => ({ ...form, payment_terms: event.target.value }))} placeholder='{"net30": true}' />
              <div className="flex items-end"><Button onClick={submitSupplier} loading={onboardSupplierMutation.isPending}>Onboard supplier</Button></div>
            </CardContent>
            {onboardSupplierMutation.isError ? <CardContent><p className="text-sm text-red-600">{normalizeApiError(onboardSupplierMutation.error).message}</p></CardContent> : null}
            {onboardSupplierMutation.isSuccess ? <CardContent><p className="text-sm text-green-600">Supplier onboarded successfully.</p></CardContent> : null}
          </Card>

          {supplierLookupId.trim() ? (
            <div className="grid gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Supplier dashboard</CardTitle></CardHeader>
                <CardContent>
                  {supplierDashboardQuery.isLoading ? (
                    <SkeletonLoader variant="rect" height={200} />
                  ) : supplierDashboardQuery.isError ? (
                    <ErrorState error={normalizeApiError(supplierDashboardQuery.error)} onRetry={() => void supplierDashboardQuery.refetch()} />
                  ) : (
                    <pre className="whitespace-pre-wrap rounded-2xl bg-gray-50 p-4 text-sm">{JSON.stringify(supplierDashboardQuery.data ?? {}, null, 2)}</pre>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <CardTitle>Supplier catalog</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Page {supplierCatalogPage}</span>
                    <Button variant="ghost" size="sm" disabled={supplierCatalogPage <= 1} onClick={() => setSupplierCatalogPage((page) => Math.max(1, page - 1))}>Previous</Button>
                    <Button variant="ghost" size="sm" onClick={() => setSupplierCatalogPage((page) => page + 1)}>Next</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {supplierCatalogQuery.isLoading ? (
                    <SkeletonLoader variant="rect" height={200} />
                  ) : supplierCatalogQuery.isError ? (
                    <ErrorState error={normalizeApiError(supplierCatalogQuery.error)} onRetry={() => void supplierCatalogQuery.refetch()} />
                  ) : (
                    <DataTable
                      columns={[
                        { key: 'id', header: 'Item ID', render: (row: Record<string, unknown>) => row.id as string | number },
                        { key: 'sku', header: 'SKU', render: (row: Record<string, unknown>) => (row.sku as string | null) ?? 'N/A' },
                        { key: 'name', header: 'Name', render: (row: Record<string, unknown>) => row.name as string },
                        { key: 'category', header: 'Category', render: (row: Record<string, unknown>) => (row.category as string | null) ?? 'N/A' },
                        { key: 'unit_price', header: 'Unit Price', render: (row: Record<string, unknown>) => formatMoney(Number(row.unit_price ?? 0)) },
                        { key: 'moq', header: 'MOQ', render: (row: Record<string, unknown>) => row.moq as number },
                      ]}
                      data={supplierCatalogQuery.data?.items ?? []}
                      emptyMessage="No supplier catalog items found."
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <EmptyState title="Lookup a supplier to continue" body="Enter a supplier profile ID to view dashboard metrics and catalog items." />
          )}
        </div>
      )}
    </PageFrame>
  );
}
