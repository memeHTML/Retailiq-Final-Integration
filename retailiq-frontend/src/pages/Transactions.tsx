/**
 * src/pages/Transactions.tsx
 * Oracle Document sections consumed: 3, 5, 7, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useTransactionsQuery } from '@/hooks/transactions';
import { normalizeApiError } from '@/utils/errors';

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const query = useTransactionsQuery({ page, page_size: pageSize });

  if (query.isError) {
    return <ErrorState error={normalizeApiError(query.error)} onRetry={() => void query.refetch()} />;
  }

  if (query.isLoading) {
    return (
      <PageFrame title="Transactions" subtitle="Review sales history and returns.">
        <SkeletonLoader variant="rect" height={64} />
        <SkeletonLoader variant="rect" height={420} />
      </PageFrame>
    );
  }

  const rows = query.data?.data ?? [];
  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / (query.data?.page_size ?? pageSize)));

  return (
    <PageFrame
      title="Transactions"
      subtitle="Review sales history and returns."
      actions={(
        <label className="field" style={{ minWidth: 160 }}>
          <span>Page size</span>
          <select className="select" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
          </select>
        </label>
      )}
    >
      {rows.length ? (
        <DataTable
          columns={[
            { key: 'id', header: 'Transaction', render: (row) => <Link to={`/transactions/${row.transaction_id}`}>{row.transaction_id}</Link> },
            { key: 'created', header: 'Created', render: (row) => row.created_at },
            { key: 'mode', header: 'Mode', render: (row) => row.payment_mode },
            { key: 'customer', header: 'Customer', render: (row) => row.customer_id ?? '—' },
            { key: 'return', header: 'Return', render: (row) => (row.is_return ? 'Yes' : 'No') },
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
