/**
 * src/pages/TransactionDetail.tsx
 * Oracle Document sections consumed: 3, 7, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageFrame } from '@/components/layout/PageFrame';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { transactionReturnSchema, type TransactionReturnFormValues } from '@/types/schemas';
import { useCreateTransactionReturnMutation, useTransactionQuery } from '@/hooks/transactions';
import { normalizeApiError } from '@/utils/errors';
import { extractFieldErrors } from '@/utils/errors';
import { uiStore } from '@/stores/uiStore';

export default function TransactionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addToast = uiStore.getState().addToast;
  const query = useTransactionQuery(id ?? '');
  const returnMutation = useCreateTransactionReturnMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { handleSubmit, setError, formState: { isSubmitting } } = useForm<TransactionReturnFormValues>({
    resolver: zodResolver(transactionReturnSchema),
    defaultValues: { items: [{ product_id: 0, quantity_returned: 1, reason: '' }] },
  });

  const canReturn = useMemo(() => Boolean(query.data && !query.data.is_return), [query.data]);

  if (query.isError) {
    return <ErrorState error={normalizeApiError(query.error)} onRetry={() => void query.refetch()} />;
  }

  if (query.isLoading) {
    return (
      <PageFrame title="Transaction detail" subtitle="View the full receipt and line items.">
        <SkeletonLoader variant="rect" height={260} />
      </PageFrame>
    );
  }

  if (!query.data) {
    return <EmptyState title="Transaction not found" body="The requested transaction is unavailable." action={{ label: 'Back to transactions', onClick: () => navigate('/transactions') }} />;
  }

  const transaction = query.data;

  const onSubmit = handleSubmit(async (values: TransactionReturnFormValues) => {
    try {
      await returnMutation.mutateAsync({ transactionId: transaction.transaction_id, payload: values });
      addToast({ title: 'Return created', message: 'The return transaction was submitted.', variant: 'success' });
      setConfirmOpen(false);
      void query.refetch();
    } catch (error) {
      const apiError = normalizeApiError(error);
      if (apiError.status === 422) {
        extractFieldErrors(apiError.fields, setError);
        return;
      }
      addToast({ title: 'Return failed', message: apiError.message, variant: 'error' });
    }
  });

  return (
    <PageFrame title={`Transaction ${transaction.transaction_id}`} subtitle={transaction.notes ?? 'Transaction detail and return workflow.'} actions={<button className="button button--secondary" type="button" onClick={() => navigate('/transactions')}>Back</button>}>
      <section className="card">
        <div className="card__body stack">
          <div><strong>Mode:</strong> {transaction.payment_mode}</div>
          <div><strong>Customer:</strong> {transaction.customer_id ?? '—'}</div>
          <div><strong>Return:</strong> {transaction.is_return ? 'Yes' : 'No'}</div>
          <div><strong>Original transaction:</strong> {transaction.original_transaction_id ?? '—'}</div>
        </div>
      </section>

      {transaction.line_items.length ? (
        <section className="card">
          <div className="card__header"><strong>Line items</strong></div>
          <div className="card__body stack">
            {transaction.line_items.map((item, index) => (
              <div key={`${item.product_id}-${index}`} className="card" style={{ padding: '1rem' }}>
                <strong>Product {item.product_id}</strong>
                <div className="muted">Quantity: {item.quantity}</div>
                <div className="muted">Price: {item.selling_price}</div>
                {item.discount_amount ? <div className="muted">Discount: {item.discount_amount}</div> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {canReturn ? (
        <>
          <button className="button button--danger" type="button" onClick={() => setConfirmOpen(true)}>
            Create return
          </button>
          <ConfirmDialog
            open={confirmOpen}
            title="Create return?"
            body="This will create a return transaction and update inventory. This cannot be undone."
            confirmLabel={isSubmitting || returnMutation.isPending ? 'Submitting…' : 'Confirm return'}
            destructive
            requireTypedConfirmation="RETURN"
            onConfirm={onSubmit}
            onCancel={() => setConfirmOpen(false)}
          />
        </>
      ) : null}
    </PageFrame>
  );
}
