import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { useCreatePurchaseOrder, useUpdatePurchaseOrder } from '@/hooks/purchaseOrders';
import { useProductsQuery } from '@/hooks/inventory';
import { useSupplier, useSuppliers } from '@/hooks/suppliers';
import { uiStore } from '@/stores/uiStore';
import { normalizeApiError } from '@/utils/errors';
import { formatCurrency } from '@/utils/numbers';
import type { ApiError } from '@/types/api';
import type { PurchaseOrderCreatePayload, PurchaseOrderUpdatePayload } from '@/api/purchaseOrders';
import type { Product } from '@/types/models';

export interface PurchaseOrderLineItemValues {
  product_id: string;
  ordered_qty: string;
  unit_price: string;
}

export interface PurchaseOrderFormValues {
  supplier_id: string;
  expected_delivery_date: string;
  notes: string;
  items: PurchaseOrderLineItemValues[];
}

interface PurchaseOrderFormProps {
  purchaseOrderId?: string;
  initialValues?: Partial<PurchaseOrderFormValues>;
  onSuccess?: (purchaseOrderId: string) => void;
  onCancel?: () => void;
}

const defaultValues: PurchaseOrderFormValues = {
  supplier_id: '',
  expected_delivery_date: '',
  notes: '',
  items: [{ product_id: '', ordered_qty: '1', unit_price: '0' }],
};

const calculateLineTotal = (line: PurchaseOrderLineItemValues) => {
  const quantity = Number(line.ordered_qty || 0);
  const price = Number(line.unit_price || 0);
  return quantity * price;
};

export function PurchaseOrderForm({ purchaseOrderId, initialValues, onSuccess, onCancel }: PurchaseOrderFormProps) {
  const navigate = useNavigate();
  const addToast = uiStore((state) => state.addToast);
  const createMutation = useCreatePurchaseOrder();
  const updateMutation = useUpdatePurchaseOrder();
  const mutation = purchaseOrderId ? updateMutation : createMutation;
  const [values, setValues] = useState<PurchaseOrderFormValues>({ ...defaultValues, ...initialValues });
  const [formError, setFormError] = useState<string | null>(null);

  const suppliersQuery = useSuppliers();
  const productsQuery = useProductsQuery({ page_size: 500 });
  const selectedSupplierId = values.supplier_id;
  const selectedSupplierDetail = useSupplier(selectedSupplierId);

  useEffect(() => {
    setValues({ ...defaultValues, ...initialValues });
  }, [initialValues]);

  const productOptions = useMemo(() => {
    const products = (productsQuery.data?.data ?? []) as Product[];
    const linkedProducts = selectedSupplierDetail.data?.sourced_products ?? [];
    const linkedProductIds = new Set(linkedProducts.map((product) => product.product_id));
    const selectedLineProductIds = new Set(
      values.items
        .map((line) => Number(line.product_id))
        .filter((value) => Number.isFinite(value) && value > 0),
    );
    const allowedIds = linkedProductIds.size
      ? new Set([...linkedProductIds, ...selectedLineProductIds])
      : null;

    return products
      .filter((product) => {
        if (!allowedIds) {
          return true;
        }
        return allowedIds.has(product.product_id);
      })
      .map((product) => ({
        id: String(product.product_id),
        label: `${product.name}${product.sku_code ? ` - ${product.sku_code}` : ''}`,
      }));
  }, [productsQuery.data, selectedSupplierDetail.data, values.items]);

  const error = mutation.error ? normalizeApiError(mutation.error) : null;

  const setField = (key: keyof PurchaseOrderFormValues) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const nextValue = event.target.value;
    setFormError(null);
    setValues((current) => ({ ...current, [key]: nextValue }));
  };

  const setLineField = (index: number, key: keyof PurchaseOrderLineItemValues) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const nextValue = event.target.value;
    setFormError(null);
    setValues((current) => ({
      ...current,
      items: current.items.map((line, lineIndex) => (lineIndex === index ? { ...line, [key]: nextValue } : line)),
    }));
  };

  const addLine = () => {
    setFormError(null);
    setValues((current) => ({
      ...current,
      items: [...current.items, { product_id: '', ordered_qty: '1', unit_price: '0' }],
    }));
  };

  const removeLine = (index: number) => {
    setFormError(null);
    setValues((current) => ({
      ...current,
      items: current.items.length === 1 ? current.items : current.items.filter((_, lineIndex) => lineIndex !== index),
    }));
  };

  const updateFromSupplier = (event: ChangeEvent<HTMLSelectElement>) => {
    const supplierId = event.target.value;
    setFormError(null);
    setValues((current) => ({
      ...current,
      supplier_id: supplierId,
    }));
  };

  const linkedProductIds = useMemo(
    () => new Set((selectedSupplierDetail.data?.sourced_products ?? []).map((product) => product.product_id)),
    [selectedSupplierDetail.data],
  );

  const unlinkedLineItems = useMemo(
    () =>
      values.items
        .map((line, index) => ({ line, index }))
        .filter(({ line }) => Boolean(line.product_id) && linkedProductIds.size > 0 && !linkedProductIds.has(Number(line.product_id))),
    [linkedProductIds, values.items],
  );

  const subtotal = values.items.reduce((sum, line) => sum + calculateLineTotal(line), 0);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!values.supplier_id) {
      setFormError('Please select a supplier.');
      return;
    }

    const normalizedItems = values.items.map((line) => ({
      product_id: Number(line.product_id),
      ordered_qty: Number(line.ordered_qty),
      unit_price: Number(line.unit_price),
    }));

    if (
      normalizedItems.length === 0 ||
      normalizedItems.some(
        (line) =>
          !Number.isFinite(line.product_id) ||
          line.product_id <= 0 ||
          !Number.isFinite(line.ordered_qty) ||
          line.ordered_qty <= 0 ||
          !Number.isFinite(line.unit_price) ||
          line.unit_price < 0,
      )
    ) {
      setFormError('Each line item must have a product, quantity greater than zero, and a valid unit price.');
      return;
    }

    const payloadBase = {
      supplier_id: values.supplier_id,
      expected_delivery_date: values.expected_delivery_date || undefined,
      notes: values.notes || undefined,
      items: normalizedItems,
    };

    try {
      const response = purchaseOrderId
        ? await updateMutation.mutateAsync({
            purchaseOrderId,
            payload: payloadBase as PurchaseOrderUpdatePayload,
          })
        : await createMutation.mutateAsync(payloadBase as PurchaseOrderCreatePayload);
      addToast({
        title: purchaseOrderId ? 'Purchase order updated' : 'Purchase order created',
        message: purchaseOrderId ? response.id : response.id,
        variant: 'success',
      });
      onSuccess?.(response.id);
      if (!onSuccess) {
        navigate(`/purchase-orders/${response.id}`);
      }
    } catch {
      // surfaced via ErrorState
    }
  };

  const productLookup = useMemo(() => {
    const products = (productsQuery.data?.data ?? []) as Product[];
    return new Map(products.map((product) => [String(product.product_id), product]));
  }, [productsQuery.data]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error ? <ErrorState error={error as ApiError} onRetry={() => mutation.reset()} /> : null}
      {formError ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          {formError}
          {unlinkedLineItems.length > 0 ? (
            <div className="mt-1">
              Warning: {unlinkedLineItems.length} selected line item{unlinkedLineItems.length === 1 ? '' : 's'} are not currently linked to the chosen supplier.
            </div>
          ) : null}
        </div>
      ) : null}
      {!formError && unlinkedLineItems.length > 0 ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          Warning: {unlinkedLineItems.length} selected line item{unlinkedLineItems.length === 1 ? '' : 's'} are not currently linked to the chosen supplier.
        </div>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>{purchaseOrderId ? 'Edit Purchase Order' : 'Create Purchase Order'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Supplier</span>
              <select
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={values.supplier_id}
                onChange={updateFromSupplier}
                required
              >
                <option value="">Select a supplier</option>
                {suppliersQuery.data?.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Expected Delivery Date</span>
              <Input type="date" value={values.expected_delivery_date} onChange={setField('expected_delivery_date')} />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Notes</span>
              <textarea
                className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={values.notes}
                onChange={setField('notes')}
                placeholder="Optional notes"
              />
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold">Line Items</h3>
              <Button type="button" variant="secondary" onClick={addLine}>
                Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {values.items.map((line, index) => {
                const product = productLookup.get(line.product_id);
                return (
                  <div key={`${index}-${line.product_id}`} className="rounded-lg border border-border p-4">
                    <div className="grid gap-3 md:grid-cols-12">
                      <label className="space-y-2 md:col-span-6">
                        <span className="text-sm font-medium">Product</span>
                        <select
                          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                          value={line.product_id}
                          onChange={setLineField(index, 'product_id')}
                          required
                        >
                          <option value="">Select product</option>
                          {productOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {product ? <p className="text-xs text-muted-foreground">{product.name}</p> : null}
                      </label>
                      <label className="space-y-2 md:col-span-2">
                        <span className="text-sm font-medium">Qty</span>
                        <Input type="number" min={0} step="0.001" value={line.ordered_qty} onChange={setLineField(index, 'ordered_qty')} />
                      </label>
                      <label className="space-y-2 md:col-span-2">
                        <span className="text-sm font-medium">Unit Price</span>
                        <Input type="number" min={0} step="0.01" value={line.unit_price} onChange={setLineField(index, 'unit_price')} />
                      </label>
                      <div className="flex items-end justify-between gap-3 md:col-span-2">
                        <div>
                          <div className="text-sm font-medium">Line Total</div>
                          <div className="text-base">{formatCurrency(calculateLineTotal(line))}</div>
                        </div>
                        <Button type="button" variant="secondary" onClick={() => removeLine(index)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
            <div>
              <div className="text-sm text-muted-foreground">Subtotal</div>
              <div className="text-lg font-semibold">{formatCurrency(subtotal)}</div>
            </div>
            <div className="text-sm text-muted-foreground">
              The backend stores only line items here, so totals are calculated in the frontend.
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" loading={mutation.isPending}>
              {purchaseOrderId ? 'Save Changes' : 'Create Purchase Order'}
            </Button>
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
