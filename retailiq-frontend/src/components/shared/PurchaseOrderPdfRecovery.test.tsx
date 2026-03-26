/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PurchaseOrderPdfRecovery } from '@/components/shared/PurchaseOrderPdfRecovery';

describe('PurchaseOrderPdfRecovery', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows metadata-backed recovery actions', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const retrySpy = vi.fn();

    const user = userEvent.setup();
    render(
      <PurchaseOrderPdfRecovery
        open
        purchaseOrderId="po-1"
        errorMessage="Unavailable"
        metadata={{ job_id: 'job-123', url: 'https://example.com/job-123', path: '/tmp/job-123.pdf' }}
        onRetry={retrySpy}
        onClose={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /open job url/i }));
    await user.click(screen.getByRole('button', { name: /retry download/i }));

    expect(openSpy).toHaveBeenCalledWith('https://example.com/job-123', '_blank', 'noopener,noreferrer');
    expect(retrySpy).toHaveBeenCalled();
  });

  it('offers retry when no recovery metadata is available', async () => {
    const retrySpy = vi.fn();
    const user = userEvent.setup();

    render(
      <PurchaseOrderPdfRecovery
        open
        purchaseOrderId="po-1"
        errorMessage="Unavailable"
        metadata={null}
        onRetry={retrySpy}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText(/no recovery metadata/i)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /retry download/i }));
    expect(retrySpy).toHaveBeenCalled();
  });
});
