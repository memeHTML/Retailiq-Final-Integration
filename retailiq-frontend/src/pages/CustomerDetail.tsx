import { Suspense, lazy, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { normalizeApiError } from '@/utils/errors';
import {
  useCustomerQuery,
  useCustomerSummaryQuery,
  useCustomerTransactionsQuery,
  useUpdateCustomerMutation,
} from '@/hooks/customers';
import type { UpdateCustomerRequest } from '@/types/api';

const CustomerLoyaltyTab = lazy(() =>
  import('@/features/loyalty/CustomerLoyaltyTab')
    .then((module) => ({ default: module.CustomerLoyaltyTab }))
    .catch(() => ({ default: () => <BranchBTabFallback label="Loyalty" /> })),
);
const CustomerCreditTab = lazy(() =>
  import('@/features/credit/CustomerCreditTab')
    .then((module) => ({ default: module.CustomerCreditTab }))
    .catch(() => ({ default: () => <BranchBTabFallback label="Credit" /> })),
);
const CustomerWhatsAppTab = lazy(() =>
  import('@/features/whatsapp/CustomerWhatsAppTab')
    .then((module) => ({ default: module.CustomerWhatsAppTab }))
    .catch(() => ({ default: () => <BranchBTabFallback label="WhatsApp" /> })),
);

interface TxnRow {
  transaction_id: string;
  created_at: string;
  payment_mode: string;
  notes: string | null;
}

function BranchBTabFallback({ label }: { label: string }) {
  return <EmptyState title={`${label} tab unavailable`} body={`${label} data is loading or temporarily unavailable.`} />;
}

export default function CustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const id = customerId ?? '';

  const customerQuery = useCustomerQuery(id);
  const summaryQuery = useCustomerSummaryQuery(id);
  const txnQuery = useCustomerTransactionsQuery(id);
  const updateMutation = useUpdateCustomerMutation();

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<UpdateCustomerRequest>({});
  const [activeTab, setActiveTab] = useState<'profile' | 'transactions' | 'summary' | 'loyalty' | 'credit' | 'whatsapp'>('profile');

  const customer = customerQuery.data;
  const summary = summaryQuery.data;
  const transactions = txnQuery.data?.data ?? (Array.isArray(txnQuery.data) ? txnQuery.data : []) as TxnRow[];

  if (customerQuery.isError) {
    return <ErrorState error={normalizeApiError(customerQuery.error)} onRetry={() => void customerQuery.refetch()} />;
  }

  if (customerQuery.isLoading) {
    return (
      <PageFrame title="Customer Detail" subtitle="Loading...">
        <SkeletonLoader variant="rect" height={400} />
      </PageFrame>
    );
  }

  if (!customer) {
    return <EmptyState title="Customer not found" body="The requested customer does not exist." />;
  }

  const startEdit = () => {
    setEditForm({
      name: customer.name,
      mobile_number: customer.mobile_number,
      email: customer.email,
      gender: customer.gender,
      birth_date: customer.birth_date,
      address: customer.address,
      notes: customer.notes,
    });
    setEditing(true);
  };

  const saveEdit = () => {
    updateMutation.mutate({ customerId: id, data: editForm }, {
      onSuccess: () => setEditing(false),
    });
  };

  return (
    <PageFrame title={customer.name} subtitle={`Mobile: ${customer.mobile_number}`}>
      <Button variant="ghost" onClick={() => navigate('/customers')} className="mb-4">← Back to Customers</Button>

      {/* Tabs */}
      <div className="button-row" style={{ marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Button variant={activeTab === 'profile' ? 'primary' : 'ghost'} onClick={() => setActiveTab('profile')}>Profile</Button>
        <Button variant={activeTab === 'transactions' ? 'primary' : 'ghost'} onClick={() => setActiveTab('transactions')}>Transactions</Button>
        <Button variant={activeTab === 'summary' ? 'primary' : 'ghost'} onClick={() => setActiveTab('summary')}>Summary</Button>
        <Button variant={activeTab === 'loyalty' ? 'primary' : 'ghost'} onClick={() => setActiveTab('loyalty')}>Loyalty</Button>
        <Button variant={activeTab === 'credit' ? 'primary' : 'ghost'} onClick={() => setActiveTab('credit')}>Credit</Button>
        <Button variant={activeTab === 'whatsapp' ? 'primary' : 'ghost'} onClick={() => setActiveTab('whatsapp')}>WhatsApp</Button>
      </div>

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <CardTitle>Customer Profile</CardTitle>
              {!editing && <Button variant="secondary" onClick={startEdit}>Edit</Button>}
            </div>
          </CardHeader>
          <CardContent>
            {editing ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                <Input placeholder="Name" value={editForm.name ?? ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                <Input placeholder="Mobile" value={editForm.mobile_number ?? ''} onChange={(e) => setEditForm({ ...editForm, mobile_number: e.target.value })} />
                <Input placeholder="Email" value={editForm.email ?? ''} onChange={(e) => setEditForm({ ...editForm, email: e.target.value || null })} />
                <Input placeholder="Address" value={editForm.address ?? ''} onChange={(e) => setEditForm({ ...editForm, address: e.target.value || null })} />
                <select value={editForm.gender ?? ''} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value || null })} className="input">
                  <option value="">Gender</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
                <Input type="date" value={editForm.birth_date ?? ''} onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value || null })} />
                <div className="button-row" style={{ gridColumn: '1 / -1' }}>
                  <Button onClick={saveEdit} disabled={updateMutation.isPending}>{updateMutation.isPending ? 'Saving...' : 'Save'}</Button>
                  <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
                {updateMutation.isError && <p className="text-danger">{normalizeApiError(updateMutation.error).message}</p>}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><span className="muted">Name</span><div>{customer.name}</div></div>
                <div><span className="muted">Mobile</span><div>{customer.mobile_number}</div></div>
                <div><span className="muted">Email</span><div>{customer.email ?? '—'}</div></div>
                <div><span className="muted">Gender</span><div>{customer.gender ?? '—'}</div></div>
                <div><span className="muted">Birth Date</span><div>{customer.birth_date ?? '—'}</div></div>
                <div><span className="muted">Address</span><div>{customer.address ?? '—'}</div></div>
                <div><span className="muted">Notes</span><div>{customer.notes ?? '—'}</div></div>
                <div><span className="muted">Created</span><div>{customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '—'}</div></div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transactions tab */}
      {activeTab === 'transactions' && (
        <Card>
          <CardHeader><CardTitle>Transaction History</CardTitle></CardHeader>
          <CardContent>
            {txnQuery.isLoading ? <SkeletonLoader variant="rect" height={200} /> : (transactions as TxnRow[]).length === 0 ? (
              <EmptyState title="No transactions" body="This customer has no recorded transactions." />
            ) : (
              <DataTable<TxnRow>
                columns={[
                  { key: 'id', header: 'Transaction ID', render: (row: TxnRow) => row.transaction_id },
                  { key: 'date', header: 'Date', render: (row: TxnRow) => new Date(row.created_at).toLocaleString() },
                  { key: 'mode', header: 'Payment Mode', render: (row: TxnRow) => row.payment_mode },
                  { key: 'notes', header: 'Notes', render: (row: TxnRow) => row.notes ?? '—' },
                ]}
                data={transactions as TxnRow[]}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary tab */}
      {activeTab === 'summary' && (
        <div>
          {summaryQuery.isLoading ? <SkeletonLoader variant="rect" height={200} /> : summary ? (
            <div className="grid grid--3">
              <Card>
                <CardHeader><CardTitle>Total Spent</CardTitle></CardHeader>
                <CardContent><h2 style={{ marginBottom: 0 }}>₹{summary.total_spent.toLocaleString()}</h2></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Total Transactions</CardTitle></CardHeader>
                <CardContent><h2 style={{ marginBottom: 0 }}>{summary.total_transactions}</h2></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Avg Basket Size</CardTitle></CardHeader>
                <CardContent><h2 style={{ marginBottom: 0 }}>₹{summary.avg_basket_size.toLocaleString()}</h2></CardContent>
              </Card>
            </div>
          ) : (
            <EmptyState title="No summary data" body="Summary data is not available for this customer yet." />
          )}
        </div>
      )}

      {activeTab === 'loyalty' && (
        <Suspense fallback={<BranchBTabFallback label="Loyalty" />}>
          <CustomerLoyaltyTab customerId={id} />
        </Suspense>
      )}

      {activeTab === 'credit' && (
        <Suspense fallback={<BranchBTabFallback label="Credit" />}>
          <CustomerCreditTab customerId={id} />
        </Suspense>
      )}

      {activeTab === 'whatsapp' && (
        <Suspense fallback={<BranchBTabFallback label="WhatsApp" />}>
          <CustomerWhatsAppTab phoneNumber={customer?.mobile_number ?? ''} />
        </Suspense>
      )}
    </PageFrame>
  );
}
