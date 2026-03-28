/**
 * src/pages/Pos.tsx
 * Oracle Document sections consumed: 3, 7, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { transactionSchema, type TransactionFormValues } from '@/types/schemas';
import { useCreateTransactionMutation } from '@/hooks/transactions';
import { normalizeApiError } from '@/utils/errors';
import { extractFieldErrors } from '@/utils/errors';
import { toApiDate } from '@/utils/dates';
import { uiStore } from '@/stores/uiStore';

const emptyLineItem = { product_id: 0, quantity: 1, selling_price: 0, discount_amount: 0 };

export default function PosPage() {
  const navigate = useNavigate();
  const addToast = uiStore((state) => state.addToast);
  const createTransactionMutation = useCreateTransactionMutation();
  const { register, control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      transaction_id: crypto.randomUUID(),
      timestamp: toApiDate(new Date()),
      payment_mode: 'CASH',
      customer_id: null,
      notes: '',
      line_items: [emptyLineItem],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'line_items' });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await createTransactionMutation.mutateAsync(values);
      addToast({ title: 'Transaction created', message: `Saved transaction ${result.transaction_id}.`, variant: 'success' });
      navigate(`/transactions/${result.transaction_id}`, { replace: true });
    } catch (error) {
      const apiError = normalizeApiError(error);
      if (apiError.status === 422) {
        extractFieldErrors(apiError.fields, setError);
        return;
      }
      addToast({ title: 'Transaction failed', message: apiError.message, variant: 'error' });
    }
  });

  return (
    <PageFrame title="Point of sale" subtitle="Create a transaction and capture payment details.">
      <form className="stack" onSubmit={onSubmit} noValidate>
        <div className="grid grid--2">
          <label className="field">
            <span>Transaction ID</span>
            <input className="input" {...register('transaction_id')} />
          </label>
          <label className="field">
            <span>Timestamp</span>
            <input className="input" {...register('timestamp')} />
          </label>
        </div>
        <div className="grid grid--2">
          <label className="field">
            <span>Payment mode</span>
            <select className="select" {...register('payment_mode')}>
              <option value="CASH">CASH</option>
              <option value="UPI">UPI</option>
              <option value="CARD">CARD</option>
              <option value="CREDIT">CREDIT</option>
            </select>
          </label>
          <label className="field">
            <span>Customer ID</span>
            <input className="input" type="number" {...register('customer_id', { valueAsNumber: true })} />
          </label>
        </div>
        <label className="field">
          <span>Notes</span>
          <textarea className="textarea" {...register('notes')} />
        </label>

        <section className="card">
          <div className="card__header button-row" style={{ justifyContent: 'space-between' }}>
            <strong>Line items</strong>
            <button className="button button--secondary" type="button" onClick={() => append(emptyLineItem)}>
              Add line item
            </button>
          </div>
          <div className="card__body stack">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid--2">
                <label className="field">
                  <span>Product ID</span>
                  <input className="input" type="number" {...register(`line_items.${index}.product_id`, { valueAsNumber: true })} />
                </label>
                <label className="field">
                  <span>Quantity</span>
                  <input className="input" type="number" {...register(`line_items.${index}.quantity`, { valueAsNumber: true })} />
                </label>
                <label className="field">
                  <span>Selling price</span>
                  <input className="input" type="number" step="0.01" {...register(`line_items.${index}.selling_price`, { valueAsNumber: true })} />
                </label>
                <label className="field">
                  <span>Discount amount</span>
                  <input className="input" type="number" step="0.01" {...register(`line_items.${index}.discount_amount`, { valueAsNumber: true })} />
                </label>
                <div className="button-row" style={{ gridColumn: '1 / -1' }}>
                  <button className="button button--ghost" type="button" onClick={() => remove(index)} disabled={fields.length <= 1}>
                    Remove line item
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {errors.root ? <div className="muted">{errors.root.message}</div> : null}
        <div className="button-row">
          <button className="button" type="submit" disabled={isSubmitting || createTransactionMutation.isPending}>
            {isSubmitting || createTransactionMutation.isPending ? 'Saving…' : 'Complete sale'}
          </button>
        </div>
      </form>
    </PageFrame>
  );
}
