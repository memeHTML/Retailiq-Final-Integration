/* @vitest-environment jsdom */
import { useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BarcodesPage from './Barcodes';

const addToast = vi.fn();
const registerMutateAsync = vi.fn();

vi.mock('@/stores/uiStore', () => ({
  uiStore: (selector: (state: { addToast: typeof addToast }) => unknown) => selector({ addToast }),
}));

vi.mock('@/components/shared/ProductPicker', () => {
  const validProductIds = new Set(['10', '11']);

  return {
    ProductPicker: ({ value, onChange, label, helperText, onResolutionChange }: {
      value: string;
      onChange: (value: string) => void;
      label?: string;
      helperText?: string;
      onResolutionChange?: (resolution: { product: null | { product_id: number; name: string; sku_code: string; current_stock: number; selling_price: number }; isLoading: boolean; isError: boolean }) => void;
    }) => {
      const product = value && validProductIds.has(value)
        ? { product_id: Number(value), name: `Product ${value}`, sku_code: `SKU-${value}`, current_stock: 12, selling_price: 99 }
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

vi.mock('@/hooks/barcodes', () => ({
  useBarcodeLookupQuery: (value: string | null) => {
    if (value === 'ABC-12345') {
      return {
        data: {
          barcode_value: 'ABC-12345',
          barcode_type: 'EAN13',
          product_id: 10,
          product_name: 'Product 10',
          current_stock: 12,
          price: 99,
        },
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      };
    }

    if (value === 'MISSING') {
      return {
        data: undefined,
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      };
    }

    return {
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    };
  },
  useRegisterBarcodeMutation: () => ({
    mutateAsync: registerMutateAsync,
    isPending: false,
  }),
  useBarcodesQuery: (productId: string | null) => {
    if (productId === '10') {
      return {
        data: [{ barcode_value: 'BC-1', barcode_type: 'EAN13', created_at: '2026-03-27T10:00:00Z' }],
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      };
    }

    return {
      data: [],
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    };
  },
}));

describe('BarcodesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerMutateAsync.mockResolvedValue({
      id: 1,
      product_id: '10',
      store_id: 77,
      barcode_value: 'ABC-12345',
      barcode_type: 'EAN13',
      created_at: '2026-03-27T10:00:00Z',
    });
  });

  it('looks up a barcode and renders the matched product', async () => {
    const user = userEvent.setup();
    render(<BarcodesPage />);

    await user.type(screen.getAllByLabelText(/^barcode value$/i)[0], 'ABC-12345');
    await user.click(screen.getAllByRole('button', { name: /look up barcode/i })[0]);

    expect(await screen.findByText(/matched product/i)).toBeTruthy();
    expect(screen.getByText(/Product 10/i)).toBeTruthy();
    expect(screen.getByText(/ABC-12345/i)).toBeTruthy();
  });

  it('shows a not-found state when the barcode cannot be resolved', async () => {
    const user = userEvent.setup();
    render(<BarcodesPage />);

    await user.type(screen.getAllByLabelText(/^barcode value$/i)[0], 'MISSING');
    await user.click(screen.getAllByRole('button', { name: /look up barcode/i })[0]);

    expect(await screen.findByText(/barcode not found/i)).toBeTruthy();
  });

  it('registers a barcode against a resolved product and switches to the per-product list', async () => {
    const user = userEvent.setup();
    render(<BarcodesPage />);

    await user.click(screen.getAllByRole('button', { name: /^register$/i })[0]);
    await user.type(screen.getAllByLabelText(/^barcode value$/i)[0], 'ABC-12345');
    await user.clear(screen.getAllByLabelText(/^product$/i)[0]);
    await user.type(screen.getAllByLabelText(/^product$/i)[0], '10');

    await waitFor(() => {
      expect((screen.getByRole('button', { name: /register barcode/i }) as HTMLButtonElement).disabled).toBe(false);
    });
    await user.click(screen.getAllByRole('button', { name: /register barcode/i })[0]);

    expect(registerMutateAsync).toHaveBeenCalledWith({
      product_id: '10',
      barcode_value: 'ABC-12345',
      barcode_type: 'EAN13',
    });
    expect(await screen.findByText(/^Registered barcodes$/i, { selector: 'h3' })).toBeTruthy();
    expect(screen.getByText(/^BC-1$/i, { selector: 'td' })).toBeTruthy();
  });
});
