import { Badge } from '@/components/ui/Badge';
import { formatDisplayDateTime } from '@/utils/dates';

export interface InvoiceDetailCardProps {
  title: string;
  invoice: {
    invoice_id: string;
    transaction_id: string;
    country_code: string;
    invoice_format: string;
    invoice_number: string | null;
    authority_ref: string | null;
    status: string;
    submitted_at: string | null;
    qr_code_url: string | null;
  };
}

const statusVariant = (status?: string) => {
  const normalized = (status ?? '').toUpperCase();
  if (normalized === 'ACCEPTED') return 'success' as const;
  if (normalized === 'SUBMITTED') return 'info' as const;
  if (normalized === 'REJECTED') return 'danger' as const;
  if (normalized === 'DRAFT') return 'warning' as const;
  return 'secondary' as const;
};

export function InvoiceDetailCard({ title, invoice }: InvoiceDetailCardProps) {
  return (
    <div className="space-y-3 rounded-md border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-gray-900">{title}</div>
        <Badge variant={statusVariant(invoice.status)}>{invoice.status}</Badge>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="text-sm text-gray-600">Invoice ID: {invoice.invoice_id}</div>
        <div className="text-sm text-gray-600">Transaction ID: {invoice.transaction_id}</div>
        <div className="text-sm text-gray-600">Country: {invoice.country_code}</div>
        <div className="text-sm text-gray-600">Format: {invoice.invoice_format}</div>
        <div className="text-sm text-gray-600">Invoice #: {invoice.invoice_number ?? '-'}</div>
        <div className="text-sm text-gray-600">Authority Ref: {invoice.authority_ref ?? '-'}</div>
        <div className="text-sm text-gray-600">Submitted: {invoice.submitted_at ? formatDisplayDateTime(invoice.submitted_at) : '-'}</div>
      </div>
      {invoice.qr_code_url ? (
        <div className="space-y-2 pt-2">
          <div className="text-sm font-medium text-gray-900">QR Code</div>
          <img src={invoice.qr_code_url} alt="E-Invoice QR code" className="max-w-[180px] rounded-md border border-gray-200 bg-white p-2" />
        </div>
      ) : null}
    </div>
  );
}
