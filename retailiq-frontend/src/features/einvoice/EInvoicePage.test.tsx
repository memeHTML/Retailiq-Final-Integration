/* @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import EInvoicePage from './EInvoicePage';

let generateMutate = vi.fn();

type InvoiceStatusError = { status: number; message: string } | null;

const state = {
  generate: {
    data: {
      invoice_id: 'inv-1',
      transaction_id: 'txn-1',
      country_code: 'IN',
      invoice_format: 'STANDARD',
      invoice_number: 'IRN-1',
      authority_ref: 'AUTH-1',
      status: 'SUBMITTED',
      submitted_at: '2026-03-26T10:00:00Z',
      qr_code_url: 'https://example.com/qr.png',
    },
    isPending: false,
    isError: false,
    error: null,
    mutateAsync: generateMutate,
  },
  status: {
    data: null as null | Record<string, unknown>,
    isLoading: false,
    error: { status: 404, message: 'E-Invoice not found' } as InvoiceStatusError,
    refetch: vi.fn(),
  },
};

vi.mock('@/hooks/useEinvoice', () => ({
  useGenerateEinvoice: () => state.generate,
  useEinvoiceStatus: () => state.status,
}));

describe('EInvoicePage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    generateMutate = vi.fn();
    state.generate = {
      data: {
        invoice_id: 'inv-1',
        transaction_id: 'txn-1',
        country_code: 'IN',
        invoice_format: 'STANDARD',
        invoice_number: 'IRN-1',
        authority_ref: 'AUTH-1',
        status: 'SUBMITTED',
        submitted_at: '2026-03-26T10:00:00Z',
        qr_code_url: 'https://example.com/qr.png',
      },
      isPending: false,
      isError: false,
      error: null,
      mutateAsync: generateMutate,
    };
    state.status = {
      data: null,
      isLoading: false,
      error: { status: 404, message: 'E-Invoice not found' } as InvoiceStatusError,
      refetch: vi.fn(),
    };
  });

  it('shows all generated e-invoice fields immediately after generation', () => {
    render(<EInvoicePage />);

    expect(screen.getByText(/Invoice ID: inv-1/i)).toBeTruthy();
    expect(screen.getByText(/Transaction ID: txn-1/i)).toBeTruthy();
    expect(screen.getByText(/Country: IN/i)).toBeTruthy();
    expect(screen.getByText(/Format: STANDARD/i)).toBeTruthy();
    expect(screen.getByText(/Submitted:/i)).toBeTruthy();
    expect(screen.getByAltText(/E-Invoice QR code/i)).toBeTruthy();
  });

  it('surfaces not-found status errors cleanly', async () => {
    const user = userEvent.setup();
    render(<EInvoicePage />);

    await user.type(screen.getAllByPlaceholderText(/Invoice UUID/i)[0], 'inv-404');
    await user.click(screen.getByRole('button', { name: /lookup/i }));

    expect(screen.getByText('E-Invoice not found')).toBeTruthy();
  });

  it('shows the same detail contract when looking up a generated invoice', async () => {
    const user = userEvent.setup();
    state.status = {
      data: {
        invoice_id: 'inv-lookup',
        transaction_id: 'txn-lookup',
        country_code: 'BR',
        invoice_format: 'STANDARD',
        invoice_number: 'IRN-LOOKUP',
        authority_ref: 'AUTH-LOOKUP',
        status: 'ACCEPTED',
        submitted_at: '2026-03-26T11:00:00Z',
        qr_code_url: 'https://example.com/qr-lookup.png',
      },
      isLoading: false,
      error: null as unknown as { status: number; message: string } | null,
      refetch: vi.fn(),
    };

    render(<EInvoicePage />);

    await user.type(screen.getAllByPlaceholderText(/Invoice UUID/i)[0], 'inv-lookup');
    await user.click(screen.getByRole('button', { name: /lookup/i }));

    expect(screen.getByText(/Invoice ID: inv-lookup/i)).toBeTruthy();
    expect(screen.getByText(/Country: BR/i)).toBeTruthy();
    expect(screen.getAllByText(/Format: STANDARD/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Invoice #: IRN-LOOKUP/i)).toBeTruthy();
    expect(screen.getAllByAltText(/E-Invoice QR code/i).length).toBeGreaterThan(0);
  });
});
