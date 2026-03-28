import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageFrame } from '@/components/layout/PageFrame';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useCreateTransactionReturnMutation, useTransactionQuery } from '@/hooks/transactions';
import { useCustomerQuery } from '@/hooks/customers';
import { normalizeApiError } from '@/utils/errors';
import { formatDisplayDateTime } from '@/utils/dates';
import { uiStore } from '@/stores/uiStore';
import { routes } from '@/routes/routes';

type ReturnSelection = {
  product_id: number;
  quantity_returned: number;
  selected: boolean;
};

const roundMoney = (value: number) => Math.round(value * 100) / 100;

export default function TransactionDetailPage() {
  const { uuid, id } = useParams();
  const navigate = useNavigate();
  const addToast = uiStore((state) => state.addToast);
  const transactionId = uuid ?? id ?? '';
  const query = useTransactionQuery(transactionId);
  const returnMutation = useCreateTransactionReturnMutation();
  const [returnOpen, setReturnOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [selections, setSelections] = useState<ReturnSelection[]>([]);

  const customerQuery = useCustomerQuery(query.data?.customer_id ?? 0);

  useEffect(() => {
    if (!returnOpen || !query.data) {
      return;
    }

    setSelections(
      query.data.line_items.map((item) => ({
        product_id: item.product_id,
        quantity_returned: Math.max(1, Number(item.quantity ?? 1)),
        selected: false,
      })),
    );
    setReason('');
  }, [query.data, returnOpen]);

  const summary = useMemo(() => {
    const items = query.data?.line_items ?? [];
    const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity ?? 0) * Number(item.selling_price ?? 0)), 0);
    const discount = items.reduce((sum, item) => sum + Number(item.discount_amount ?? 0), 0);
    return {
      subtotal: roundMoney(subtotal),
      discount: roundMoney(discount),
      total: roundMoney(Math.max(0, subtotal - discount)),
    };
  }, [query.data]);

  const returnSummary = useMemo(() => {
    const items = query.data?.line_items ?? [];
    const selectedItems = selections.filter((item) => item.selected && item.quantity_returned > 0);
    const total = selectedItems.reduce((sum, selection) => {
      const source = items.find((item) => item.product_id === selection.product_id);
      if (!source) {
        return sum;
      }

      const lineGross = Number(source.quantity ?? 0) * Number(source.selling_price ?? 0);
      const discountShare = Number(source.quantity ?? 0) > 0
        ? Number(source.discount_amount ?? 0) * (selection.quantity_returned / Number(source.quantity ?? 1))
        : 0;
      return sum + Math.max(0, (selection.quantity_returned * Number(source.selling_price ?? 0)) - discountShare);
    }, 0);

    return roundMoney(total);
  }, [query.data, selections]);

  if (query.isError) {
    return <ErrorState error={normalizeApiError(query.error)} onRetry={() => void query.refetch()} />;
  }

  if (query.isLoading) {
    return (
      <PageFrame title="Transaction detail" subtitle="View the receipt, items, and return workflow.">
        <SkeletonLoader variant="rect" height={300} />
      </PageFrame>
    );
  }

  if (!query.data) {
      return <EmptyState title="Transaction not found" body="The requested transaction is unavailable." action={{ label: 'Back to transactions', onClick: () => navigate(routes.ordersTransactions) }} />;
  }

  const transaction = query.data;
  const canReturn = !transaction.is_return;
  const customer = customerQuery.data;

  const openReturn = () => {
    setSelections(
      transaction.line_items.map((item) => ({
        product_id: item.product_id,
        quantity_returned: Math.max(1, Number(item.quantity ?? 1)),
        selected: false,
      })),
    );
    setReason('');
    setReturnOpen(true);
  };

  const submitReturn = async () => {
    const items = selections
      .filter((item) => item.selected && item.quantity_returned > 0)
      .map((item) => ({
        product_id: item.product_id,
        quantity_returned: item.quantity_returned,
        reason: reason || undefined,
      }));

    if (!items.length) {
      addToast({ title: 'Select return items', message: 'Choose at least one item to return.', variant: 'error' });
      return;
    }

    try {
      await returnMutation.mutateAsync({ transactionId: transaction.transaction_id, payload: { items } });
      addToast({ title: 'Return processed', message: 'Return processed successfully.', variant: 'success' });
      setReturnOpen(false);
      void query.refetch();
    } catch (error) {
      const apiError = normalizeApiError(error);
      addToast({ title: 'Return failed', message: apiError.message, variant: 'error' });
    }
  };

  return (
    <PageFrame
      title={`Transaction ${transaction.transaction_id}`}
      subtitle={transaction.notes ?? 'Transaction detail and return workflow.'}
      actions={(
        <div className="button-row">
          <button className="button button--secondary" type="button" onClick={() => navigate(routes.ordersTransactions)}>
            Back
          </button>
          {canReturn ? (
            <button className="button button--danger" type="button" onClick={openReturn}>
              Process return
            </button>
          ) : null}
        </div>
      )}
    >
      <div className="grid grid--2" style={{ alignItems: 'start' }}>
        <section className="card">
          <div className="card__header">
            <strong>Transaction summary</strong>
          </div>
          <div className="card__body stack">
            <div><strong>Date:</strong> {formatDisplayDateTime(transaction.created_at)}</div>
            <div><strong>Status:</strong> {transaction.is_return ? 'Returned' : 'Completed'}</div>
            <div><strong>Payment mode:</strong> {transaction.payment_mode}</div>
            <div><strong>Transaction ID:</strong> {transaction.transaction_id}</div>
            <div><strong>Original transaction:</strong> {transaction.original_transaction_id ?? '—'}</div>
          </div>
        </section>

        <section className="card">
          <div className="card__header">
            <strong>Customer</strong>
          </div>
          <div className="card__body stack">
            {customer ? (
              <>
                <div><strong>{customer.name}</strong></div>
                <div className="muted">{customer.mobile_number}</div>
                {customer.email ? <div className="muted">{customer.email}</div> : null}
                <Link className="button button--secondary" to={`/customers/${customer.customer_id}`}>
                  View customer
                </Link>
              </>
            ) : (
              <div className="muted">{transaction.customer_id ? `Customer #${transaction.customer_id}` : 'Guest checkout'}</div>
            )}
          </div>
        </section>
      </div>

      <div className="grid grid--2">
        <section className="card">
          <div className="card__header">
            <strong>Payment summary</strong>
          </div>
          <div className="card__body stack">
            <div className="flex items-center justify-between"><span>Subtotal</span><strong>₹{summary.subtotal.toFixed(2)}</strong></div>
            <div className="flex items-center justify-between"><span>Discount</span><strong>-₹{summary.discount.toFixed(2)}</strong></div>
            <div className="flex items-center justify-between"><span>Total</span><strong>₹{summary.total.toFixed(2)}</strong></div>
          </div>
        </section>

        <section className="card">
          <div className="card__header">
            <strong>Line items</strong>
          </div>
          <div className="card__body stack">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit price</th>
                  <th>Discount</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {transaction.line_items.map((item) => {
                  const total = roundMoney((Number(item.quantity ?? 0) * Number(item.selling_price ?? 0)) - Number(item.discount_amount ?? 0));
                  return (
                    <tr key={`${item.product_id}-${item.product_name ?? 'item'}`}>
                      <td>
                        <strong>{item.product_name ?? `Product ${item.product_id}`}</strong>
                        <div className="muted" style={{ fontSize: '0.8rem' }}>ID {item.product_id}</div>
                      </td>
                      <td>{item.quantity}</td>
                      <td>₹{Number(item.selling_price ?? 0).toFixed(2)}</td>
                      <td>₹{Number(item.discount_amount ?? 0).toFixed(2)}</td>
                      <td>₹{total.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <Dialog open={returnOpen}>
        <DialogContent>
          <section className="card" style={{ minWidth: 'min(920px, 92vw)' }}>
            <div className="card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <div>
                <strong>Return items</strong>
                <div className="muted">Select the line items and quantities to return.</div>
              </div>
              <button className="button button--ghost" type="button" onClick={() => setReturnOpen(false)}>
                Close
              </button>
            </div>
            <div className="card__body stack">
              <table className="table">
                <thead>
                  <tr>
                    <th>Return</th>
                    <th>Product</th>
                    <th>Max qty</th>
                    <th>Quantity</th>
                    <th>Refund</th>
                  </tr>
                </thead>
                <tbody>
                  {transaction.line_items.map((item) => {
                    const selection = selections.find((entry) => entry.product_id === item.product_id);
                    const quantityReturned = selection?.quantity_returned ?? 1;
                    const selected = selection?.selected ?? false;
                    const refund = selected
                      ? roundMoney((quantityReturned * Number(item.selling_price ?? 0)) - (Number(item.discount_amount ?? 0) * (quantityReturned / Number(item.quantity ?? 1))))
                      : 0;

                    return (
                      <tr key={item.product_id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(event) => {
                              setSelections((current) => current.map((entry) => (
                                entry.product_id === item.product_id ? { ...entry, selected: event.target.checked } : entry
                              )));
                            }}
                          />
                        </td>
                        <td>{item.product_name ?? `Product ${item.product_id}`}</td>
                        <td>{item.quantity}</td>
                        <td>
                          <input
                            className="input"
                            style={{ width: 100 }}
                            type="number"
                            min="1"
                            max={item.quantity}
                            value={quantityReturned}
                            onChange={(event) => {
                              setSelections((current) => current.map((entry) => (
                                entry.product_id === item.product_id ? { ...entry, quantity_returned: Math.max(1, Math.min(Number(event.target.value), Number(item.quantity ?? 1))) } : entry
                              )));
                            }}
                          />
                        </td>
                        <td>₹{refund.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <label className="field">
                <span>Reason</span>
                <textarea className="textarea" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason for return" />
              </label>

              <div className="card" style={{ padding: '0.85rem' }}>
                <div className="flex items-center justify-between">
                  <span>Estimated refund</span>
                  <strong>₹{returnSummary.toFixed(2)}</strong>
                </div>
              </div>

              <div className="button-row">
                <button className="button button--secondary" type="button" onClick={() => setReturnOpen(false)}>
                  Cancel
                </button>
                <button className="button button--danger" type="button" onClick={() => void submitReturn()} disabled={returnMutation.isPending}>
                  {returnMutation.isPending ? 'Submitting…' : 'Submit return'}
                </button>
              </div>
            </div>
          </section>
        </DialogContent>
      </Dialog>
    </PageFrame>
  );
}
