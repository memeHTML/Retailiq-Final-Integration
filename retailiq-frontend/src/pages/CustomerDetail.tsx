import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  useCustomerQuery,
  useCustomerSummaryQuery,
  useCustomerTransactionsQuery,
  useUpdateCustomerMutation,
} from '@/hooks/customers';
import type { CustomerTransactionsRequest } from '@/types/api';

type ActiveTab = 'overview' | 'transactions' | 'loyalty' | 'credit' | 'whatsapp';

type TransactionRow = {
  transaction_id: string;
  created_at: string;
  payment_mode: string;
  notes: string | null;
  amount?: number | null;
  status?: string | null;
  items_count?: number | null;
  items?: Array<unknown> | null;
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
}

export default function CustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const id = customerId ?? '';

  const customerQuery = useCustomerQuery(id);
  const summaryQuery = useCustomerSummaryQuery(id);
  const [transactionPage, setTransactionPage] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  const transactionParams = useMemo(() => {
    const params: CustomerTransactionsRequest = {
      page: transactionPage,
      page_size: 20,
    };
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    return params;
  }, [dateFrom, dateTo, transactionPage]);

  const recentTransactionsQuery = useCustomerTransactionsQuery(id, { page: 1, page_size: 5 });
  const txnQuery = useCustomerTransactionsQuery(id, transactionParams);
  const updateMutation = useUpdateCustomerMutation();

  const customer = customerQuery.data;
  const summary = summaryQuery.data;
  const recentTransactions = (recentTransactionsQuery.data?.data ?? []) as TransactionRow[];
  const transactions = (txnQuery.data?.data ?? []) as TransactionRow[];
  const txnMeta = txnQuery.data?.meta;
  const txnTotal = txnMeta?.total ?? transactions.length;
  const txnPageSize = txnMeta?.page_size ?? 20;
  const txnTotalPages = Math.max(1, Math.ceil(txnTotal / txnPageSize));

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
    setEditOpen(true);
  };

  const memberSince = formatDate(customer.created_at);
  const initials = getInitials(customer.name);

  return (
    <PageFrame
      title={customer.name}
      subtitle={`Mobile: ${customer.mobile_number}`}
      actions={<Badge variant="secondary">Member since {memberSince}</Badge>}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => navigate('/customers')}>← Back to Customers</Button>
        {!editOpen && activeTab === 'overview' ? (
          <Button variant="secondary" onClick={startEdit}>Edit Customer</Button>
        ) : null}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button variant={activeTab === 'overview' ? 'primary' : 'ghost'} onClick={() => setActiveTab('overview')}>Overview</Button>
        <Button variant={activeTab === 'transactions' ? 'primary' : 'ghost'} onClick={() => setActiveTab('transactions')}>Transactions</Button>
        <Button variant={activeTab === 'loyalty' ? 'primary' : 'ghost'} onClick={() => setActiveTab('loyalty')}>Loyalty</Button>
        <Button variant={activeTab === 'credit' ? 'primary' : 'ghost'} onClick={() => setActiveTab('credit')}>Credit</Button>
        <Button variant={activeTab === 'whatsapp' ? 'primary' : 'ghost'} onClick={() => setActiveTab('whatsapp')}>WhatsApp</Button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-lg font-semibold text-white">
                    {initials || 'C'}
                  </div>
                  <div>
                    <CardTitle>{customer.name}</CardTitle>
                    <div className="text-sm text-gray-500">Mobile: {customer.mobile_number}</div>
                    <div className="text-sm text-gray-500">Email: {customer.email ?? '—'}</div>
                  </div>
                </div>
                {!editOpen && <Button variant="secondary" onClick={startEdit}>Edit</Button>}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-lg border border-gray-200 p-4">
                  <span className="text-xs uppercase tracking-wide text-gray-500">Name</span>
                  <div className="mt-1 font-medium">{customer.name}</div>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <span className="text-xs uppercase tracking-wide text-gray-500">Mobile</span>
                  <div className="mt-1 font-medium">{customer.mobile_number}</div>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <span className="text-xs uppercase tracking-wide text-gray-500">Email</span>
                  <div className="mt-1 font-medium">{customer.email ?? '—'}</div>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <span className="text-xs uppercase tracking-wide text-gray-500">Gender</span>
                  <div className="mt-1 font-medium">{customer.gender ?? '—'}</div>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <span className="text-xs uppercase tracking-wide text-gray-500">Birth Date</span>
                  <div className="mt-1 font-medium">{formatDate(customer.birth_date)}</div>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <span className="text-xs uppercase tracking-wide text-gray-500">Address</span>
                  <div className="mt-1 font-medium">{customer.address ?? '—'}</div>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <span className="text-xs uppercase tracking-wide text-gray-500">Notes</span>
                  <div className="mt-1 font-medium">{customer.notes ?? '—'}</div>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <span className="text-xs uppercase tracking-wide text-gray-500">Member Since</span>
                  <div className="mt-1 font-medium">{memberSince}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader><CardTitle>Total Spent</CardTitle></CardHeader>
              <CardContent><h2 style={{ marginBottom: 0 }}>₹{summary?.total_spent?.toLocaleString() ?? '0'}</h2></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Total Transactions</CardTitle></CardHeader>
              <CardContent><h2 style={{ marginBottom: 0 }}>{summary?.total_transactions ?? 0}</h2></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Avg Basket Size</CardTitle></CardHeader>
              <CardContent><h2 style={{ marginBottom: 0 }}>₹{summary?.avg_basket_size?.toLocaleString() ?? '0'}</h2></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Last Visit</CardTitle></CardHeader>
              <CardContent><h2 style={{ marginBottom: 0 }}>{formatDate(summary?.last_visit)}</h2></CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Top Categories</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {summary?.top_categories?.length ? (
                  summary.top_categories.map((item) => {
                    const width = Math.max(8, Math.min(100, Number(item.amount ?? 0)));
                    return (
                      <div key={item.category} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{item.category}</span>
                          <span className="text-gray-500">₹{Number(item.amount ?? 0).toLocaleString()}</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100">
                          <div className="h-2 rounded-full bg-blue-600" style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <EmptyState title="No category data" body="This customer does not have category-level spend data yet." />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
              <CardContent>
                {recentTransactionsQuery.isLoading ? (
                  <SkeletonLoader variant="rect" height={200} />
                ) : recentTransactions.length === 0 ? (
                  <EmptyState title="No transactions" body="This customer has no recent transactions." />
                ) : (
                  <DataTable<TransactionRow>
                    columns={[
                      { key: 'transaction_id', header: 'Transaction ID', render: (row) => row.transaction_id },
                      { key: 'created_at', header: 'Date', render: (row) => new Date(row.created_at).toLocaleString() },
                      { key: 'payment_mode', header: 'Payment Mode', render: (row) => row.payment_mode },
                      { key: 'notes', header: 'Notes', render: (row) => row.notes ?? '—' },
                    ]}
                    data={recentTransactions}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <CardTitle>Transaction History</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => {
                    setTransactionPage(1);
                    setDateFrom(event.target.value);
                  }}
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(event) => {
                    setTransactionPage(1);
                    setDateTo(event.target.value);
                  }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {txnQuery.isLoading ? (
              <SkeletonLoader variant="rect" height={240} />
            ) : transactions.length === 0 ? (
              <EmptyState title="No transactions" body="This customer has no recorded transactions for the selected period." />
            ) : (
              <DataTable<TransactionRow>
                columns={[
                  { key: 'created_at', header: 'Date', render: (row) => new Date(row.created_at).toLocaleString() },
                  { key: 'transaction_id', header: 'Transaction ID', render: (row) => row.transaction_id },
                  { key: 'items_count', header: 'Items Count', render: (row) => Number(row.items_count ?? row.items?.length ?? 0).toLocaleString() },
                  { key: 'amount', header: 'Amount', render: (row) => `₹${Number(row.amount ?? 0).toLocaleString()}` },
                  { key: 'payment_mode', header: 'Payment Mode', render: (row) => row.payment_mode },
                  { key: 'status', header: 'Status', render: (row) => row.status ?? 'Completed' },
                ]}
                data={transactions}
              />
            )}

            <div className="button-row" style={{ justifyContent: 'center' }}>
              <Button variant="ghost" disabled={transactionPage <= 1} onClick={() => setTransactionPage((value) => Math.max(1, value - 1))}>
                ← Previous
              </Button>
              <span className="muted">Page {transactionPage} of {txnTotalPages}</span>
              <Button variant="ghost" disabled={transactionPage >= txnTotalPages} onClick={() => setTransactionPage((value) => value + 1)}>
                Next →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'loyalty' && (
        <Card>
          <CardHeader><CardTitle>Loyalty</CardTitle></CardHeader>
          <CardContent>
            <EmptyState title="Coming Soon" body="Loyalty management for customer detail will be delivered by Branch B." />
          </CardContent>
        </Card>
      )}

      {activeTab === 'credit' && (
        <Card>
          <CardHeader><CardTitle>Credit</CardTitle></CardHeader>
          <CardContent>
            <EmptyState title="Coming Soon" body="Credit details and repayment controls will be delivered by Branch B." />
          </CardContent>
        </Card>
      )}

      {activeTab === 'whatsapp' && (
        <Card>
          <CardHeader><CardTitle>WhatsApp</CardTitle></CardHeader>
          <CardContent>
            <EmptyState title="Coming Soon" body="WhatsApp contact and outreach tools will be delivered by Branch B." />
          </CardContent>
        </Card>
      )}

      <CustomerForm
        open={editOpen}
        mode="edit"
        customer={customer}
        isSubmitting={updateMutation.isPending}
        onClose={() => setEditOpen(false)}
        onSubmit={async (payload) => {
          await updateMutation.mutateAsync({ customerId: id, data: payload });
        }}
      />
    </PageFrame>
  );
}
