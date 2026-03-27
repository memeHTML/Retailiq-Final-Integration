/* @vitest-environment jsdom */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import InventoryReceiptsPage from './InventoryReceipts';
import { authStore } from '@/stores/authStore';
import { captureHistoryStore } from '@/stores/captureHistoryStore';

const addToast = vi.fn();
const updateTemplateMutateAsync = vi.fn();
const printReceiptMutateAsync = vi.fn();
const receiptTemplateData = {
  id: 1,
  store_id: 77,
  header_text: 'RetailIQ',
  footer_text: 'Thank you',
  show_gstin: true,
  paper_width_mm: 80,
  updated_at: '2026-03-27T10:00:00Z',
};
const receiptJobData = {
  job_id: 501,
  store_id: 77,
  transaction_id: 'TX-501',
  job_type: 'RECEIPT',
  status: 'COMPLETED',
  created_at: '2026-03-27T10:05:00Z',
  completed_at: '2026-03-27T10:05:30Z',
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

vi.mock('@/hooks/receipts', () => ({
  useReceiptTemplateQuery: () => ({
    data: receiptTemplateData,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useUpdateReceiptTemplateMutation: () => ({
    mutateAsync: updateTemplateMutateAsync,
    isPending: false,
  }),
  usePrintReceiptMutation: () => ({
    mutateAsync: printReceiptMutateAsync,
    isPending: false,
  }),
  usePrintJobQuery: (jobId: string | number | null) => {
    if (String(jobId) === '501') {
      return {
        data: receiptJobData,
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
}));

describe('InventoryReceiptsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    captureHistoryStore.getState().clearAll();
    updateTemplateMutateAsync.mockResolvedValue({
      ...receiptTemplateData,
    });
    printReceiptMutateAsync.mockResolvedValue({ job_id: 501 });
    authStore.setState({
      accessToken: 'token',
      refreshToken: 'refresh',
      user: owner,
      isAuthenticated: true,
      role: owner.role,
    });
  });

  it('saves the receipt template with backend-aligned payloads', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <InventoryReceiptsPage />
      </MemoryRouter>,
    );

    await user.clear(screen.getByLabelText(/header text/i));
    await user.type(screen.getByLabelText(/header text/i), 'New Header');
    await user.clear(screen.getByLabelText(/footer text/i));
    await user.type(screen.getByLabelText(/footer text/i), 'New Footer');
    await user.click(screen.getByRole('button', { name: /save template/i }));

    expect(updateTemplateMutateAsync).toHaveBeenCalledWith({
      header_text: 'New Header',
      footer_text: 'New Footer',
      show_gstin: true,
      paper_width_mm: 80,
    });
  });

  it('queues a receipt print job and records the local history snapshot', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <InventoryReceiptsPage />
      </MemoryRouter>,
    );

    await user.click(screen.getAllByRole('button', { name: /print queue/i })[0]);
    await user.type(screen.getAllByLabelText(/transaction id/i)[0], 'TX-501');
    await user.click(screen.getAllByRole('button', { name: /queue print job/i })[0]);

    expect(printReceiptMutateAsync).toHaveBeenCalledWith({
      transaction_id: 'TX-501',
      printer_mac_address: null,
    });
    expect(await screen.findByText(/job 501/i)).toBeTruthy();
    expect(screen.getByText(/status:/i)).toBeTruthy();
    expect(screen.getByText(/^completed$/i, { selector: 'span' })).toBeTruthy();
    await waitFor(() => {
      expect(captureHistoryStore.getState().getReceiptJobs({ storeId: owner.store_id, userId: owner.user_id })[0]?.job_id).toBe(501);
    });
  });
});
