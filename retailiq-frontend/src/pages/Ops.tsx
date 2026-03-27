import { PageFrame } from '@/components/layout/PageFrame';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useMaintenanceStatusQuery } from '@/hooks/platform';
import { formatDate } from '@/utils/dates';
import { normalizeApiError } from '@/utils/errors';

const describeMaintenanceEntry = (entry: unknown) => {
  if (typeof entry === 'string' || typeof entry === 'number' || typeof entry === 'boolean') {
    return String(entry);
  }

  if (entry && typeof entry === 'object') {
    const candidate = entry as Record<string, unknown>;
    const summary = [candidate.title, candidate.name, candidate.message, candidate.status, candidate.description].find(
      (value): value is string => typeof value === 'string' && value.trim().length > 0,
    );
    return summary ?? JSON.stringify(entry);
  }

  return 'Unknown entry';
};

const statusVariant = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized.includes('healthy') || normalized.includes('ok') || normalized.includes('operational')) {
    return 'success' as const;
  }

  if (normalized.includes('degrad') || normalized.includes('warn') || normalized.includes('partial')) {
    return 'warning' as const;
  }

  if (normalized.includes('incident') || normalized.includes('down') || normalized.includes('fail')) {
    return 'danger' as const;
  }

  return 'secondary' as const;
};

export default function OpsPage() {
  const maintenanceQuery = useMaintenanceStatusQuery();

  if (maintenanceQuery.isLoading) {
    return (
      <PageFrame title="Maintenance" subtitle="Current system status, incidents, and scheduled maintenance windows.">
        <SkeletonLoader variant="rect" height={280} />
      </PageFrame>
    );
  }

  if (maintenanceQuery.isError) {
    return (
      <PageFrame title="Maintenance" subtitle="Current system status, incidents, and scheduled maintenance windows.">
        <ErrorState error={normalizeApiError(maintenanceQuery.error)} onRetry={() => void maintenanceQuery.refetch()} />
      </PageFrame>
    );
  }

  const maintenance = maintenanceQuery.data ?? {
    system_status: 'unknown',
    checked_at: '',
    scheduled_maintenance: [],
    ongoing_incidents: [],
  };

  const scheduledMaintenance = Array.isArray(maintenance.scheduled_maintenance) ? maintenance.scheduled_maintenance : [];
  const ongoingIncidents = Array.isArray(maintenance.ongoing_incidents) ? maintenance.ongoing_incidents : [];
  const checkedAtLabel = maintenance.checked_at ? formatDate(maintenance.checked_at) : 'Not reported';

  return (
    <PageFrame title="Maintenance" subtitle="Current system status, incidents, and scheduled maintenance windows.">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3 text-base">
              <span>System status</span>
              <Badge variant={statusVariant(String(maintenance.system_status ?? 'unknown'))}>
                {String(maintenance.system_status ?? 'unknown')}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-600">Last checked: {checkedAtLabel}</p>
            <p className="text-sm text-gray-600">
              The backend may return a minimal operational payload, so the UI treats missing values defensively.
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => void maintenanceQuery.refetch()}>
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scheduled maintenance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {scheduledMaintenance.length > 0 ? (
              <ul className="space-y-2">
                {scheduledMaintenance.map((entry, index) => (
                  <li key={`scheduled-${index}`} className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                    {describeMaintenanceEntry(entry)}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No scheduled maintenance" body="There are no upcoming maintenance windows reported by the backend." />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Ongoing incidents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ongoingIncidents.length > 0 ? (
              <ul className="space-y-2">
                {ongoingIncidents.map((entry, index) => (
                  <li key={`incident-${index}`} className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                    {describeMaintenanceEntry(entry)}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No active incidents" body="The backend is not reporting any ongoing incidents right now." />
            )}
          </CardContent>
        </Card>
      </div>
    </PageFrame>
  );
}
