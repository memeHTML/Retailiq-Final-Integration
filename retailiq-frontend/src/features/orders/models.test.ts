import { describe, expect, it } from 'vitest';
import { getPurchaseOrderStatusVariant, normalizePurchaseOrderPreviewRow } from './models';

describe('orders models', () => {
  it('normalizes partial purchase order rows safely', () => {
    expect(
      normalizePurchaseOrderPreviewRow({
        id: 42,
        supplier_id: null,
        status: 'draft',
        expected_delivery_date: '   ',
        created_at: null,
      }),
    ).toEqual({
      id: '42',
      supplierId: '-',
      status: 'draft',
      expectedDeliveryDate: null,
      createdAt: '',
    });
  });

  it('maps purchase order statuses to stable badge variants', () => {
    expect(getPurchaseOrderStatusVariant('draft')).toBe('secondary');
    expect(getPurchaseOrderStatusVariant('sent')).toBe('info');
    expect(getPurchaseOrderStatusVariant('received')).toBe('success');
    expect(getPurchaseOrderStatusVariant('cancelled')).toBe('danger');
    expect(getPurchaseOrderStatusVariant('unknown')).toBe('secondary');
  });
});
