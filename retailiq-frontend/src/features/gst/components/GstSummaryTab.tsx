import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { StatCard } from '@/components/shared/StatCard';
import { useGstSummary } from '@/hooks/useGst';
import { formatDate } from '@/utils/dates';
import { formatCurrency } from '@/utils/numbers';
import { normalizeApiError } from '@/utils/errors';

const statusVariant = (status?: string) => {
  const value = (status ?? '').toUpperCase();
  if (value === 'FILED' || value === 'ACCEPTED') return 'success' as const;
  if (value === 'READY' || value === 'PENDING' || value === 'SUBMITTED') return 'warning' as const;
  if (value === 'ERROR' || value === 'REJECTED') return 'danger' as const;
  return 'secondary' as const;
};

export function GstSummaryTab({ period, onPeriodChange }: { period: string; onPeriodChange: (value: string) => void }) {
  const summaryQuery = useGstSummary(period);
  const summary = summaryQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Input label="Period" type="month" value={period} onChange={(event) => onPeriodChange(event.target.value)} className="max-w-xs" />
        <Button variant="secondary" onClick={() => void summaryQuery.refetch()}>
          Refresh summary
        </Button>
      </div>
      {summaryQuery.isLoading && !summary ? <SkeletonLoader variant="rect" height={160} /> : null}
      {summaryQuery.error ? <ErrorState error={normalizeApiError(summaryQuery.error)} onRetry={() => void summaryQuery.refetch()} /> : null}
      {summary ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>GST Summary for {summary.period}</CardTitle>
              <Badge variant={statusVariant(summary.status)}>{summary.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
              <StatCard label="Taxable" value={formatCurrency(summary.total_taxable)} />
              <StatCard label="CGST" value={formatCurrency(summary.total_cgst)} />
              <StatCard label="SGST" value={formatCurrency(summary.total_sgst)} />
              <StatCard label="IGST" value={formatCurrency(summary.total_igst)} />
              <StatCard label="Invoices" value={summary.invoice_count} />
              <StatCard label="Compiled" value={summary.compiled_at ? formatDate(summary.compiled_at) : 'Pending'} />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
