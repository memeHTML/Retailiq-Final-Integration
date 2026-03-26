import { useEffect, useState } from 'react';
import type { GstConfig } from '@/api/gst';
import { StatCard } from '@/components/shared/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useGstConfig, useUpdateGstConfig } from '@/hooks/useGst';
import { authStore } from '@/stores/authStore';
import { normalizeApiError } from '@/utils/errors';

const defaultConfig = (): GstConfig => ({
  gstin: null,
  registration_type: 'REGULAR',
  state_code: null,
  is_gst_enabled: false,
});

export function GstConfigTab() {
  const isOwner = authStore((state) => state.user?.role === 'owner');
  const configQuery = useGstConfig();
  const updateConfig = useUpdateGstConfig();
  const [draft, setDraft] = useState<GstConfig>(defaultConfig());

  useEffect(() => {
    if (configQuery.data) {
      setDraft(configQuery.data);
    }
  }, [configQuery.data]);

  const save = async () => {
    try {
      await updateConfig.mutateAsync(draft);
    } catch {
      // surfaced via mutation state
    }
  };

  return (
    <div className="space-y-6">
      {configQuery.isLoading && !configQuery.data ? <SkeletonLoader variant="rect" height={180} /> : null}
      {configQuery.error ? <ErrorState error={normalizeApiError(configQuery.error)} onRetry={() => void configQuery.refetch()} /> : null}
      {configQuery.data ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>GST Configuration</CardTitle>
              {isOwner ? <Button onClick={() => void save()} loading={updateConfig.isPending}>Save Config</Button> : <Badge variant="secondary">Read only</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="GSTIN"
                value={draft.gstin ?? ''}
                disabled={!isOwner}
                onChange={(event) => setDraft((current) => ({ ...current, gstin: event.target.value || null }))}
                placeholder="29ABCDE1234F1Z5"
              />
              <Input
                label="State Code"
                value={draft.state_code ?? ''}
                disabled={!isOwner}
                onChange={(event) => setDraft((current) => ({ ...current, state_code: event.target.value || null }))}
                placeholder="29"
              />
              <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                Registration Type
                <select
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={draft.registration_type}
                  disabled={!isOwner}
                  onChange={(event) => setDraft((current) => ({ ...current, registration_type: event.target.value }))}
                >
                  <option value="REGULAR">REGULAR</option>
                  <option value="COMPOSITION">COMPOSITION</option>
                  <option value="UNREGISTERED">UNREGISTERED</option>
                </select>
              </label>
              <label className="flex items-center gap-2 pt-6 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={draft.is_gst_enabled}
                  disabled={!isOwner}
                  onChange={(event) => setDraft((current) => ({ ...current, is_gst_enabled: event.target.checked }))}
                />
                GST enabled
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard label="GSTIN" value={configQuery.data.gstin ?? 'Not configured'} />
              <StatCard label="Registration" value={configQuery.data.registration_type} />
              <StatCard label="State" value={configQuery.data.state_code ?? '-'} />
              <StatCard label="Enabled" value={configQuery.data.is_gst_enabled ? 'Yes' : 'No'} />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
