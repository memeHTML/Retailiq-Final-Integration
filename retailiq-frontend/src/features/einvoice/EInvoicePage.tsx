import { useState } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { normalizeApiError } from '@/utils/errors';
import { InvoiceDetailCard } from './components/InvoiceDetailCard';
import { useGenerateEinvoice, useEinvoiceStatus } from '@/hooks/useEinvoice';

const statusVariant = (status?: string) => {
  const normalized = (status ?? '').toUpperCase();
  if (normalized === 'ACCEPTED') return 'success' as const;
  if (normalized === 'SUBMITTED') return 'info' as const;
  if (normalized === 'REJECTED') return 'danger' as const;
  if (normalized === 'DRAFT') return 'warning' as const;
  return 'secondary' as const;
};

export default function EInvoicePage() {
  const [transactionId, setTransactionId] = useState('');
  const [invoiceIdInput, setInvoiceIdInput] = useState('');
  const [activeInvoiceId, setActiveInvoiceId] = useState('');
  const [countryCode, setCountryCode] = useState('IN');

  const generateEinvoice = useGenerateEinvoice();
  const statusQuery = useEinvoiceStatus(activeInvoiceId);
  const generatedInvoice = generateEinvoice.data;
  const invoice = statusQuery.data ?? generatedInvoice;

  const handleGenerate = async () => {
    try {
      const result = await generateEinvoice.mutateAsync({ transaction_id: transactionId, country_code: countryCode });
      if (result?.invoice_id) {
        setActiveInvoiceId(result.invoice_id);
      }
    } catch {
      // surfaced via mutation state
    }
  };

  const handleLookup = () => {
    if (invoiceIdInput.trim()) {
      setActiveInvoiceId(invoiceIdInput.trim());
    }
  };

  return (
    <PageFrame title="E-Invoicing" subtitle="Generate and inspect backend-issued e-invoices.">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Generate E-Invoice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Transaction ID" value={transactionId} onChange={(event) => setTransactionId(event.target.value)} placeholder="UUID or transaction identifier" />
            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
              Country
              <select className="rounded-md border border-gray-300 px-3 py-2 text-sm" value={countryCode} onChange={(event) => setCountryCode(event.target.value)}>
                <option value="IN">IN</option>
                <option value="BR">BR</option>
                <option value="MX">MX</option>
                <option value="ID">ID</option>
              </select>
            </label>
            <div className="flex items-center gap-3">
              <Button onClick={() => void handleGenerate()} loading={generateEinvoice.isPending} disabled={!transactionId}>
                Generate
              </Button>
              {invoice?.status ? <Badge variant={statusVariant(invoice.status)}>{invoice.status}</Badge> : null}
            </div>
            {generateEinvoice.isError ? <ErrorState error={normalizeApiError(generateEinvoice.error)} /> : null}
            {generatedInvoice ? <InvoiceDetailCard title="Generated invoice" invoice={generatedInvoice} /> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input label="Invoice ID" value={invoiceIdInput} onChange={(event) => setInvoiceIdInput(event.target.value)} placeholder="Invoice UUID" />
              <div className="pt-7">
                <Button variant="secondary" onClick={handleLookup} disabled={!invoiceIdInput.trim()}>
                  Lookup
                </Button>
              </div>
            </div>

            {activeInvoiceId ? (
              statusQuery.isLoading ? (
                <SkeletonLoader variant="rect" height={160} />
              ) : statusQuery.error ? (
                <ErrorState error={normalizeApiError(statusQuery.error)} onRetry={() => void statusQuery.refetch()} />
              ) : invoice ? (
                <InvoiceDetailCard title="Invoice status" invoice={invoice} />
              ) : null
            ) : (
              <div className="rounded-md border border-dashed border-gray-200 p-6 text-sm text-gray-500">Enter an invoice ID to inspect its status.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageFrame>
  );
}
