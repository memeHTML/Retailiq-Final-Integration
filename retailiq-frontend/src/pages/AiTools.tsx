import { useEffect, useMemo, useState } from 'react';
import { Bot, ChartColumn, FileSearch, ImagePlus, Loader2, Sparkles, WandSparkles } from 'lucide-react';
import { PageFrame } from '@/components/layout/PageFrame';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { normalizeApiError } from '@/utils/errors';
import {
  useAiForecastMutation,
  useAiPricingOptimizeMutation,
  useAiReceiptDigitizeMutation,
  useAiShelfScanMutation,
  useAiV2RecommendMutation,
} from '@/hooks/aiTools';
import type { AiRecommendation } from '@/types/models';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

type ForecastPoint = { date: string; predicted?: number; value?: number; event_adjusted_forecast?: number };

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read file.'));
    reader.readAsDataURL(file);
  });
}

function linePoints(values: number[]) {
  if (values.length === 0) return '';

  const min = Math.min(...values);
  const max = Math.max(...values);
  const width = Math.max(values.length - 1, 1);
  const height = 40;

  return values
    .map((value, index) => {
      const x = (index / width) * 100;
      const normalized = max === min ? 0.5 : (value - min) / (max - min);
      const y = 100 - normalized * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

function MiniTrend({ points }: { points: ForecastPoint[] }) {
  const values = points.map((point) => Number(point.predicted ?? point.value ?? point.event_adjusted_forecast ?? 0));
  const polyline = linePoints(values);

  if (!values.length) {
    return <EmptyState title="No forecast data" body="Generate a forecast to visualize the output here." />;
  }

  return (
    <svg viewBox="0 0 100 100" className="h-32 w-full">
      <defs>
        <linearGradient id="ai-forecast-gradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke="#2563eb" strokeWidth="2.5" points={polyline} />
      <polygon fill="url(#ai-forecast-gradient)" points={`0,100 ${polyline} 100,100`} />
    </svg>
  );
}

export default function AiToolsPage() {
  const [recommendationContext, setRecommendationContext] = useState('Optimize stock and margin balance across fast-moving products.');
  const [recommendationUserId, setRecommendationUserId] = useState('');
  const [forecastProductId, setForecastProductId] = useState('');
  const [pricingProductIds, setPricingProductIds] = useState('');
  const [shelfFile, setShelfFile] = useState<File | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [shelfImageUrl, setShelfImageUrl] = useState('');
  const [receiptImageUrl, setReceiptImageUrl] = useState('');
  const [recommendations, setRecommendations] = useState<AiRecommendation[]>([]);
  const [forecastPoints, setForecastPoints] = useState<ForecastPoint[]>([]);
  const [pricingResults, setPricingResults] = useState<Array<Record<string, unknown>>>([]);
  const [shelfScanResult, setShelfScanResult] = useState<unknown>(null);
  const [receiptResult, setReceiptResult] = useState<unknown>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const v2RecommendMutation = useAiV2RecommendMutation();
  const forecastMutation = useAiForecastMutation();
  const pricingMutation = useAiPricingOptimizeMutation();
  const shelfMutation = useAiShelfScanMutation();
  const receiptMutation = useAiReceiptDigitizeMutation();

  useEffect(() => {
    return () => {
      if (shelfImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(shelfImageUrl);
      }
      if (receiptImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(receiptImageUrl);
      }
    };
  }, [receiptImageUrl, shelfImageUrl]);

  const forecastSeries = useMemo(() => {
    return forecastPoints.map((point) => Number(point.predicted ?? point.value ?? point.event_adjusted_forecast ?? 0));
  }, [forecastPoints]);

  const runRecommendations = async () => {
    setStatusMessage(null);
    try {
      const response = await v2RecommendMutation.mutateAsync({
        user_id: recommendationUserId.trim() ? Number(recommendationUserId) : undefined,
      });
      setRecommendations(response.recommendations ?? []);
    } catch (error) {
      setStatusMessage(normalizeApiError(error).message);
    }
  };

  const runForecast = async () => {
    setStatusMessage(null);
    if (!forecastProductId.trim()) {
      setStatusMessage('Enter a product ID before generating a forecast.');
      return;
    }

    try {
      const response = await forecastMutation.mutateAsync({ product_id: forecastProductId.trim() });
      const points = ((response as { forecast?: ForecastPoint[] }).forecast ?? []) as ForecastPoint[];
      setForecastPoints(points);
    } catch (error) {
      setStatusMessage(normalizeApiError(error).message);
    }
  };

  const runPricingOptimizer = async () => {
    setStatusMessage(null);
    const productIds = pricingProductIds
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    if (!productIds.length) {
      setStatusMessage('Enter at least one product ID.');
      return;
    }

    try {
      const response = await pricingMutation.mutateAsync({ product_ids: productIds });
      setPricingResults(Array.isArray(response) ? response : (response as { data?: Array<Record<string, unknown>> }).data ?? []);
    } catch (error) {
      setStatusMessage(normalizeApiError(error).message);
    }
  };

  const analyzeShelfScan = async () => {
    setStatusMessage(null);
    if (!shelfImageUrl) {
      setStatusMessage('Upload a shelf image first.');
      return;
    }

    try {
      const response = await shelfMutation.mutateAsync({ image_url: shelfImageUrl });
      setShelfScanResult(response);
    } catch (error) {
      setStatusMessage(normalizeApiError(error).message);
    }
  };

  const digitizeReceipt = async () => {
    setStatusMessage(null);
    if (!receiptImageUrl) {
      setStatusMessage('Upload a receipt image first.');
      return;
    }

    try {
      const response = await receiptMutation.mutateAsync({ image_url: receiptImageUrl });
      setReceiptResult(response);
    } catch (error) {
      setStatusMessage(normalizeApiError(error).message);
    }
  };

  return (
    <PageFrame
      title="AI Tools"
      subtitle="Recommendations, forecasting, pricing, and vision utilities powered by the AI v2 endpoints."
    >
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot size={18} />
              AI recommendations
            </CardTitle>
            <Badge variant="secondary">Backend v2 first</Badge>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_auto]">
            <div className="space-y-3">
              <Textarea
                rows={4}
                value={recommendationContext}
                onChange={(event) => setRecommendationContext(event.target.value)}
                placeholder="Describe the business context you want recommendations for..."
              />
              <Input
                label="Optional user ID"
                value={recommendationUserId}
                onChange={(event) => setRecommendationUserId(event.target.value)}
                placeholder="Leave blank to use the current user"
              />
            </div>
            <div className="flex flex-col justify-between gap-3">
              <Button onClick={() => void runRecommendations()} disabled={v2RecommendMutation.isPending}>
                {v2RecommendMutation.isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Sparkles size={16} className="mr-2" />}
                Generate recommendations
              </Button>
              <p className="text-sm text-gray-500">
                Context is captured locally for the operator while the backend returns the current recommendation set.
              </p>
            </div>
          </CardContent>
          <CardContent className="pt-0">
            {recommendations.length === 0 ? (
              <EmptyState title="No recommendations yet" body="Run the recommendation engine to populate actionable suggestions." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {recommendations.map((rec) => (
                  <div key={`${rec.product_id}-${rec.product_name}`} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <strong>{rec.product_name}</strong>
                      <Badge variant="info">{rec.score.toFixed(2)}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{rec.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ChartColumn size={18} />
                Forecast
              </CardTitle>
              <Badge variant="secondary">/api/v2/ai/forecast</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Product ID"
                value={forecastProductId}
                onChange={(event) => setForecastProductId(event.target.value)}
                placeholder="e.g. 123"
              />
              <Button onClick={() => void runForecast()} disabled={forecastMutation.isPending}>
                {forecastMutation.isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
                Generate forecast
              </Button>
              <MiniTrend points={forecastPoints} />
              {forecastSeries.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {forecastPoints.map((point) => (
                    <Badge key={point.date} variant="info">
                      {point.date}: {Number(point.predicted ?? point.value ?? point.event_adjusted_forecast ?? 0).toFixed(1)}
                    </Badge>
                  ))}
                </div>
              ) : (
                <EmptyState title="No forecast yet" body="Run a forecast to see historical and projected values." />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <WandSparkles size={18} />
                Pricing optimizer
              </CardTitle>
              <Badge variant="secondary">/api/v2/ai/pricing/optimize</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Product IDs"
                value={pricingProductIds}
                onChange={(event) => setPricingProductIds(event.target.value)}
                placeholder="Comma-separated IDs, e.g. 12, 31, 44"
              />
              <Button onClick={() => void runPricingOptimizer()} disabled={pricingMutation.isPending}>
                {pricingMutation.isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
                Optimize pricing
              </Button>
              {pricingResults.length === 0 ? (
                <EmptyState title="No pricing suggestions" body="Optimize one or more products to see backend guidance." />
              ) : (
                <div className="space-y-3">
                  {pricingResults.map((result, index) => (
                    <div key={`${index}-${String(result.product_id ?? result.product_name ?? 'price')}`} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <strong>{String(result.product_name ?? result.product_id ?? 'Product')}</strong>
                        <Badge variant="secondary">{String(result.suggestion_type ?? 'STABLE')}</Badge>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        Suggested price: {String(result.suggested_price ?? result.price ?? 'N/A')}
                      </div>
                      {result.reason ? <p className="mt-2 text-sm text-gray-500">{String(result.reason)}</p> : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ImagePlus size={18} />
                Shelf scan
              </CardTitle>
              <Badge variant="secondary">/api/v2/ai/vision/shelf-scan</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="block space-y-2 text-sm font-medium text-gray-700">
                <span>Upload shelf image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (event) => {
                    const file = event.target.files?.[0] ?? null;
                    if (!file) {
                      setShelfFile(null);
                      setShelfImageUrl('');
                      return;
                    }

                    if (file.size > MAX_UPLOAD_BYTES) {
                      setStatusMessage('Shelf images must be 5MB or smaller.');
                      return;
                    }

                    const previewUrl = await readFileAsDataUrl(file);
                    setShelfFile(file);
                    setShelfImageUrl(previewUrl);
                  }}
                />
              </label>
              {shelfFile ? <p className="text-sm text-gray-500">Selected: {shelfFile.name}</p> : null}
              <Button onClick={() => void analyzeShelfScan()} disabled={shelfMutation.isPending || !shelfImageUrl}>
                {shelfMutation.isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
                Analyze shelf
              </Button>
              {shelfScanResult ? (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm">
                  <pre className="overflow-auto whitespace-pre-wrap">{JSON.stringify(shelfScanResult, null, 2)}</pre>
                </div>
              ) : (
                <EmptyState title="No shelf analysis yet" body="Upload a shelf photo to get detected products and gaps." />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileSearch size={18} />
                Receipt digitization
              </CardTitle>
              <Badge variant="secondary">/api/v2/ai/vision/receipt</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="block space-y-2 text-sm font-medium text-gray-700">
                <span>Upload receipt image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (event) => {
                    const file = event.target.files?.[0] ?? null;
                    if (!file) {
                      setReceiptFile(null);
                      setReceiptImageUrl('');
                      return;
                    }

                    if (file.size > MAX_UPLOAD_BYTES) {
                      setStatusMessage('Receipt images must be 5MB or smaller.');
                      return;
                    }

                    const previewUrl = await readFileAsDataUrl(file);
                    setReceiptFile(file);
                    setReceiptImageUrl(previewUrl);
                  }}
                />
              </label>
              {receiptFile ? <p className="text-sm text-gray-500">Selected: {receiptFile.name}</p> : null}
              <Button onClick={() => void digitizeReceipt()} disabled={receiptMutation.isPending || !receiptImageUrl}>
                {receiptMutation.isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
                Digitize receipt
              </Button>
              {receiptResult ? (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm">
                  <pre className="overflow-auto whitespace-pre-wrap">{JSON.stringify(receiptResult, null, 2)}</pre>
                </div>
              ) : (
                <EmptyState title="No receipt analysis yet" body="Upload a receipt photo to extract line items and totals." />
              )}
            </CardContent>
          </Card>
        </div>

        {statusMessage ? <p className="text-sm text-red-600">{statusMessage}</p> : null}
      </div>
    </PageFrame>
  );
}
