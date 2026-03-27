/* @vitest-environment jsdom */
import { useEffect, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProductPicker } from './ProductPicker';

const productPages = {
  1: {
    data: {
      data: [
        { product_id: 1, store_id: 1, category_id: 1, name: 'Alpha', sku_code: 'A-001', uom: 'pieces', cost_price: 5, selling_price: 10, current_stock: 8, reorder_level: null, supplier_name: null, barcode: null, image_url: null, is_active: true, lead_time_days: null, hsn_code: null },
        { product_id: 2, store_id: 1, category_id: 1, name: 'Beta', sku_code: 'B-002', uom: 'pieces', cost_price: 6, selling_price: 12, current_stock: 4, reorder_level: null, supplier_name: null, barcode: null, image_url: null, is_active: true, lead_time_days: null, hsn_code: null },
      ],
      page: 1,
      page_size: 2,
      total: 4,
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  },
  2: {
    data: {
      data: [
        { product_id: 3, store_id: 1, category_id: 1, name: 'Gamma', sku_code: 'G-003', uom: 'pieces', cost_price: 7, selling_price: 14, current_stock: 6, reorder_level: null, supplier_name: null, barcode: null, image_url: null, is_active: true, lead_time_days: null, hsn_code: null },
        { product_id: 4, store_id: 1, category_id: 1, name: 'Delta', sku_code: 'D-004', uom: 'pieces', cost_price: 8, selling_price: 16, current_stock: 2, reorder_level: null, supplier_name: null, barcode: null, image_url: null, is_active: true, lead_time_days: null, hsn_code: null },
      ],
      page: 2,
      page_size: 2,
      total: 4,
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  },
};

const detailLookup = new Map<number | string, unknown>([
  [1, productPages[1].data.data[0]],
  [2, productPages[1].data.data[1]],
  [3, productPages[2].data.data[0]],
  [4, productPages[2].data.data[1]],
]);

vi.mock('@/hooks/inventory', () => ({
  useProductsQuery: (filters: { page?: number }) => (filters.page === 2 ? productPages[2] : productPages[1]),
  useProductQuery: (productId: number | string | null) => {
    if (!productId) {
      return { data: undefined, isLoading: false, isFetching: false, isError: false, error: null, refetch: vi.fn() };
    }

    const lookupKey = typeof productId === 'number' ? productId : Number(productId);
    const product = detailLookup.get(lookupKey) ?? detailLookup.get(String(productId));
    if (!product) {
      return {
        data: undefined,
        isLoading: false,
        isFetching: false,
        isError: true,
        error: { status: 404, message: 'Product not found' },
        refetch: vi.fn(),
      };
    }

    return { data: product, isLoading: false, isFetching: false, isError: false, error: null, refetch: vi.fn() };
  },
}));

function Harness({ initialValue = '' }: { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);

  return <ProductPicker value={value} onChange={setValue} label="Product" helperText="Browse inventory or load a product by exact ID." />;
}

describe('ProductPicker', () => {
  it('pages through inventory and selects a later-page product', async () => {
    const user = userEvent.setup();

    render(<Harness />);

    await user.click(screen.getByRole('button', { name: /choose product/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));

    const selectButtons = screen.getAllByRole('button', { name: /^select$/i });
    await user.click(selectButtons[1]);

    expect(await screen.findByText(/^Delta$/, { selector: '.font-medium.text-gray-900' })).toBeTruthy();
    expect(screen.getByText(/SKU D-004/, { selector: '.text-gray-600' })).toBeTruthy();
  });

  it('hydrates an exact product ID and updates the selected summary', async () => {
    const user = userEvent.setup();

    render(<Harness />);

    await user.click(screen.getAllByRole('button', { name: /^choose product$/i })[0]);
    await user.clear(screen.getByLabelText(/product id/i));
    await user.type(screen.getByLabelText(/product id/i), '3');
    await user.click(screen.getByRole('button', { name: /load product/i }));

    expect(await screen.findByText(/^Gamma$/, { selector: '.font-medium.text-gray-900' })).toBeTruthy();
    expect(screen.getByText(/SKU G-003/, { selector: '.text-gray-600' })).toBeTruthy();
  });

  it('shows a stale selection as unavailable when the backend cannot resolve it', () => {
    render(<Harness initialValue="99" />);

    expect(screen.getByText(/selected product unavailable/i)).toBeTruthy();
    expect(screen.getByText(/Product 99 could not be resolved from the backend\./i)).toBeTruthy();
  });
});
