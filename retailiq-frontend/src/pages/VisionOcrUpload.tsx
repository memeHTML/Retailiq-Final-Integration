import { useState } from 'react';
import { generatePath, useNavigate } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { routes } from '@/routes/routes';
import { FileUploadDropzone } from '@/components/ui/FileUploadDropzone';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useAiReceiptDigitizeMutation, useAiShelfScanMutation } from '@/hooks/aiTools';
import { useUploadOcrMutation } from '@/hooks/vision';
import { uiStore } from '@/stores/uiStore';
import { normalizeApiError } from '@/utils/errors';

export default function VisionOcrUploadPage() {
  const navigate = useNavigate();
  const addToast = uiStore((state) => state.addToast);
  const ocrUploadMutation = useUploadOcrMutation();
  const shelfScanMutation = useAiShelfScanMutation();
  const receiptDigitizeMutation = useAiReceiptDigitizeMutation();

  const [activeTab, setActiveTab] = useState<'upload' | 'shelf' | 'receipt'>('upload');
  const [error, setError] = useState<string | null>(null);
  const [shelfImageUrl, setShelfImageUrl] = useState('');
  const [receiptImageUrl, setReceiptImageUrl] = useState('');
  const [shelfResult, setShelfResult] = useState<unknown>(null);
  const [receiptResult, setReceiptResult] = useState<unknown>(null);

  if (ocrUploadMutation.isError) {
    return <ErrorState error={normalizeApiError(ocrUploadMutation.error)} onRetry={() => void ocrUploadMutation.reset()} />;
  }

  const onRunShelfScan = async () => {
    setError(null);
    if (!shelfImageUrl.trim()) {
      addToast({ title: 'Image URL required', message: 'Enter a shelf image URL before calling the AI vision endpoint.', variant: 'warning' });
      return;
    }

    try {
      const result = await shelfScanMutation.mutateAsync({ image_url: shelfImageUrl.trim() });
      setShelfResult(result);
      addToast({ title: 'Shelf scan complete', message: 'AI shelf scan response received from the backend.', variant: 'success' });
    } catch (err) {
      setError(normalizeApiError(err).message);
    }
  };

  const onDigitizeReceipt = async () => {
    setError(null);
    if (!receiptImageUrl.trim()) {
      addToast({ title: 'Image URL required', message: 'Enter a receipt image URL before digitizing.', variant: 'warning' });
      return;
    }

    try {
      const result = await receiptDigitizeMutation.mutateAsync({ image_url: receiptImageUrl.trim() });
      setReceiptResult(result);
      addToast({ title: 'Receipt digitized', message: 'AI receipt extraction response received from the backend.', variant: 'success' });
    } catch (err) {
      setError(normalizeApiError(err).message);
    }
  };

  return (
    <PageFrame title="Vision Tools" subtitle="Upload OCR jobs, run shelf scans, and digitize receipt images using the backend vision endpoints.">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          <Button variant={activeTab === 'upload' ? 'primary' : 'ghost'} onClick={() => setActiveTab('upload')}>OCR Upload</Button>
          <Button variant={activeTab === 'shelf' ? 'primary' : 'ghost'} onClick={() => setActiveTab('shelf')}>Shelf Scan</Button>
          <Button variant={activeTab === 'receipt' ? 'primary' : 'ghost'} onClick={() => setActiveTab('receipt')}>Receipt Digitize</Button>
        </div>

        {activeTab === 'upload' ? (
          <Card>
            <CardHeader>
              <CardTitle>Invoice OCR Upload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ocrUploadMutation.isPending ? <SkeletonLoader variant="rect" height={220} /> : null}
              <FileUploadDropzone
                accept="image/png,image/jpg,image/jpeg"
                label="Invoice image"
                onFileSelected={async (file) => {
                  setError(null);
                  try {
                    const result = await ocrUploadMutation.mutateAsync({ invoice_image: file });
                    addToast({ title: 'OCR queued', message: `Job ${result.job_id}`, variant: 'info' });
                    navigate(generatePath(routes.visionOcrReview, { jobId: result.job_id }), { replace: true });
                  } catch (err) {
                    setError(normalizeApiError(err).message);
                  }
                }}
                disabled={ocrUploadMutation.isPending}
              />
            </CardContent>
          </Card>
        ) : null}

        {activeTab === 'shelf' ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Shelf Scan</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <Input label="Shelf image URL" value={shelfImageUrl} onChange={(event) => setShelfImageUrl(event.target.value)} placeholder="https://..." />
                <Button onClick={() => void onRunShelfScan()} loading={shelfScanMutation.isPending}>
                  Run shelf scan
                </Button>
              </CardContent>
            </Card>

            {shelfResult ? (
              <Card>
                <CardHeader>
                  <CardTitle>Shelf Scan Response</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="overflow-x-auto rounded-md bg-gray-900 p-4 text-sm text-gray-100">
                    {JSON.stringify(shelfResult, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            ) : (
              <EmptyState title="No shelf scan yet" body="Submit a public image URL to inspect the backend shelf-scan response." />
            )}
          </div>
        ) : null}

        {activeTab === 'receipt' ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Receipt Digitization</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <Input label="Receipt image URL" value={receiptImageUrl} onChange={(event) => setReceiptImageUrl(event.target.value)} placeholder="https://..." />
                <Button onClick={() => void onDigitizeReceipt()} loading={receiptDigitizeMutation.isPending}>
                  Digitize receipt
                </Button>
              </CardContent>
            </Card>

            {receiptResult ? (
              <Card>
                <CardHeader>
                  <CardTitle>Receipt Digitization Response</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="overflow-x-auto rounded-md bg-gray-900 p-4 text-sm text-gray-100">
                    {JSON.stringify(receiptResult, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            ) : (
              <EmptyState title="No digitization yet" body="Submit a receipt image URL to inspect the AI receipt response from the backend." />
            )}
          </div>
        ) : null}

        {error ? <div className="text-sm text-red-600">{error}</div> : null}
      </div>
    </PageFrame>
  );
}
