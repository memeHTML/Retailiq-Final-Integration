import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { StatCard } from '@/components/shared/StatCard';
import { authStore } from '@/stores/authStore';
import { useFileGstr1, useGstr1 } from '@/hooks/useGst';
import { formatDate } from '@/utils/dates';
import { isNotFound, normalizeApiError } from '@/utils/errors';

const statusVariant = (status?: string) => {
  const value = (status ?? '').toUpperCase();
  if (value === 'FILED' || value === 'ACCEPTED') return 'success' as const;
  if (value === 'READY' || value === 'PENDING' || value === 'SUBMITTED') return 'warning' as const;
  if (value === 'ERROR' || value === 'REJECTED') return 'danger' as const;
  return 'secondary' as const;
};

export function GstGstr1Tab({ period, onPeriodChange }: { period: string; onPeriodChange: (value: string) => void }) {
  const isOwner = authStore((state) => state.user?.role === 'owner');
  const gstr1Query = useGstr1(period);
  const fileGstr1 = useFileGstr1();
  const gstr1Error = gstr1Query.error ? normalizeApiError(gstr1Query.error) : null;

  const filePeriod = async () => {
    try {
      await fileGstr1.mutateAsync(period);
    } catch {
      // surfaced via mutation state
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <Input label="Period" type="month" value={period} onChange={(event) => onPeriodChange(event.target.value)} className="max-w-xs" />
        <Button variant="secondary" onClick={() => void gstr1Query.refetch()}>
          Refresh GSTR1
        </Button>
        {isOwner ? (
          <Button onClick={() => void filePeriod()} loading={fileGstr1.isPending} disabled={!period.trim()}>
            File GSTR1
          </Button>
        ) : (
          <Badge variant="secondary">Owner action</Badge>
        )}
      </div>
      {gstr1Query.isLoading && !gstr1Query.data ? <SkeletonLoader variant="rect" height={180} /> : null}
      {gstr1Error ? (
        isNotFound(gstr1Error) ? (
          <EmptyState title="GSTR1 not compiled yet" body="The backend has not compiled the JSON for this period yet. Refresh summary or try again after compilation." />
        ) : (
          <ErrorState error={gstr1Error} onRetry={() => void gstr1Query.refetch()} />
        )
      ) : null}
      {gstr1Query.data ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>GSTR1 JSON</CardTitle>
              <Badge variant={statusVariant(gstr1Query.data.status as string | undefined)}>{String(gstr1Query.data.status ?? 'READY')}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard label="Period" value={gstr1Query.data.period ?? period} />
              <StatCard label="Status" value={String(gstr1Query.data.status ?? 'READY')} />
              <StatCard label="Filed On" value={gstr1Query.data.filed_on ? formatDate(gstr1Query.data.filed_on) : '-'} />
              <StatCard label="Ack No." value={gstr1Query.data.acknowledgement_number ?? '-'} />
            </div>
            <div className="mt-6 rounded-md border border-gray-200 bg-gray-50 p-4">
              <pre className="overflow-auto text-xs leading-5 text-gray-700">{JSON.stringify(gstr1Query.data, null, 2)}</pre>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
