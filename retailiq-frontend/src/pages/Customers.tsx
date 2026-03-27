import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CustomerForm } from '@/features/customers/CustomerForm';
import { normalizeApiError } from '@/utils/errors';
import {
  useCustomersQuery,
  useTopCustomersQuery,
  useCustomerAnalyticsQuery,
  useCreateCustomerMutation,
} from '@/hooks/customers';
import type { ListCustomersRequest } from '@/types/api';
import type { Customer } from '@/types/models';

const DEFAULT_PAGE_SIZE = 20;

function parsePage(value: string | null) {
  const parsed = Number(value ?? '1');
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

export default function CustomersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchName, setSearchName] = useState(searchParams.get('name') ?? '');
  const [searchMobile, setSearchMobile] = useState(searchParams.get('mobile') ?? '');
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    setSearchName(searchParams.get('name') ?? '');
    setSearchMobile(searchParams.get('mobile') ?? '');
  }, [searchParams]);

  const page = parsePage(searchParams.get('page'));

  const filters = useMemo<ListCustomersRequest>(() => {
    const params: ListCustomersRequest = {
      page,
      page_size: DEFAULT_PAGE_SIZE,
    };

    const name = searchParams.get('name') ?? '';
    const mobile = searchParams.get('mobile') ?? '';
    if (name) params.name = name;
    if (mobile) params.mobile = mobile;
    return params;
  }, [page, searchParams]);

  const customersQuery = useCustomersQuery(filters);
  const topCustomersQuery = useTopCustomersQuery({ metric: 'revenue', limit: 5 });
  const analyticsQuery = useCustomerAnalyticsQuery();
  const createMutation = useCreateCustomerMutation();

  const customers = customersQuery.data?.data ?? (Array.isArray(customersQuery.data) ? (customersQuery.data as Customer[]) : []);
  const meta = customersQuery.data?.meta;
  const totalCustomers = meta?.total ?? customers.length;
  const totalPages = Math.max(1, Math.ceil(totalCustomers / DEFAULT_PAGE_SIZE));
  const analytics = analyticsQuery.data;
  const topCustomers = topCustomersQuery.data ?? [];

  const handleSearch = () => {
    const next = new URLSearchParams(searchParams);
    next.set('page', '1');
    if (searchName.trim()) next.set('name', searchName.trim());
    else next.delete('name');
    if (searchMobile.trim()) next.set('mobile', searchMobile.trim());
    else next.delete('mobile');
    setSearchParams(next, { replace: true });
  };

  const setPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(Math.max(1, nextPage)));
    setSearchParams(next, { replace: true });
  };

  if (customersQuery.isError) {
    return <ErrorState error={normalizeApiError(customersQuery.error)} onRetry={() => void customersQuery.refetch()} />;
  }

  return (
    <PageFrame
      title="Customers"
      subtitle="Manage your customer relationships and track purchase behaviour."
      actions={
        <>
          <Badge variant="secondary">{totalCustomers.toLocaleString()} customers</Badge>
          <Button variant="secondary" onClick={() => navigate('/customers/analytics')}>
            Analytics
          </Button>
          <Button onClick={() => setCreateOpen(true)}>Add Customer</Button>
        </>
      }
    >
      <div className="grid grid--3" style={{ marginBottom: '1.5rem' }}>
        <Card>
          <CardHeader><CardTitle>New Customers</CardTitle></CardHeader>
          <CardContent>
            <h2 style={{ marginBottom: 0 }}>{analytics?.new_customers ?? '—'}</h2>
            <span className="muted">This month</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Active Customers</CardTitle></CardHeader>
          <CardContent>
            <h2 style={{ marginBottom: 0 }}>{analytics?.active_customers ?? '—'}</h2>
            <span className="muted">Last 30 days</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Returning Rate</CardTitle></CardHeader>
          <CardContent>
            <h2 style={{ marginBottom: 0 }}>{analytics?.returning_rate != null ? `${analytics.returning_rate}%` : '—'}</h2>
            <span className="muted">Repeat purchase rate</span>
          </CardContent>
        </Card>
      </div>

      {topCustomers.length > 0 && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Top Customers by Revenue</CardTitle></CardHeader>
          <CardContent>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {topCustomers.map((c, i) => (
                <button
                  key={c.customer_id}
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    border: 0,
                    background: 'transparent',
                    padding: 0,
                  }}
                  onClick={() => navigate(`/customers/${c.customer_id}`)}
                >
                  <Badge variant={i === 0 ? 'default' : 'secondary'}>#{i + 1}</Badge>
                  <span><strong>{c.name}</strong> — {c.mobile_number}</span>
                  <span className="muted">₹{c.value.toLocaleString()}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="button-row" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <Input placeholder="Search by name" value={searchName} onChange={(e) => setSearchName(e.target.value)} style={{ maxWidth: 220 }} />
        <Input placeholder="Search by mobile" value={searchMobile} onChange={(e) => setSearchMobile(e.target.value)} style={{ maxWidth: 220 }} />
        <Button onClick={handleSearch}>Search</Button>
      </div>

      <CustomerForm
        open={createOpen}
        mode="create"
        isSubmitting={createMutation.isPending}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (payload) => {
          await createMutation.mutateAsync(payload);
        }}
      />

      {customersQuery.isLoading ? (
        <SkeletonLoader variant="rect" height={300} />
      ) : customers.length === 0 ? (
        <EmptyState title="No customers found" body="Add your first customer to get started with CRM features." />
      ) : (
        <DataTable<Customer>
          columns={[
            { key: 'name', header: 'Name', render: (row: Customer) => row.name },
            { key: 'mobile', header: 'Mobile', render: (row: Customer) => row.mobile_number },
            { key: 'email', header: 'Email', render: (row: Customer) => row.email ?? '—' },
            { key: 'gender', header: 'Gender', render: (row: Customer) => row.gender ?? '—' },
            { key: 'created', header: 'Created', render: (row: Customer) => row.created_at ? new Date(row.created_at).toLocaleDateString() : '—' },
            { key: 'actions', header: '', render: (row: Customer) => (
              <Button variant="ghost" onClick={() => navigate(`/customers/${row.customer_id}`)}>View</Button>
            )},
          ]}
          data={customers}
        />
      )}

      <div className="button-row" style={{ marginTop: '1rem', justifyContent: 'center' }}>
        <Button variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Previous</Button>
        <span className="muted">Page {page} of {totalPages}</span>
        <Button variant="ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</Button>
      </div>
    </PageFrame>
  );
}
