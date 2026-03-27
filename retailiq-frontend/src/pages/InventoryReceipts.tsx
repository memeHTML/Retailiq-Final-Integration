import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { authStore } from '@/stores/authStore';
import { captureHistoryScopeKey, captureHistoryStore } from '@/stores/captureHistoryStore';
import type { ReceiptTemplate } from '@/types/models';
import { uiStore } from '@/stores/uiStore';
import { normalizeApiError } from '@/utils/errors';
import { usePrintJobQuery, usePrintReceiptMutation, useReceiptTemplateQuery, useUpdateReceiptTemplateMutation } from '@/hooks/receipts';

type ReceiptTab = 'template' | 'queue';

type TemplateDraft = {
  header_text: string;
  footer_text: string;
  show_gstin: boolean;
  paper_width_mm: string;
};

const templateFromData = (data?: ReceiptTemplate | null): TemplateDraft => ({
  header_text: data?.header_text ?? '',
  footer_text: data?.footer_text ?? '',
  show_gstin: data?.show_gstin ?? true,
  paper_width_mm: data?.paper_width_mm == null ? '' : String(data.paper_width_mm),
});

export default function InventoryReceiptsPage() {
  const addToast = uiStore((state) => state.addToast);
  const user = authStore((state) => state.user);
  const scope = useMemo(() => (user && user.store_id != null ? { storeId: user.store_id, userId: user.user_id } : null), [user]);
  const scopeKey = scope ? captureHistoryScopeKey(scope) : null;
  const receiptHistory = captureHistoryStore((state) => (scopeKey ? state.scopes[scopeKey]?.receipts ?? [] : []));
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<ReceiptTab>((searchParams.get('tab') === 'queue' ? 'queue' : 'template'));
  const [selectedJobId, setSelectedJobId] = useState('');
  const [templateDraft, setTemplateDraft] = useState<TemplateDraft>({
    header_text: '',
    footer_text: '',
    show_gstin: true,
    paper_width_mm: '',
  });
  const [printTransactionId, setPrintTransactionId] = useState('');
  const [printMacAddress, setPrintMacAddress] = useState('');
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  const templateQuery = useReceiptTemplateQuery();
  const updateTemplateMutation = useUpdateReceiptTemplateMutation();
  const printReceiptMutation = usePrintReceiptMutation();
  const printJobQuery = usePrintJobQuery(selectedJobId || null);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'template' || tab === 'queue') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    setTemplateDraft(templateFromData(templateQuery.data));
  }, [templateQuery.data]);

  useEffect(() => {
    if (!selectedJobId && receiptHistory.length > 0) {
      setSelectedJobId(String(receiptHistory[0].job_id));
    }
  }, [receiptHistory, selectedJobId]);

  useEffect(() => {
    if (!printJobQuery.data || !scope) {
      return;
    }

    captureHistoryStore.getState().recordReceiptJob(scope, {
      job_id: printJobQuery.data.job_id,
      transaction_id: printJobQuery.data.transaction_id,
      job_type: printJobQuery.data.job_type,
      status: printJobQuery.data.status,
      created_at: printJobQuery.data.created_at,
      completed_at: printJobQuery.data.completed_at,
    });
  }, [printJobQuery.data, scope]);

  useEffect(() => {
    if (!templateQuery.isError || activeTab !== 'template') {
      return;
    }

    setServerMessage(normalizeApiError(templateQuery.error).message);
  }, [activeTab, templateQuery.error, templateQuery.isError]);

  const saveTemplate = async () => {
    setServerMessage(null);
    try {
      const saved = await updateTemplateMutation.mutateAsync({
        header_text: templateDraft.header_text.trim() || null,
        footer_text: templateDraft.footer_text.trim() || null,
        show_gstin: templateDraft.show_gstin,
        paper_width_mm: templateDraft.paper_width_mm.trim() ? Number(templateDraft.paper_width_mm) : null,
      });
      setTemplateDraft(templateFromData(saved));
      addToast({ title: 'Template saved', message: 'Receipt template updated successfully.', variant: 'success' });
    } catch (error) {
      setServerMessage(normalizeApiError(error).message);
    }
  };

  const queuePrintJob = async () => {
    setServerMessage(null);
    try {
      const hasTransactionId = Boolean(printTransactionId.trim());
      const job = await printReceiptMutation.mutateAsync({
        transaction_id: printTransactionId.trim() || null,
        printer_mac_address: printMacAddress.trim() || null,
      });

      if (scope) {
        captureHistoryStore.getState().recordReceiptJob(scope, {
          job_id: job.job_id,
          transaction_id: hasTransactionId ? printTransactionId.trim() : null,
          job_type: hasTransactionId ? 'RECEIPT' : 'BARCODE',
          status: 'PENDING',
          created_at: null,
          completed_at: null,
        });
      }

      setSelectedJobId(String(job.job_id));
      addToast({ title: 'Print job queued', message: `Job ${job.job_id} has been submitted to the backend.`, variant: 'info' });
    } catch (error) {
      setServerMessage(normalizeApiError(error).message);
    }
  };

  const openJob = (jobId: number | string) => {
    setSelectedJobId(String(jobId));
    setActiveTab('queue');
    setSearchParams({ tab: 'queue' }, { replace: true });
  };

  const renderTemplateTab = () => (
    <Card>
      <CardHeader>
        <CardTitle>Receipt Template</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Header text" value={templateDraft.header_text} onChange={(event) => setTemplateDraft((current) => ({ ...current, header_text: event.target.value }))} />
          <Input label="Footer text" value={templateDraft.footer_text} onChange={(event) => setTemplateDraft((current) => ({ ...current, footer_text: event.target.value }))} />
          <Input label="Paper width (mm)" type="number" value={templateDraft.paper_width_mm} onChange={(event) => setTemplateDraft((current) => ({ ...current, paper_width_mm: event.target.value }))} />
          <label className="flex items-center gap-3 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">
            <input type="checkbox" checked={templateDraft.show_gstin} onChange={(event) => setTemplateDraft((current) => ({ ...current, show_gstin: event.target.checked }))} />
            Show GSTIN on receipts
          </label>
        </div>

        <Button type="button" loading={updateTemplateMutation.isPending} onClick={() => void saveTemplate()}>
          Save template
        </Button>
      </CardContent>
    </Card>
  );

  const renderQueueTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Queue Receipt Print</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Transaction ID" value={printTransactionId} onChange={(event) => setPrintTransactionId(event.target.value)} />
            <Input label="Printer MAC address" value={printMacAddress} onChange={(event) => setPrintMacAddress(event.target.value)} />
          </div>

          <Button type="button" variant="secondary" loading={printReceiptMutation.isPending} onClick={() => void queuePrintJob()}>
            Queue print job
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Local Print History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            This list is local convenience history only. The backend authoritative status is the selected print-job lookup endpoint.
          </p>

          {receiptHistory.length > 0 ? (
            <div className="grid gap-2">
              {receiptHistory.map((job) => (
                <button
                  key={job.job_id}
                  type="button"
                  className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-left"
                  onClick={() => openJob(job.job_id)}
                >
                  <span className="font-medium">Job {job.job_id}</span>
                  <span className="text-sm text-gray-600">{job.status}</span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title="No local print history" body="Queue a print job to see it appear here on this device." />
          )}

          <div className="space-y-3">
            <Input label="Lookup print job ID" value={selectedJobId} onChange={(event) => setSelectedJobId(event.target.value)} />
            <Button type="button" onClick={() => void printJobQuery.refetch()} disabled={!selectedJobId.trim()}>
              Load job status
            </Button>
          </div>

          {selectedJobId.trim() ? (
            printJobQuery.isLoading ? (
              <SkeletonLoader variant="rect" height={160} />
            ) : printJobQuery.isError ? (
              <ErrorState error={normalizeApiError(printJobQuery.error)} onRetry={() => void printJobQuery.refetch()} />
            ) : printJobQuery.data ? (
              <div className="grid gap-2 rounded-md border border-gray-200 p-4 text-sm">
                <div><strong>Status:</strong> {printJobQuery.data.status}</div>
                <div><strong>Job type:</strong> {printJobQuery.data.job_type}</div>
                <div><strong>Transaction:</strong> {printJobQuery.data.transaction_id ?? '-'}</div>
                <div><strong>Created:</strong> {printJobQuery.data.created_at ?? '-'}</div>
                <div><strong>Completed:</strong> {printJobQuery.data.completed_at ?? '-'}</div>
              </div>
            ) : null
          ) : null}
        </CardContent>
      </Card>
    </div>
  );

  if (templateQuery.isError && activeTab === 'template') {
    return (
      <PageFrame title="Receipts" subtitle="Manage receipt templates and print jobs.">
        <ErrorState error={normalizeApiError(templateQuery.error)} onRetry={() => void templateQuery.refetch()} />
      </PageFrame>
    );
  }

  return (
    <PageFrame title="Receipts" subtitle="Manage receipt templates and backend-authenticated print jobs.">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          <Button variant={activeTab === 'template' ? 'primary' : 'ghost'} onClick={() => { setActiveTab('template'); setSearchParams({ tab: 'template' }, { replace: true }); }}>Template</Button>
          <Button variant={activeTab === 'queue' ? 'primary' : 'ghost'} onClick={() => { setActiveTab('queue'); setSearchParams({ tab: 'queue' }, { replace: true }); }}>Print Queue</Button>
        </div>

        {activeTab === 'template' && templateQuery.isLoading ? (
          <SkeletonLoader variant="rect" height={260} />
        ) : activeTab === 'template' ? (
          renderTemplateTab()
        ) : (
          renderQueueTab()
        )}

        {serverMessage ? <div className="text-sm text-red-600">{serverMessage}</div> : null}
      </div>
    </PageFrame>
  );
}
