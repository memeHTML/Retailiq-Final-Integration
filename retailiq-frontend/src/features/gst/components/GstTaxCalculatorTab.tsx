import { useMemo, useState } from 'react';
import type { TaxCalculationItem, TaxCountryCode } from '@/api/tax';
import { StatCard } from '@/components/shared/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useCalculateTax, useTaxConfig, useTaxFilingSummary } from '@/hooks/useTax';
import { formatCurrency } from '@/utils/numbers';
import { normalizeApiError } from '@/utils/errors';

type TaxItemDraft = {
  product_id: string;
  quantity: string;
  selling_price: string;
  discount: string;
};

type TaxPayload = {
  country_code: TaxCountryCode;
  items: TaxCalculationItem[];
};

const countries: TaxCountryCode[] = ['IN', 'BR', 'MX', 'ID'];
const defaultItem = (): TaxItemDraft => ({ product_id: '', quantity: '1', selling_price: '', discount: '0' });

const buildPayload = (items: TaxItemDraft[], countryCode: TaxCountryCode): { payload?: TaxPayload; error?: string } => {
  if (!countries.includes(countryCode)) {
    return { error: 'Select a valid country.' };
  }

  if (!items.length) {
    return { error: 'Add at least one line item.' };
  }

  const parsed: TaxCalculationItem[] = [];

  for (const [index, item] of items.entries()) {
    const productId = Number(item.product_id);
    if (!Number.isInteger(productId) || productId <= 0) {
      return { error: `Line ${index + 1}: Product ID must be a positive whole number.` };
    }

    const quantity = Number(item.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return { error: `Line ${index + 1}: Quantity must be greater than zero.` };
    }

    const sellingPrice = Number(item.selling_price);
    if (!Number.isFinite(sellingPrice) || sellingPrice < 0) {
      return { error: `Line ${index + 1}: Selling price must be zero or greater.` };
    }

    const discount = Number(item.discount || 0);
    if (!Number.isFinite(discount) || discount < 0) {
      return { error: `Line ${index + 1}: Discount must be zero or greater.` };
    }

    parsed.push({
      product_id: productId,
      quantity,
      selling_price: sellingPrice,
      discount,
    });
  }

  return { payload: { country_code: countryCode, items: parsed } };
};

function TaxRow({
  index,
  item,
  onChange,
  onRemove,
  canRemove,
}: {
  index: number;
  item: TaxItemDraft;
  onChange: (field: keyof TaxItemDraft, value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const rowNumber = index + 1;

  return (
    <div className="rounded-md border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-gray-900">Line {rowNumber}</div>
        {canRemove ? (
          <Button variant="ghost" size="sm" onClick={onRemove}>
            Remove
          </Button>
        ) : (
          <Badge variant="secondary">Required</Badge>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Input label={`Product ID ${rowNumber}`} aria-label={`Product ID ${rowNumber}`} value={item.product_id} onChange={(event) => onChange('product_id', event.target.value)} placeholder="123" />
        <Input label={`Quantity ${rowNumber}`} aria-label={`Quantity ${rowNumber}`} type="number" value={item.quantity} onChange={(event) => onChange('quantity', event.target.value)} min={1} step="1" />
        <Input label={`Selling Price ${rowNumber}`} aria-label={`Selling Price ${rowNumber}`} type="number" value={item.selling_price} onChange={(event) => onChange('selling_price', event.target.value)} min={0} step="0.01" />
        <Input label={`Discount ${rowNumber}`} aria-label={`Discount ${rowNumber}`} type="number" value={item.discount} onChange={(event) => onChange('discount', event.target.value)} min={0} step="0.01" />
      </div>
    </div>
  );
}

export function GstTaxCalculatorTab({ period, onPeriodChange }: { period: string; onPeriodChange: (value: string) => void }) {
  const [countryCode, setCountryCode] = useState<TaxCountryCode>('IN');
  const [items, setItems] = useState<TaxItemDraft[]>([defaultItem()]);
  const taxConfigQuery = useTaxConfig(countryCode);
  const taxSummaryQuery = useTaxFilingSummary(period, countryCode);
  const calculateTax = useCalculateTax();

  const draft = useMemo(() => buildPayload(items, countryCode), [items, countryCode]);
  const taxConfigError = taxConfigQuery.error ? normalizeApiError(taxConfigQuery.error) : null;
  const taxSummaryError = taxSummaryQuery.error ? normalizeApiError(taxSummaryQuery.error) : null;
  const taxError = calculateTax.error ? normalizeApiError(calculateTax.error) : null;

  const addItem = () => setItems((current) => [...current, defaultItem()]);
  const removeItem = (index: number) => setItems((current) => current.filter((_, currentIndex) => currentIndex !== index));
  const updateItem = (index: number, field: keyof TaxItemDraft, value: string) =>
    setItems((current) => current.map((entry, currentIndex) => (currentIndex === index ? { ...entry, [field]: value } : entry)));

  const calculate = async () => {
    if (!draft.payload) {
      return;
    }

    try {
      await calculateTax.mutateAsync(draft.payload);
    } catch {
      // surfaced via mutation state
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tax Engine Config</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {taxConfigError ? <ErrorState error={taxConfigError} onRetry={() => void taxConfigQuery.refetch()} /> : null}
          {taxConfigQuery.isLoading && !taxConfigQuery.data ? <SkeletonLoader variant="rect" height={120} /> : null}
          {taxConfigQuery.data ? (
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard label="Tax ID" value={taxConfigQuery.data.tax_id ?? 'Not configured'} />
              <StatCard label="Registration" value={taxConfigQuery.data.registration_type} />
              <StatCard label="Province/State" value={taxConfigQuery.data.state_province ?? '-'} />
              <StatCard label="Enabled" value={taxConfigQuery.data.is_tax_enabled ? 'Yes' : 'No'} />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Tax Calculator</CardTitle>
            <Button variant="secondary" onClick={addItem}>
              Add item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
              Country
              <select
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={countryCode}
                onChange={(event) => setCountryCode(event.target.value as TaxCountryCode)}
              >
                {countries.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </label>
            <Input label="Period" type="month" value={period} onChange={(event) => onPeriodChange(event.target.value)} className="max-w-xs" />
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <TaxRow
                key={index}
                index={index}
                item={item}
                onChange={(field, value) => updateItem(index, field, value)}
                canRemove={items.length > 1}
                onRemove={() => removeItem(index)}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => void calculate()} loading={calculateTax.isPending} disabled={Boolean(draft.error)}>
              Calculate Tax
            </Button>
            <Button variant="secondary" onClick={() => void taxSummaryQuery.refetch()}>
              Refresh filing summary
            </Button>
          </div>
          {draft.error ? <p className="text-sm text-red-600">{draft.error}</p> : null}
          {taxError ? <ErrorState error={taxError} /> : null}
          {calculateTax.data ? (
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard label="Taxable Amount" value={formatCurrency(calculateTax.data.taxable_amount)} />
              <StatCard label="Tax Amount" value={formatCurrency(calculateTax.data.tax_amount)} />
              <StatCard
                label="Breakdown"
                value={Object.entries(calculateTax.data.breakdown ?? {})
                  .map(([key, value]) => `${key}: ${Number(value).toFixed(2)}`)
                  .join(' | ') || '-'}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filing Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {taxSummaryQuery.isLoading && !taxSummaryQuery.data ? <SkeletonLoader variant="rect" height={120} /> : null}
          {taxSummaryError ? <ErrorState error={taxSummaryError} onRetry={() => void taxSummaryQuery.refetch()} /> : null}
          {taxSummaryQuery.data ? (
            <div className="grid gap-4 md:grid-cols-5">
              <StatCard label="Period" value={taxSummaryQuery.data.period} />
              <StatCard label="Country" value={taxSummaryQuery.data.country_code} />
              <StatCard label="Taxable" value={formatCurrency(taxSummaryQuery.data.total_taxable)} />
              <StatCard label="Tax" value={formatCurrency(taxSummaryQuery.data.total_tax)} />
              <StatCard label="Invoices" value={taxSummaryQuery.data.invoice_count} />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
