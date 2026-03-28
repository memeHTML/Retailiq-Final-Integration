export type PurchaseOrderPreviewRow = {
  id: string;
  supplierId: string;
  status: string;
  expectedDeliveryDate: string | null;
  createdAt: string;
};

export type PurchaseOrderPreviewSource = {
  id?: string | number | null;
  supplier_id?: string | number | null;
  status?: string | null;
  expected_delivery_date?: string | null;
  created_at?: string | null;
};

const toStringValue = (value: string | number | null | undefined, fallback = '') => {
  if (typeof value === 'string') {
    return value.trim() || fallback;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return fallback;
};

export function normalizePurchaseOrderPreviewRow(row: PurchaseOrderPreviewSource): PurchaseOrderPreviewRow {
  const expectedDeliveryDate = typeof row.expected_delivery_date === 'string' && row.expected_delivery_date.trim() ? row.expected_delivery_date : null;

  return {
    id: toStringValue(row.id),
    supplierId: toStringValue(row.supplier_id, '-'),
    status: toStringValue(row.status, 'UNKNOWN'),
    expectedDeliveryDate,
    createdAt: toStringValue(row.created_at, ''),
  };
}

export function getPurchaseOrderStatusVariant(status: string) {
  switch (status.toUpperCase()) {
    case 'DRAFT':
    case 'PENDING':
      return 'secondary';
    case 'SENT':
    case 'ISSUED':
      return 'info';
    case 'RECEIVED':
    case 'CLOSED':
      return 'success';
    case 'CANCELLED':
    case 'FAILED':
      return 'danger';
    default:
      return 'secondary';
  }
}
