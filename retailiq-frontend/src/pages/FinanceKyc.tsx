import { useEffect, useState } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { Textarea } from '@/components/ui/Textarea';
import { authStore } from '@/stores/authStore';
import { useKYCQuery, useSubmitKYCMutation } from '@/hooks/finance';
import { formatDate } from '@/utils/dates';
import { normalizeApiError } from '@/utils/errors';

export default function FinanceKycPage() {
  const user = authStore((state) => state.user);
  const kycQuery = useKYCQuery();
  const submitMutation = useSubmitKYCMutation();
  const [form, setForm] = useState({
    provider: 'RetailIQ',
    document_type: 'GSTIN',
    document_number: '',
    full_name: user?.full_name ?? '',
    date_of_birth: '',
    address: '',
  });

  useEffect(() => {
    if (user?.full_name) {
      setForm((current) => ({
        ...current,
        full_name: current.full_name || user.full_name || '',
      }));
    }
  }, [user?.full_name]);

  if (kycQuery.error) {
    return (
      <PageFrame title="Finance KYC" subtitle="Finance-specific KYC status and submission flow.">
        <ErrorState error={normalizeApiError(kycQuery.error)} />
      </PageFrame>
    );
  }

  const submit = async () => {
    await submitMutation.mutateAsync({
      provider: form.provider,
      document_type: form.document_type,
      document_number: form.document_number,
      full_name: form.full_name,
      date_of_birth: form.date_of_birth,
      address: form.address,
    });
  };

  return (
    <PageFrame
      title="Finance KYC"
      subtitle="Submit and monitor the finance KYC record used by merchant finance features."
      actions={<Badge variant="secondary">Separate from operations KYC</Badge>}
    >
      {kycQuery.isLoading ? (
        <div className="space-y-6">
          <SkeletonLoader variant="rect" height={180} />
          <SkeletonLoader variant="rect" height={360} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Current status</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-500">Status</span>
                <Badge variant={kycQuery.data?.status === 'VERIFIED' ? 'success' : kycQuery.data?.status === 'REJECTED' ? 'danger' : 'warning'}>
                  {kycQuery.data?.status ?? 'NOT_STARTED'}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-500">Reference</span>
                <span className="font-medium">{kycQuery.data?.reference_id ?? 'Not submitted'}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-500">Submitted</span>
                <span className="font-medium">{kycQuery.data?.submitted_at ? formatDate(kycQuery.data.submitted_at) : '—'}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-500">Verified</span>
                <span className="font-medium">{kycQuery.data?.verified_at ? formatDate(kycQuery.data.verified_at) : '—'}</span>
              </div>
              {kycQuery.data ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  Finance KYC is stored separately from the operations KYC route at <code>/api/v1/kyc</code>.
                </div>
              ) : (
                <EmptyState title="No finance KYC record" body="Submit the form to create the finance-specific KYC record." />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Submit finance KYC</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input label="Provider" value={form.provider} onChange={(event) => setForm((current) => ({ ...current, provider: event.target.value }))} />
              <Input label="Document type" value={form.document_type} onChange={(event) => setForm((current) => ({ ...current, document_type: event.target.value }))} />
              <Input label="Document / tax number" value={form.document_number} onChange={(event) => setForm((current) => ({ ...current, document_number: event.target.value }))} />
              <Input label="Full name" value={form.full_name} onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))} />
              <Input label="Date of birth" type="date" value={form.date_of_birth} onChange={(event) => setForm((current) => ({ ...current, date_of_birth: event.target.value }))} />
              <label className="space-y-2 text-sm font-medium text-gray-700">
                <span>Address</span>
                <Textarea
                  rows={4}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={form.address}
                  onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                />
              </label>
              <Button
                onClick={() => void submit()}
                loading={submitMutation.isPending}
                disabled={!form.document_number || !form.full_name}
              >
                Submit finance KYC
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </PageFrame>
  );
}
