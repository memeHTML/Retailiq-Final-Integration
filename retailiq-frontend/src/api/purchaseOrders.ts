/**
 * src/api/purchaseOrders.ts
 * Backend-accurate purchase-order contract layer.
 */
import { apiGet, apiGetBlob, apiPost, apiPut } from './client';

const PURCHASE_ORDERS_BASE = '/api/v1/purchase-orders';

export type PurchaseOrderStatus = 'DRAFT' | 'SENT' | 'CONFIRMED' | 'FULFILLED' | 'CANCELLED';

export interface PurchaseOrderListItem {
  id: string;
  supplier_id: string;
  status: PurchaseOrderStatus | string;
  expected_delivery_date: string | null;
  created_at: string;
}

export interface PurchaseOrderItem {
  line_item_id: string;
  product_id: number;
  ordered_qty: number;
  received_qty: number;
  unit_price: number;
}

export interface PurchaseOrderDetail {
  id: string;
  supplier_id: string;
  status: PurchaseOrderStatus | string;
  expected_delivery_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items: PurchaseOrderItem[];
}

export interface PurchaseOrderCreatePayload {
  supplier_id: string;
  expected_delivery_date?: string | null;
  notes?: string | null;
  items: Array<{
    product_id: number;
    ordered_qty: number;
    unit_price: number;
  }>;
}

export interface PurchaseOrderUpdatePayload {
  expected_delivery_date?: string | null;
  notes?: string | null;
  items?: Array<{
    product_id: number;
    ordered_qty: number;
    unit_price: number;
  }>;
}

export interface PurchaseOrderReceivePayload {
  items: Array<{
    product_id: number;
    received_qty: number;
  }>;
  notes?: string | null;
}

export interface PurchaseOrderListParams {
  status?: PurchaseOrderStatus | 'RECEIVED' | string;
}

export interface PurchaseOrderPdfMetadata {
  job_id: string;
  url: string;
  path: string;
}

export class PurchaseOrderPdfDownloadError extends Error {
  metadata: PurchaseOrderPdfMetadata | null;

  constructor(message: string, metadata: PurchaseOrderPdfMetadata | null = null) {
    super(message);
    this.name = 'PurchaseOrderPdfDownloadError';
    this.metadata = metadata;
  }
}

const normalizeString = (value: unknown): string | null => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return String(value);
};

const toNumber = (value: unknown): number => Number(value ?? 0);

const mapPurchaseOrderItem = (item: Record<string, unknown>): PurchaseOrderItem => ({
  line_item_id: String(item.line_item_id ?? item.id ?? ''),
  product_id: Number(item.product_id ?? 0),
  ordered_qty: toNumber(item.ordered_qty),
  received_qty: toNumber(item.received_qty),
  unit_price: toNumber(item.unit_price),
});

const mapPurchaseOrderDetail = (item: Record<string, unknown>): PurchaseOrderDetail => {
  const items = Array.isArray(item.items) ? item.items : [];
  return {
    id: String(item.id ?? ''),
    supplier_id: String(item.supplier_id ?? ''),
    status: String(item.status ?? 'DRAFT'),
    expected_delivery_date: normalizeString(item.expected_delivery_date),
    notes: normalizeString(item.notes),
    created_at: String(item.created_at ?? ''),
    updated_at: String(item.updated_at ?? item.created_at ?? ''),
    items: items.map((entry) => mapPurchaseOrderItem(entry as Record<string, unknown>)),
  };
};

export async function listPurchaseOrders(params: PurchaseOrderListParams = {}): Promise<PurchaseOrderListItem[]> {
  const response = await apiGet<unknown>(PURCHASE_ORDERS_BASE, params.status ? { status: params.status } : undefined);
  return Array.isArray(response)
    ? response.map((item) => ({
        id: String((item as Record<string, unknown>).id ?? ''),
        supplier_id: String((item as Record<string, unknown>).supplier_id ?? ''),
        status: String((item as Record<string, unknown>).status ?? 'DRAFT'),
        expected_delivery_date: normalizeString((item as Record<string, unknown>).expected_delivery_date),
        created_at: String((item as Record<string, unknown>).created_at ?? ''),
      }))
    : [];
}

export async function getPurchaseOrder(purchaseOrderId: string): Promise<PurchaseOrderDetail> {
  const response = await apiGet<unknown>(`${PURCHASE_ORDERS_BASE}/${purchaseOrderId}`);
  return mapPurchaseOrderDetail((response as Record<string, unknown>) ?? {});
}

export async function createPurchaseOrder(payload: PurchaseOrderCreatePayload): Promise<{ id: string }> {
  return apiPost<{ id: string }>(PURCHASE_ORDERS_BASE, {
    supplier_id: payload.supplier_id,
    expected_delivery_date: payload.expected_delivery_date ?? undefined,
    notes: payload.notes ?? undefined,
    items: payload.items.map((item) => ({
      product_id: item.product_id,
      ordered_qty: item.ordered_qty,
      unit_price: item.unit_price,
    })),
  });
}

export async function updatePurchaseOrder(purchaseOrderId: string, payload: PurchaseOrderUpdatePayload): Promise<PurchaseOrderDetail> {
  const response = await apiPut<unknown>(`${PURCHASE_ORDERS_BASE}/${purchaseOrderId}`, {
    ...(payload.expected_delivery_date !== undefined ? { expected_delivery_date: payload.expected_delivery_date } : {}),
    ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
    ...(payload.items
      ? {
          items: payload.items.map((item) => ({
            product_id: item.product_id,
            ordered_qty: item.ordered_qty,
            unit_price: item.unit_price,
          })),
        }
      : {}),
  });

  return mapPurchaseOrderDetail((response as Record<string, unknown>) ?? {});
}

export async function sendPurchaseOrder(purchaseOrderId: string): Promise<{ id: string }> {
  return apiPost<{ id: string }>(`${PURCHASE_ORDERS_BASE}/${purchaseOrderId}/send`);
}

export async function confirmPurchaseOrder(purchaseOrderId: string): Promise<{ id: string; status: string }> {
  return apiPost<{ id: string; status: string }>(`${PURCHASE_ORDERS_BASE}/${purchaseOrderId}/confirm`);
}

export async function receivePurchaseOrder(
  purchaseOrderId: string,
  payload: PurchaseOrderReceivePayload,
): Promise<{ id: string; status: string }> {
  return apiPost<{ id: string; status: string }>(`${PURCHASE_ORDERS_BASE}/${purchaseOrderId}/receive`, payload);
}

export async function cancelPurchaseOrder(purchaseOrderId: string): Promise<{ id: string }> {
  return apiPut<{ id: string }>(`${PURCHASE_ORDERS_BASE}/${purchaseOrderId}/cancel`);
}

export async function getPurchaseOrderPdfMetadata(purchaseOrderId: string): Promise<PurchaseOrderPdfMetadata> {
  return apiGet<PurchaseOrderPdfMetadata>(`${PURCHASE_ORDERS_BASE}/${purchaseOrderId}/pdf`);
}

export async function downloadPurchaseOrderPdf(purchaseOrderId: string): Promise<Blob> {
  return apiGetBlob(`${PURCHASE_ORDERS_BASE}/${purchaseOrderId}/pdf/download`, {
    headers: {
      Accept: 'application/pdf',
    },
  });
}

export async function downloadPurchaseOrderPdfWithFallback(purchaseOrderId: string): Promise<Blob> {
  try {
    return await downloadPurchaseOrderPdf(purchaseOrderId);
  } catch (error) {
    let metadata: PurchaseOrderPdfMetadata | null = null;

    try {
      metadata = await getPurchaseOrderPdfMetadata(purchaseOrderId);
    } catch {
      metadata = null;
    }

    throw new PurchaseOrderPdfDownloadError(
      metadata
        ? 'Purchase order PDF download is temporarily unavailable. A PDF job exists and can be retried.'
        : 'Purchase order PDF download failed.',
      metadata,
    );
  }
}

export async function emailPurchaseOrder(purchaseOrderId: string, email: string): Promise<{ message: string }> {
  return apiPost<{ message: string }>(`${PURCHASE_ORDERS_BASE}/${purchaseOrderId}/email`, { email });
}

export const purchaseOrdersApi = {
  listPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrder,
  sendPurchaseOrder,
  confirmPurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
  getPurchaseOrderPdfMetadata,
  downloadPurchaseOrderPdf,
  downloadPurchaseOrderPdfWithFallback,
  emailPurchaseOrder,
};
