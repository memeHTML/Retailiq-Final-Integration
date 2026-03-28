import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { normalizeApiError } from '@/utils/errors';
import {
  useCustomersQuery,
  useTopCustomersQuery,
  useCustomerAnalyticsQuery,
  useCreateCustomerMutation,
} from '@/hooks/customers';
import type { CreateCustomerRequest, ListCustomersRequest } from '@/types/api';
import type { Customer } from '@/types/models';

export default function CustomersPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ListCustomersRequest>({ page: 1, page_size: 20 });
  const [searchName, setSearchName] = useState('');
  const [searchMobile, setSearchMobile] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<CreateCustomerRequest>({ name: '', mobile_number: '' });

  const customersQuery = useCustomersQuery(filters);
  const topCustomersQuery = useTopCustomersQuery({ metric: 'revenue', limit: 5 });
  const analyticsQuery = useCustomerAnalyticsQuery();
  const createMutation = useCreateCustomerMutation();

  const handleSearch = () => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      name: searchName || undefined,
      mobile: searchMobile || undefined,
    }));
  };

  const handleCreate = () => {
    if (!createForm.name || !createForm.mobile_number) return;
    createMutation.mutate(createForm, {
      onSuccess: () => {
        setShowCreateForm(false);
        setCreateForm({ name: '', mobile_number: '' });
      },
    });
  };

  if (customersQuery.isError) {
    return <ErrorState error={normalizeApiError(customersQuery.error)} onRetry={() => void customersQuery.refetch()} />;
  }

  const customers = customersQuery.data?.data ?? (Array.isArray(customersQuery.data) ? customersQuery.data as unknown[] : []);
  const analytics = analyticsQuery.data;
  const topCustomers = topCustomersQuery.data ?? [];

  return (
    <PageFrame title="Customers" subtitle="Manage your customer relationships and track purchase behaviour.">
      {/* Analytics summary cards */}
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

      {/* Top customers */}
      {topCustomers.length > 0 && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Top Customers by Revenue</CardTitle></CardHeader>
          <CardContent>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {topCustomers.map((c, i) => (
                <div key={c.customer_id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => navigate(`/customers/${c.customer_id}`)}>
                  <Badge variant={i === 0 ? 'default' : 'secondary'}>#{i + 1}</Badge>
                  <span><strong>{c.name}</strong> — {c.mobile_number}</span>
                  <span className="muted">₹{c.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and actions */}
      <div className="button-row" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <Input placeholder="Search by name" value={searchName} onChange={(e) => setSearchName(e.target.value)} style={{ maxWidth: 200 }} />
        <Input placeholder="Search by mobile" value={searchMobile} onChange={(e) => setSearchMobile(e.target.value)} style={{ maxWidth: 200 }} />
        <Button onClick={handleSearch}>Search</Button>
        <Button variant="secondary" onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : '+ New Customer'}
        </Button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Create Customer</CardTitle></CardHeader>
          <CardContent>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <Input placeholder="Name *" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
              <Input placeholder="Mobile Number *" value={createForm.mobile_number} onChange={(e) => setCreateForm({ ...createForm, mobile_number: e.target.value })} />
              <Input placeholder="Email" value={createForm.email ?? ''} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value || null })} />
              <Input placeholder="Address" value={createForm.address ?? ''} onChange={(e) => setCreateForm({ ...createForm, address: e.target.value || null })} />
              <select value={createForm.gender ?? ''} onChange={(e) => setCreateForm({ ...createForm, gender: e.target.value || null })} className="input">
                <option value="">Gender</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
              <Input type="date" placeholder="Birth Date" value={createForm.birth_date ?? ''} onChange={(e) => setCreateForm({ ...createForm, birth_date: e.target.value || null })} />
            </div>
            <div className="button-row" style={{ marginTop: '1rem' }}>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Customer'}
              </Button>
            </div>
            {createMutation.isError && <p className="text-danger" style={{ marginTop: '0.5rem' }}>{normalizeApiError(createMutation.error).message}</p>}
          </CardContent>
        </Card>
      )}

      {/* Customer list */}
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
          data={customers as Customer[]}
        />
      )}

      {/* Pagination */}
      <div className="button-row" style={{ marginTop: '1rem', justifyContent: 'center' }}>
        <Button variant="ghost" disabled={(filters.page ?? 1) <= 1} onClick={() => setFilters((p) => ({ ...p, page: (p.page ?? 1) - 1 }))}>← Previous</Button>
        <span className="muted">Page {filters.page ?? 1}</span>
        <Button variant="ghost" onClick={() => setFilters((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}>Next →</Button>
      </div>
    </PageFrame>
  );
}
