/* @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';
import GstPage from './GstPage';

const authState = { role: 'owner' as 'owner' | 'staff' };

let fileGstr1Mutate = vi.fn();
let calculateTaxMutate = vi.fn();
let updateGstConfigMutate = vi.fn();
let createHsnMappingMutate = vi.fn();
let updateHsnMappingMutate = vi.fn();
let deleteHsnMappingMutate = vi.fn();

const queryState = {
  categories: {
    data: { categories: [{ category_id: 'cat-1', name: 'Category 1' }] },
    error: null,
    isLoading: false,
    refetch: vi.fn(),
  },
  gstConfig: {
    data: { gstin: null, registration_type: 'REGULAR', state_code: null, is_gst_enabled: false },
    error: null,
    isLoading: false,
    refetch: vi.fn(),
  },
  gstSummary: {
    data: { period: '2026-03', total_taxable: 0, total_cgst: 0, total_sgst: 0, total_igst: 0, invoice_count: 0, status: 'PENDING', compiled_at: null },
    error: null,
    isLoading: false,
    refetch: vi.fn(),
  },
  gstr1: {
    data: null as null | Record<string, unknown>,
    error: { status: 404, message: 'GSTR1 not compiled yet' },
    isLoading: false,
    refetch: vi.fn(),
  },
  liability: {
    data: [{ rate: 18, taxable_value: 1000, tax_amount: 180 }],
    error: null,
    isLoading: false,
    refetch: vi.fn(),
  },
  hsnMappings: {
    data: [{ hsn_code: '1001', category_id: 'cat-1', tax_rate: 18, description: 'Wheat' }],
    error: null,
    isLoading: false,
    refetch: vi.fn(),
  },
  hsnSearch: {
    data: null as null | Array<{ hsn_code: string; description: string; default_gst_rate: number | null }>,
    error: null as unknown,
    isLoading: false,
    refetch: vi.fn(),
  },
  taxConfig: {
    data: { tax_id: null, registration_type: 'STANDARD', state_province: null, is_tax_enabled: false },
    error: null,
    isLoading: false,
    refetch: vi.fn(),
  },
  taxSummary: {
    data: { period: '2026-03', country_code: 'IN', total_taxable: 100, total_tax: 18, invoice_count: 1, status: 'PENDING', compiled_at: null },
    error: null,
    isLoading: false,
    refetch: vi.fn(),
  },
  calculateTax: {
    data: null as null | { taxable_amount: number; tax_amount: number; breakdown: Record<string, number> },
    error: null,
    isPending: false,
    mutateAsync: calculateTaxMutate,
  },
};

vi.mock('@/stores/authStore', () => ({
  authStore: (selector: (state: { user: { role: 'owner' | 'staff' } | null }) => unknown) =>
    selector({ user: { role: authState.role } }),
}));

vi.mock('@/hooks/store', () => ({
  useCategoriesQuery: () => queryState.categories,
}));

vi.mock('@/hooks/useGst', () => ({
  useGstConfig: () => queryState.gstConfig,
  useGstSummary: () => queryState.gstSummary,
  useGstr1: () => queryState.gstr1,
  useGstLiabilitySlabs: () => queryState.liability,
  useHsnMappings: () => queryState.hsnMappings,
  useHsnSearch: () => queryState.hsnSearch,
  useUpdateGstConfig: () => ({ mutateAsync: updateGstConfigMutate, isPending: false }),
  useFileGstr1: () => ({ mutateAsync: fileGstr1Mutate, isPending: false }),
  useCreateHsnMapping: () => ({ mutateAsync: createHsnMappingMutate, isPending: false }),
  useUpdateHsnMapping: () => ({ mutateAsync: updateHsnMappingMutate, isPending: false }),
  useDeleteHsnMapping: () => ({ mutateAsync: deleteHsnMappingMutate, isPending: false }),
}));

vi.mock('@/hooks/useTax', () => ({
  useTaxConfig: () => queryState.taxConfig,
  useTaxFilingSummary: () => queryState.taxSummary,
  useCalculateTax: () => queryState.calculateTax,
}));

describe('GstPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    authState.role = 'owner';
    fileGstr1Mutate = vi.fn().mockResolvedValue({ period: '2026-03', status: 'FILED' });
    calculateTaxMutate = vi.fn();
    updateGstConfigMutate = vi.fn();
    createHsnMappingMutate = vi.fn();
    updateHsnMappingMutate = vi.fn();
    deleteHsnMappingMutate = vi.fn();
    queryState.gstr1 = {
      data: null,
      error: { status: 404, message: 'GSTR1 not compiled yet' },
      isLoading: false,
      refetch: vi.fn(),
    };
    queryState.hsnSearch = {
      data: null,
      error: null,
      isLoading: false,
      refetch: vi.fn(),
    };
    queryState.calculateTax = {
      data: null,
      error: null,
      isPending: false,
      mutateAsync: calculateTaxMutate,
    };
  });

  it('allows filing GSTR1 even when the JSON report is not available yet', async () => {
    const user = userEvent.setup();
    render(<GstPage />);

    await user.click(screen.getByRole('button', { name: /^GSTR1$/i }));
    const fileButton = screen.getByRole('button', { name: /file gstr1/i });

    expect((fileButton as HTMLButtonElement).disabled).toBe(false);
    await user.click(fileButton);
    expect(fileGstr1Mutate).toHaveBeenCalledTimes(1);
  });

  it('renders HSN search errors instead of an empty result state', async () => {
    const user = userEvent.setup();
    queryState.hsnSearch = {
      data: null,
      error: { status: 500, message: 'Search unavailable' },
      isLoading: false,
      refetch: vi.fn(),
    };

    render(<GstPage />);
    await user.click(screen.getByRole('button', { name: /^HSN Mappings$/i }));
    await user.type(screen.getByPlaceholderText(/search by hsn or description/i), '1001');

    expect(screen.getByText('Search unavailable')).toBeTruthy();
    expect(screen.queryByText(/No HSN matches/i)).toBeNull();
  });

  it('blocks invalid tax calculator input before mutation', async () => {
    const user = userEvent.setup();
    render(<GstPage />);
    await user.click(screen.getByRole('button', { name: /^Tax Calculator$/i }));

    await user.type(screen.getByLabelText(/product id 1/i), 'abc');
    await user.clear(screen.getByLabelText(/quantity 1/i));
    await user.type(screen.getByLabelText(/quantity 1/i), '1');
    await user.clear(screen.getByLabelText(/selling price 1/i));
    await user.type(screen.getByLabelText(/selling price 1/i), '100');
    await user.clear(screen.getByLabelText(/discount 1/i));
    await user.type(screen.getByLabelText(/discount 1/i), '0');

    const calculateButton = screen.getByRole('button', { name: /calculate tax/i });
    expect((calculateButton as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/Line 1: Product ID must be a positive whole number\./i)).toBeTruthy();
    expect(calculateTaxMutate).not.toHaveBeenCalled();
  });

  it('sends multiple tax line items when the calculator has more than one row', async () => {
    const user = userEvent.setup();
    render(<GstPage />);
    await user.click(screen.getByRole('button', { name: /^Tax Calculator$/i }));

    await user.clear(screen.getByLabelText(/product id 1/i));
    await user.type(screen.getByLabelText(/product id 1/i), '10');
    await user.clear(screen.getByLabelText(/selling price 1/i));
    await user.type(screen.getByLabelText(/selling price 1/i), '100');

    await user.click(screen.getByRole('button', { name: /add item/i }));

    await user.clear(screen.getByLabelText(/product id 2/i));
    await user.type(screen.getByLabelText(/product id 2/i), '11');
    await user.clear(screen.getByLabelText(/quantity 2/i));
    await user.type(screen.getByLabelText(/quantity 2/i), '2');
    await user.clear(screen.getByLabelText(/selling price 2/i));
    await user.type(screen.getByLabelText(/selling price 2/i), '50');
    await user.clear(screen.getByLabelText(/discount 2/i));
    await user.type(screen.getByLabelText(/discount 2/i), '5');

    const calculateButton = screen.getByRole('button', { name: /calculate tax/i });
    expect((calculateButton as HTMLButtonElement).disabled).toBe(false);
    await user.click(calculateButton);

    expect(calculateTaxMutate).toHaveBeenCalledWith({
      country_code: 'IN',
      items: [
        { product_id: 10, quantity: 1, selling_price: 100, discount: 0 },
        { product_id: 11, quantity: 2, selling_price: 50, discount: 5 },
      ],
    });
  });
});
