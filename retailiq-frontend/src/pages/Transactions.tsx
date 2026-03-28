import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { DailySummaryCard } from '@/components/shared/DailySummaryCard';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useCustomerQuery, useCustomersQuery } from '@/hooks/customers';
import { useDailySummaryQuery, useTransactionQuery, useTransactionsQuery } from '@/hooks/transactions';
import { formatDisplayDateTime } from '@/utils/dates';
import { normalizeApiError } from '@/utils/errors';

const today = new Date().toISOString().slice(0, 10);

function TransactionItemsCell({ transactionId }: { transactionId: string }) {
  const query = useTransactionQuery(transactionId);
  if (query.isLoading) {
    return <span className="muted">Loading...</span>;
  }
  const count = query.data?.line_items?.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0) ?? 0;
  return <span>{count}</span>;
}

function TransactionAmountCell({ transactionId }: { transactionId: string }) {
  const query = useTransactionQuery(transactionId);
  if (query.isLoading) {
    return <span className="muted">Loading...</span>;
  }
  const total = query.data?.line_items?.reduce(
    (sum, item) => sum + (Number(item.quantity ?? 0) * Number(item.selling_price ?? 0)) - Number(item.discount_amount ?? 0),
    0,
  ) ?? 0;
  return <span>₹{total.toFixed(2)}</span>;
}

function TransactionCustomerCell({ customerId }: { customerId: number | null }) {
  const query = useCustomerQuery(customerId ?? 0);
  if (!customerId) {
    return <span>Guest</span>;
  }
  if (query.isLoading) {
    return <span className="muted">Loading...</span>;
  }
  if (!query.data) {
    return <span>Customer #{customerId}</span>;
  }
  return (
    <div>
      <div>{query.data.name}</div>
      <div className="muted" style={{ fontSize: '0.8rem' }}>{query.data.mobile_number}</div>
    </div>
  );
}

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  const customersQuery = useCustomersQuery({ page_size: 100 });
  const dailySummaryQuery = useDailySummaryQuery({ date: today });
  const transactionQuery = useTransactionsQuery({
    page,
    page_size: pageSize,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    payment_mode: (paymentMode || undefined) as 'CASH' | 'UPI' | 'CARD' | 'CREDIT' | undefined,
    customer_id: selectedCustomerId ?? undefined,
  });

  const customers = customersQuery.data?.data ?? [];

  const matchedCustomer = useMemo(() => {
    if (!customerSearch.trim()) {
      return null;
    }

    return customers.find((customer) => `${customer.customer_id} ${customer.name} ${customer.mobile_number}`.toLowerCase().includes(customerSearch.trim().toLowerCase())) ?? null;
  }, [customerSearch, customers]);

  const rows = transactionQuery.data?.data ?? [];
  const totalPages = Math.max(1, Math.ceil((transactionQuery.data?.total ?? 0) / (transactionQuery.data?.page_size ?? pageSize)));

  if (transactionQuery.isError) {
    return <ErrorState error={normalizeApiError(transactionQuery.error)} onRetry={() => void transactionQuery.refetch()} />;
  }

  if (transactionQuery.isLoading) {
    return (
      <PageFrame title="Transactions" subtitle="Review sales history and returns.">
        <SkeletonLoader variant="rect" height={120} />
        <SkeletonLoader variant="rect" height={420} />
      </PageFrame>
    );
  }

  return (
    <PageFrame
      title="Transactions"
      subtitle="Review sales history and returns."
      actions={(
        <div className="button-row">
          <button className="button button--secondary" type="button" onClick={() => {
            setDateFrom('');
            setDateTo('');
            setPaymentMode('');
            setCustomerSearch('');
            setSelectedCustomerId(null);
            setPage(1);
          }}>
            Clear filters
          </button>
          <label className="field" style={{ minWidth: 160 }}>
            <span>Page size</span>
            <select className="select" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
          </label>
        </div>
      )}
    >
      <DailySummaryCard
        dateLabel={`Today · ${today}`}
        summary={dailySummaryQuery.data}
        isLoading={dailySummaryQuery.isLoading}
      />

      <section className="card">
        <div className="card__header">
          <strong>Filters</strong>
        </div>
        <div className="card__body grid grid--2">
          <label className="field">
            <span>Date from</span>
            <input className="input" type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPage(1); }} />
          </label>
          <label className="field">
            <span>Date to</span>
            <input className="input" type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setPage(1); }} />
          </label>
          <label className="field">
            <span>Payment mode</span>
            <select className="select" value={paymentMode} onChange={(event) => { setPaymentMode(event.target.value); setPage(1); }}>
              <option value="">All modes</option>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="CREDIT">Credit</option>
            </select>
          </label>
          <label className="field">
            <span>Customer</span>
            <input
              className="input"
              value={customerSearch}
              onChange={(event) => {
                setCustomerSearch(event.target.value);
                const match = customers.find((customer) => `${customer.customer_id} ${customer.name} ${customer.mobile_number}`.toLowerCase().includes(event.target.value.trim().toLowerCase()));
                setSelectedCustomerId(match?.customer_id ?? null);
                setPage(1);
              }}
              placeholder="Search by name, mobile, or ID"
              list="transaction-customer-options"
            />
            <datalist id="transaction-customer-options">
              {customers.map((customer) => (
                <option key={customer.customer_id} value={`${customer.customer_id} ${customer.name} ${customer.mobile_number}`} />
              ))}
            </datalist>
          </label>
        </div>
      </section>

      {matchedCustomer ? (
        <div className="muted" style={{ marginBottom: '0.75rem' }}>
          Filtering by {matchedCustomer.name} · {matchedCustomer.mobile_number}
        </div>
      ) : null}

      {rows.length ? (
        <DataTable
          columns={[
            { key: 'created', header: 'Date/Time', render: (row) => formatDisplayDateTime(row.created_at) },
            { key: 'id', header: 'Transaction ID', render: (row) => <Link to={`/orders/transactions/${row.transaction_id}`}>{row.transaction_id}</Link> },
            { key: 'customer', header: 'Customer', render: (row) => <TransactionCustomerCell customerId={row.customer_id} /> },
            { key: 'items', header: 'Items', render: (row) => <TransactionItemsCell transactionId={row.transaction_id} /> },
            { key: 'mode', header: 'Payment mode', render: (row) => row.payment_mode },
            { key: 'amount', header: 'Amount', render: (row) => <TransactionAmountCell transactionId={row.transaction_id} /> },
            { key: 'status', header: 'Status', render: (row) => (row.is_return ? 'Returned' : 'Completed') },
            { key: 'actions', header: 'Actions', render: (row) => <Link className="button button--secondary" to={`/orders/transactions/${row.transaction_id}`}>View</Link> },
          ]}
          data={rows}
        />
      ) : (
        <EmptyState title="No transactions found" body="Use the POS screen to create the first transaction." />
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </PageFrame>
  );
}
