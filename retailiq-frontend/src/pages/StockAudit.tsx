/**
 * src/pages/StockAudit.tsx
 * Oracle Document sections consumed: 3, 7, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { stockAuditSchema, type StockAuditFormValues } from '@/types/schemas';
import { useStockAuditMutation } from '@/hooks/inventory';
import { normalizeApiError } from '@/utils/errors';
import { extractFieldErrors } from '@/utils/errors';
import { uiStore } from '@/stores/uiStore';

const blankItem = { product_id: 0, actual_qty: 0 };

export default function StockAuditPage() {
  const navigate = useNavigate();
  const addToast = uiStore((state) => state.addToast);
  const mutation = useStockAuditMutation();
  const { control, register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<StockAuditFormValues>({
    resolver: zodResolver(stockAuditSchema),
    defaultValues: { items: [blankItem], notes: '' },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await mutation.mutateAsync(values);
      addToast({ title: 'Audit submitted', message: result.message, variant: 'success' });
      navigate('/inventory', { replace: true });
    } catch (error) {
      const apiError = normalizeApiError(error);
      if (apiError.status === 422) {
        extractFieldErrors(apiError.fields, setError);
        return;
      }
      addToast({ title: 'Audit failed', message: apiError.message, variant: 'error' });
    }
  });

  return (
    <PageFrame title="Stock audit" subtitle="Record actual stock counts against the live inventory.">
      <form className="stack" onSubmit={onSubmit} noValidate>
        <div className="card">
          <div className="card__header button-row" style={{ justifyContent: 'space-between' }}>
            <strong>Audit items</strong>
            <button className="button button--secondary" type="button" onClick={() => append(blankItem)}>Add item</button>
          </div>
          <div className="card__body stack">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid--2">
                <label className="field"><span>Product ID</span><input className="input" type="number" {...register(`items.${index}.product_id`, { valueAsNumber: true })} /></label>
                <label className="field"><span>Actual quantity</span><input className="input" type="number" {...register(`items.${index}.actual_qty`, { valueAsNumber: true })} /></label>
                <div className="button-row" style={{ gridColumn: '1 / -1' }}>
                  <button className="button button--ghost" type="button" onClick={() => remove(index)} disabled={fields.length <= 1}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <label className="field"><span>Notes</span><textarea className="textarea" {...register('notes')} /></label>
        {errors.root ? <div className="muted">{errors.root.message}</div> : null}
        <button className="button" type="submit" disabled={isSubmitting || mutation.isPending}>{isSubmitting || mutation.isPending ? 'Submitting…' : 'Submit audit'}</button>
      </form>
    </PageFrame>
  );
}
