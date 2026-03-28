import type { FieldValues } from 'react-hook-form';
import type { Product } from '@/types/models';
import type { ProductFormValues } from '@/types/schemas';

export const inventoryQuantityState = (product: Pick<Product, 'current_stock' | 'reorder_level'>) => {
  const stock = Number(product.current_stock ?? 0);
  const reorderLevel = Number(product.reorder_level ?? 0);

  if (stock <= 0) {
    return { label: 'Out of stock', variant: 'destructive' as const };
  }

  if (reorderLevel > 0 && stock <= reorderLevel) {
    return { label: 'Low stock', variant: 'warning' as const };
  }

  return { label: 'Healthy', variant: 'success' as const };
};

export const toProductFormDefaults = (product?: Product): ProductFormValues => ({
  name: product?.name ?? '',
  category_id: product?.category_id ?? null,
  sku_code: product?.sku_code ?? '',
  uom: product?.uom ?? 'pieces',
  cost_price: Number(product?.cost_price ?? 0),
  selling_price: Number(product?.selling_price ?? 0),
  current_stock: Number(product?.current_stock ?? 0),
  reorder_level: product?.reorder_level ?? null,
  supplier_name: product?.supplier_name ?? '',
  barcode: product?.barcode ?? '',
  image_url: product?.image_url ?? '',
  description: product?.description ?? '',
  lead_time_days: product?.lead_time_days ?? null,
  hsn_code: product?.hsn_code ?? '',
});

export const pickDirtyValues = <TValues extends FieldValues>(values: TValues, dirtyFields: Record<string, unknown>) => {
  const payload = {} as Partial<TValues>;
  Object.entries(dirtyFields).forEach(([key, dirty]) => {
    if (dirty) {
      payload[key as keyof TValues] = values[key as keyof TValues];
    }
  });
  return payload;
};

export const formatInventoryCount = (value: number | null | undefined) => Number(value ?? 0).toLocaleString();
