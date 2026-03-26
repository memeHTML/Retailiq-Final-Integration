import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { StatCard } from '@/components/shared/StatCard';
import { useGstLiabilitySlabs } from '@/hooks/useGst';
import { formatCurrency } from '@/utils/numbers';
import { normalizeApiError } from '@/utils/errors';

export function GstLiabilityTab({ period, onPeriodChange }: { period: string; onPeriodChange: (value: string) => void }) {
  const liabilityQuery = useGstLiabilitySlabs(period);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Input label="Period" type="month" value={period} onChange={(event) => onPeriodChange(event.target.value)} className="max-w-xs" />
        <Button variant="secondary" onClick={() => void liabilityQuery.refetch()}>
          Refresh slabs
        </Button>
      </div>
      {liabilityQuery.isLoading && !liabilityQuery.data ? <SkeletonLoader variant="rect" height={160} /> : null}
      {liabilityQuery.error ? <ErrorState error={normalizeApiError(liabilityQuery.error)} onRetry={() => void liabilityQuery.refetch()} /> : null}
      {liabilityQuery.data?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Liability Slabs for {period}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {liabilityQuery.data.map((slab) => (
                <StatCard
                  key={slab.rate}
                  label={`${slab.rate}%`}
                  value={formatCurrency(slab.tax_amount)}
                  helperText={`Taxable value: ${formatCurrency(slab.taxable_value)}`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyState title="No liability data" body="No liability slabs are available for the selected period." />
      )}
    </div>
  );
}
