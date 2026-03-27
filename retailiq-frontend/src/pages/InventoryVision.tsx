import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { generatePath, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FileUploadDropzone } from '@/components/ui/FileUploadDropzone';
import { Input } from '@/components/ui/Input';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useConfirmOcrMutation, useDismissOcrMutation, useOcrJobQuery, useUploadOcrMutation } from '@/hooks/vision';
import { ProductPicker, type ProductResolution } from '@/components/shared/ProductPicker';
import { routes } from '@/routes/routes';
import { authStore } from '@/stores/authStore';
import { captureHistoryScopeKey, captureHistoryStore } from '@/stores/captureHistoryStore';
import { uiStore } from '@/stores/uiStore';
import { normalizeApiError } from '@/utils/errors';

type VisionTab = 'upload' | 'review';

type DraftItem = {
  item_id: string;
  raw_text: string;
  matched_product_id: string;
  quantity: string;
  unit_price: string;
};

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg']);
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const isAllowedVisionFile = (file: File) => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  return ALLOWED_TYPES.has(file.type) && (extension === 'png' || extension === 'jpg' || extension === 'jpeg');
};

export default function InventoryVisionPage() {
  const navigate = useNavigate();
  const params = useParams<{ jobId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const addToast = uiStore((state) => state.addToast);
  const queryClient = useQueryClient();
  const user = authStore((state) => state.user);
  const scope = useMemo(() => (user && user.store_id != null ? { storeId: user.store_id, userId: user.user_id } : null), [user]);
  const scopeKey = scope ? captureHistoryScopeKey(scope) : null;
  const ocrHistory = captureHistoryStore((state) => (scopeKey ? state.scopes[scopeKey]?.ocr ?? [] : []));

  const [activeTab, setActiveTab] = useState<VisionTab>((searchParams.get('tab') === 'review' ? 'review' : 'upload'));
  const initialJobId = params.jobId ?? searchParams.get('jobId') ?? '';
  const [selectedJobId, setSelectedJobId] = useState(initialJobId);
  const [manualJobId, setManualJobId] = useState(initialJobId);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dismissOpen, setDismissOpen] = useState(false);
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [productResolutions, setProductResolutions] = useState<Record<string, ProductResolution>>({});

  const uploadMutation = useUploadOcrMutation();
  const reviewQuery = useOcrJobQuery(selectedJobId || null);
  const confirmMutation = useConfirmOcrMutation();
  const dismissMutation = useDismissOcrMutation();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'upload' || tab === 'review') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (params.jobId) {
      setSelectedJobId(params.jobId);
      setManualJobId(params.jobId);
      setActiveTab('review');
      setSearchParams({ tab: 'review', jobId: params.jobId }, { replace: true });
    }
  }, [params.jobId, setSearchParams]);

  useEffect(() => {
    if (!reviewQuery.data) {
      return;
    }

    setDraftItems(
      reviewQuery.data.items.map((item) => ({
        item_id: item.item_id,
        raw_text: item.raw_text,
        matched_product_id: item.matched_product_id == null ? '' : String(item.matched_product_id),
        quantity: item.quantity == null ? '' : String(item.quantity),
        unit_price: item.unit_price == null ? '' : String(item.unit_price),
      })),
    );
    setProductResolutions({});
    setReviewError(null);

    if (scope) {
      captureHistoryStore.getState().recordOcrJob(scope, {
        job_id: reviewQuery.data.job_id,
        status: reviewQuery.data.status,
        error_message: reviewQuery.data.error_message,
        item_count: reviewQuery.data.items.length,
        updated_at: new Date().toISOString(),
      });
    }
  }, [reviewQuery.data, scope]);

  useEffect(() => {
    if (!reviewQuery.isError || activeTab !== 'review') {
      return;
    }

    setReviewError(normalizeApiError(reviewQuery.error).message);
  }, [reviewQuery.error, reviewQuery.isError, activeTab]);

  useEffect(() => {
    if (!ocrHistory.length || selectedJobId) {
      return;
    }

    setSelectedJobId(ocrHistory[0].job_id);
    setManualJobId(ocrHistory[0].job_id);
  }, [ocrHistory, selectedJobId]);

  const startReview = (jobId: string) => {
    setSelectedJobId(jobId);
    setManualJobId(jobId);
    setActiveTab('review');
    setReviewError(null);
    setSearchParams({ tab: 'review', jobId }, { replace: true });
    navigate(`${generatePath(routes.inventoryVisionReview, { jobId })}?tab=review`, { replace: true });
  };

  const uploadFile = async (file: File) => {
    setUploadError(null);

    if (!isAllowedVisionFile(file)) {
      setUploadError('Upload an image file only. PNG, JPG, and JPEG are supported.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File too large. OCR uploads are limited to 10 MB.');
      return;
    }

    try {
      const result = await uploadMutation.mutateAsync({ invoice_image: file });
      if (scope) {
        captureHistoryStore.getState().recordOcrJob(scope, {
          job_id: result.job_id,
          status: 'QUEUED',
          error_message: null,
          item_count: 0,
          updated_at: new Date().toISOString(),
        });
      }

      addToast({ title: 'OCR queued', message: `Job ${result.job_id} was submitted to the backend.`, variant: 'info' });
      startReview(result.job_id);
    } catch (error) {
      setUploadError(normalizeApiError(error).message);
    }
  };

  const loadJob = () => {
    const jobId = manualJobId.trim();
    if (!jobId) {
      setReviewError('OCR job ID is required.');
      return;
    }

    setReviewError(null);
    startReview(jobId);
  };

  const buildConfirmedItems = () => {
    const confirmedItems = draftItems.map((item) => {
      const quantity = Number(item.quantity);
      const matchedProductId = Number(item.matched_product_id);
      const unitPrice = item.unit_price.trim() ? Number(item.unit_price) : null;
      const resolution = productResolutions[item.item_id];

      if (!item.item_id || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(matchedProductId) || matchedProductId <= 0) {
        return null;
      }

      if (!resolution?.product || resolution.isLoading || resolution.isError) {
        return null;
      }

      if (unitPrice !== null && (!Number.isFinite(unitPrice) || unitPrice < 0)) {
        return null;
      }

      return {
        item_id: item.item_id,
        quantity,
        matched_product_id: matchedProductId,
        ...(unitPrice === null ? {} : { unit_price: unitPrice }),
      };
    });

    if (confirmedItems.some((item) => item === null)) {
      return { confirmedItems: null, error: 'Every OCR row must be matched to a product and have valid quantity and unit price values.' };
    }

    return { confirmedItems: confirmedItems as Array<{ item_id: string; quantity: number; matched_product_id: number; unit_price?: number | null }>, error: null };
  };

  const submitConfirm = async () => {
    if (!selectedJobId.trim()) {
      setReviewError('Select an OCR job before confirming.');
      return;
    }

    const { confirmedItems, error } = buildConfirmedItems();
    if (!confirmedItems) {
      setReviewError(error);
      return;
    }

    try {
      await confirmMutation.mutateAsync({ jobId: selectedJobId, payload: { confirmed_items: confirmedItems } });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      addToast({ title: 'OCR confirmed', message: 'The backend applied the reviewed OCR items.', variant: 'success' });
      setConfirmOpen(false);
      void reviewQuery.refetch();
    } catch (err) {
      setReviewError(normalizeApiError(err).message);
    }
  };

  const submitDismiss = async () => {
    if (!selectedJobId.trim()) {
      setReviewError('Select an OCR job before dismissing.');
      return;
    }

    try {
      await dismissMutation.mutateAsync(selectedJobId);
      addToast({ title: 'OCR dismissed', message: 'The OCR job was marked failed by the backend.', variant: 'warning' });
      setDismissOpen(false);
      void reviewQuery.refetch();
    } catch (err) {
      setReviewError(normalizeApiError(err).message);
    }
  };

  const updateDraftItem = (itemId: string, patch: Partial<DraftItem>) => {
    setDraftItems((current) => current.map((item) => (item.item_id === itemId ? { ...item, ...patch } : item)));
  };

  const updateProductResolution = (itemId: string, resolution: ProductResolution) => {
    setProductResolutions((current) => {
      const previous = current[itemId];
      if (
        previous &&
        previous.product?.product_id === resolution.product?.product_id &&
        previous.isLoading === resolution.isLoading &&
        previous.isError === resolution.isError
      ) {
        return current;
      }

      return {
        ...current,
        [itemId]: resolution,
      };
    });
  };

  const reviewState = reviewQuery.data?.status ?? null;
  const canConfirm = reviewState === 'REVIEW' && draftItems.length > 0 && draftItems.every((item) => {
    const resolution = productResolutions[item.item_id];
    const quantity = Number(item.quantity);
    const matchedProductId = Number(item.matched_product_id);
    const unitPrice = item.unit_price.trim() ? Number(item.unit_price) : null;

    return Boolean(
      resolution?.product &&
      !resolution.isLoading &&
      !resolution.isError &&
      item.item_id &&
      Number.isFinite(quantity) &&
      quantity > 0 &&
      Number.isFinite(matchedProductId) &&
      matchedProductId > 0 &&
      (unitPrice === null || (Number.isFinite(unitPrice) && unitPrice >= 0)),
    );
  });
  const canDismiss = Boolean(reviewState && ['REVIEW', 'QUEUED', 'PROCESSING'].includes(reviewState));

  const renderUpload = () => (
    <Card>
      <CardHeader>
        <CardTitle>OCR upload</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FileUploadDropzone
          accept="image/png,image/jpeg,.jpg,.jpeg"
          label="Invoice or receipt image"
          helperText="Upload a PNG, JPG, or JPEG image up to 10 MB."
          error={uploadError}
          disabled={uploadMutation.isPending}
          onFileSelected={(file) => {
            void uploadFile(file);
          }}
        />
        {uploadMutation.isPending ? <SkeletonLoader variant="rect" height={180} /> : null}
      </CardContent>
    </Card>
  );

  const renderHistory = () => (
    <Card>
      <CardHeader>
        <CardTitle>Local OCR history</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          This history is local convenience only. The backend authoritative state always comes from the OCR job endpoint.
        </p>
        {ocrHistory.length > 0 ? (
          <div className="grid gap-2">
            {ocrHistory.map((job) => (
              <button key={job.job_id} type="button" className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-left" onClick={() => startReview(job.job_id)}>
                <span className="font-medium">Job {job.job_id}</span>
                <span className="text-sm text-gray-600">{job.status}</span>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState title="No local OCR history" body="Upload an OCR job to see it appear here on this device." />
        )}
      </CardContent>
    </Card>
  );

  const renderReview = () => {
    if (!selectedJobId.trim()) {
      return <EmptyState title="Select an OCR job" body="Upload a document or enter a job ID to review OCR results." />;
    }

    if (reviewQuery.isLoading) {
      return <SkeletonLoader variant="rect" height={320} />;
    }

    if (reviewQuery.isError) {
      return <ErrorState error={normalizeApiError(reviewQuery.error)} onRetry={() => void reviewQuery.refetch()} />;
    }

    if (!reviewQuery.data) {
      return <EmptyState title="OCR job not found" body="The selected OCR job is unavailable." />;
    }

    const status = reviewQuery.data.status;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>OCR job {reviewQuery.data.job_id}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <div><strong>Status:</strong> {status}</div>
            <div><strong>Error:</strong> {reviewQuery.data.error_message ?? '-'}</div>
            <div><strong>Items:</strong> {reviewQuery.data.items.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Load OCR job</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <Input label="Job ID" value={manualJobId} onChange={(event) => setManualJobId(event.target.value)} placeholder="Enter OCR job ID" />
            <Button type="button" onClick={loadJob}>
              Load job
            </Button>
          </CardContent>
        </Card>

        {reviewQuery.data.items.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Review items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {reviewQuery.data.items.map((item) => {
                  const draft = draftItems.find((entry) => entry.item_id === item.item_id);

                  return (
                    <div key={item.item_id} className="grid gap-3 rounded-md border border-gray-200 p-4">
                      <div className="text-sm font-medium">{item.raw_text}</div>
                      <div className="grid gap-3 md:grid-cols-4">
                        <div className="md:col-span-2">
                          <ProductPicker
                            value={draft?.matched_product_id ?? ''}
                            onChange={(productId) => updateDraftItem(item.item_id, { matched_product_id: productId })}
                            label="Matched product"
                            helperText="Browse inventory pages or load an exact product ID for this OCR item."
                            onResolutionChange={(resolution) => updateProductResolution(item.item_id, resolution)}
                          />
                        </div>
                        <Input
                          label="Quantity"
                          type="number"
                          value={draft?.quantity ?? ''}
                          onChange={(event) => updateDraftItem(item.item_id, { quantity: event.target.value })}
                        />
                        <Input
                          label="Unit price"
                          type="number"
                          value={draft?.unit_price ?? ''}
                          onChange={(event) => updateDraftItem(item.item_id, { unit_price: event.target.value })}
                        />
                        <div className="grid gap-1 text-sm">
                          <span className="text-xs uppercase tracking-[0.12em] text-gray-500">Confidence</span>
                          <span>{item.confidence}</span>
                          <span className="text-xs text-gray-500">Confirmed: {item.is_confirmed ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">Matched product ID: {item.matched_product_id ?? '-'}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          <EmptyState title="No items extracted" body="This OCR job did not return any line items." />
        )}

        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={() => setConfirmOpen(true)} disabled={!canConfirm}>
            Confirm items
          </Button>
          <Button type="button" variant="secondary" onClick={() => setDismissOpen(true)} disabled={!canDismiss}>
            Dismiss job
          </Button>
          <Button type="button" variant="ghost" onClick={() => void reviewQuery.refetch()}>
            Refresh
          </Button>
        </div>
      </div>
    );
  };

  return (
    <PageFrame title="Vision OCR" subtitle="Upload OCR jobs and review extracted line items with the backend OCR endpoint.">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          <Button variant={activeTab === 'upload' ? 'primary' : 'ghost'} onClick={() => { setActiveTab('upload'); setSearchParams({ tab: 'upload' }, { replace: true }); }}>Upload</Button>
          <Button variant={activeTab === 'review' ? 'primary' : 'ghost'} onClick={() => { setActiveTab('review'); setSearchParams({ tab: 'review', jobId: selectedJobId || manualJobId }, { replace: true }); }}>Review</Button>
        </div>

        {activeTab === 'upload' ? renderUpload() : null}
        {activeTab === 'review' ? renderReview() : null}
        {activeTab === 'review' ? renderHistory() : null}

        {reviewError ? <div className="text-sm text-red-600">{reviewError}</div> : null}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm OCR items?"
        body="This will update stock using the reviewed OCR results. This action cannot be undone."
        confirmLabel={confirmMutation.isPending ? 'Confirming...' : 'Confirm items'}
        destructive
        requireTypedConfirmation="CONFIRM"
        onConfirm={() => void submitConfirm()}
        onCancel={() => setConfirmOpen(false)}
      />

      <ConfirmDialog
        open={dismissOpen}
        title="Dismiss OCR job?"
        body="This will mark the OCR job as failed on the backend."
        confirmLabel={dismissMutation.isPending ? 'Dismissing...' : 'Dismiss job'}
        destructive
        requireTypedConfirmation="DISMISS"
        onConfirm={() => void submitDismiss()}
        onCancel={() => setDismissOpen(false)}
      />
    </PageFrame>
  );
}
