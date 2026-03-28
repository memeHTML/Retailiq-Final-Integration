/* @vitest-environment jsdom */
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import InventoryVisionPage from './InventoryVision';
import { authStore } from '@/stores/authStore';
import { captureHistoryStore } from '@/stores/captureHistoryStore';
import { within } from '@testing-library/react';

const addToast = vi.fn();
const uploadMutateAsync = vi.fn();
const confirmMutateAsync = vi.fn();
const dismissMutateAsync = vi.fn();
const visionJobData = {
  job_id: 'job-1',
  status: 'REVIEW',
  error_message: null,
  items: [
    {
      item_id: 'item-1',
      raw_text: 'Milk 2 x 50',
      matched_product_id: 10,
      product_name: 'Product 10',
      confidence: 0.95,
      quantity: 2,
      unit_price: 50,
      is_confirmed: false,
    },
  ],
};
const visionReviewJobs = {
  'job-1': visionJobData,
  'job-501': { ...visionJobData, job_id: 'job-501' },
};
const visionResolvedProduct = {
  product_id: 10,
  name: 'Product 10',
  sku_code: 'SKU-10',
  current_stock: 12,
  selling_price: 99,
};

const owner = {
  user_id: 11,
  mobile_number: '9000000000',
  full_name: 'Owner',
  email: 'owner@example.com',
  role: 'owner' as const,
  store_id: 77,
};

vi.mock('@/stores/uiStore', () => ({
  uiStore: (selector: (state: { addToast: typeof addToast }) => unknown) => selector({ addToast }),
}));

vi.mock('@/components/shared/ProductPicker', () => {
  const validProductIds = new Set(['10']);

  return {
    ProductPicker: ({ value, onChange, label, helperText, onResolutionChange }: {
      value: string;
      onChange: (value: string) => void;
      label?: string;
      helperText?: string;
      onResolutionChange?: (resolution: { product: null | { product_id: number; name: string; sku_code: string; current_stock: number; selling_price: number }; isLoading: boolean; isError: boolean }) => void;
    }) => {
      const product = value && validProductIds.has(value)
        ? visionResolvedProduct
        : null;

      useEffect(() => {
        onResolutionChange?.({
          product,
          isLoading: false,
          isError: Boolean(value) && !product,
        });
      }, [product, value, onResolutionChange]);

      return (
        <div>
          <label className="block">
            <span>{label}</span>
            <input aria-label={label ?? 'Product'} value={value} onChange={(event) => onChange(event.target.value)} />
          </label>
          {helperText ? <p>{helperText}</p> : null}
        </div>
      );
    },
  };
});

vi.mock('@/hooks/vision', () => ({
  useUploadOcrMutation: () => ({
    mutateAsync: uploadMutateAsync,
    isPending: false,
  }),
  useOcrJobQuery: (jobId: string | null) => {
    if (jobId === 'job-501' || jobId === 'job-1') {
      return {
        data: visionReviewJobs[jobId],
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      };
    }

    return {
      data: null,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    };
  },
  useConfirmOcrMutation: () => ({
    mutateAsync: confirmMutateAsync,
    isPending: false,
  }),
  useDismissOcrMutation: () => ({
    mutateAsync: dismissMutateAsync,
    isPending: false,
  }),
}));

function renderPage(entry = '/inventory/vision') {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const invalidateQueries = vi.spyOn(QueryClient.prototype, 'invalidateQueries');

  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[entry]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/inventory/vision" element={<InventoryVisionPage />} />
          <Route path="/inventory/vision/:jobId" element={<InventoryVisionPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

  return { client, invalidateQueries };
}

describe('InventoryVisionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    captureHistoryStore.getState().clearAll();
    uploadMutateAsync.mockResolvedValue({ job_id: 'job-501' });
    confirmMutateAsync.mockResolvedValue({ message: 'confirmed' });
    dismissMutateAsync.mockResolvedValue({ message: 'dismissed' });
    authStore.setState({
      accessToken: 'token',
      refreshToken: 'refresh',
      user: owner,
      isAuthenticated: true,
      role: owner.role,
    });
  });

  it('rejects unsupported OCR upload files before mutation', async () => {
    const user = userEvent.setup();
    renderPage('/inventory/vision');

    const fileInput = screen.getAllByLabelText(/invoice or receipt image/i)[0];
    await user.upload(fileInput, new File(['image-data'], 'receipt.gif', { type: 'image/png' }));

    await waitFor(() => {
      expect(screen.getByText(/upload an image file only/i)).toBeTruthy();
    });
    expect(uploadMutateAsync).not.toHaveBeenCalled();
  });

  it('uploads an OCR image, transitions to review, and records local history', async () => {
    const user = userEvent.setup();
    renderPage('/inventory/vision');

    const fileInput = screen.getAllByLabelText(/invoice or receipt image/i)[0];
    await user.upload(fileInput, new File(['image-data'], 'receipt.png', { type: 'image/png' }));

    expect(uploadMutateAsync).toHaveBeenCalledWith({
      invoice_image: expect.any(File),
    });
    expect((uploadMutateAsync.mock.calls[0]?.[0] as { invoice_image: File }).invoice_image.name).toBe('receipt.png');
    expect(await screen.findByText(/ocr job job-501/i)).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /job job-501/i })[0]).toBeTruthy();
    await waitFor(() => {
      expect(captureHistoryStore.getState().getOcrJobs({ storeId: owner.store_id, userId: owner.user_id })[0]?.job_id).toBe('job-501');
    });
  });

  it('confirms OCR items with validated payloads and invalidates inventory caches', async () => {
    const user = userEvent.setup();
    const { invalidateQueries } = renderPage('/inventory/vision/job-1?tab=review&jobId=job-1');

    await waitFor(() => {
      expect((screen.getAllByRole('button', { name: /confirm items/i })[0] as HTMLButtonElement).disabled).toBe(false);
    });

    await user.click(screen.getAllByRole('button', { name: /confirm items/i })[0]);
    const dialog = screen.getByRole('dialog', { name: /confirm ocr items\?/i });
    await user.type(within(dialog).getByLabelText(/type confirm to confirm/i), 'CONFIRM');
    await user.click(within(dialog).getByRole('button', { name: /confirm items/i }));

    expect(confirmMutateAsync).toHaveBeenCalledWith({
      jobId: 'job-1',
      payload: {
        confirmed_items: [
          {
            item_id: 'item-1',
            quantity: 2,
            matched_product_id: 10,
            unit_price: 50,
          },
        ],
      },
    });
    await waitFor(() => {
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['inventory'] });
    });
  });

  it('dismisses OCR jobs through the backend contract', async () => {
    const user = userEvent.setup();
    renderPage('/inventory/vision/job-1?tab=review&jobId=job-501');

    await user.click(screen.getAllByRole('button', { name: /dismiss job/i })[0]);
    const dialog = screen.getByRole('dialog', { name: /dismiss ocr job\?/i });
    await user.type(within(dialog).getByLabelText(/type dismiss to confirm/i), 'DISMISS');
    await user.click(within(dialog).getByRole('button', { name: /dismiss job/i }));

    expect(dismissMutateAsync).toHaveBeenCalledWith('job-1');
  });
});
