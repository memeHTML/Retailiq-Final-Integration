/**
 * src/api/suppliers.ts
 * Backend-accurate supplier and purchase-order contract layer.
 */
import { apiDelete, apiGet, apiPost, apiPut } from './client';

const SUPPLIERS_BASE = '/api/v1/suppliers';

export interface SupplierListItem {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  payment_terms_days: number | null;
  avg_lead_time_days: number | null;
  fill_rate_90d: number;
  price_change_6m_pct: number | null;
}

export interface SupplierContact {
  name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

export interface SupplierLinkedProduct {
  product_id: number;
  name: string;
  quoted_price: number;
  lead_time_days: number | null;
}

export interface SupplierRecentPurchaseOrder {
  id: string;
  status: string;
  expected_delivery_date: string | null;
  created_at: string;
}

export interface SupplierAnalytics {
  avg_lead_time_days: number | null;
  fill_rate_90d: number;
}

export interface SupplierDetail {
  id: string;
  name: string;
  contact: SupplierContact;
  payment_terms_days: number | null;
  is_active: boolean;
  analytics: SupplierAnalytics;
  sourced_products: SupplierLinkedProduct[];
  recent_purchase_orders: SupplierRecentPurchaseOrder[];
}

export interface SupplierCreatePayload {
  name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  payment_terms_days?: number;
}

export interface SupplierUpdatePayload {
  name?: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  payment_terms_days?: number;
  is_active?: boolean;
}

export interface SupplierProductLinkPayload {
  product_id: number;
  quoted_price: number;
  lead_time_days?: number;
  is_preferred_supplier?: boolean;
}

export interface SupplierProductLinkUpdatePayload {
  quoted_price?: number;
  lead_time_days?: number;
}

export interface SupplierListParams {
  search?: string;
}

const normalizeString = (value: unknown): string | null => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return String(value);
};

const toNumberOrNull = (value: unknown): number | null => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const mapSupplierListItem = (item: Record<string, unknown>): SupplierListItem => ({
  id: String(item.id ?? ''),
  name: String(item.name ?? ''),
  contact_name: normalizeString(item.contact_name),
  email: normalizeString(item.email),
  phone: normalizeString(item.phone),
  payment_terms_days: toNumberOrNull(item.payment_terms_days),
  avg_lead_time_days: toNumberOrNull(item.avg_lead_time_days),
  fill_rate_90d: Number(item.fill_rate_90d ?? 0),
  price_change_6m_pct: toNumberOrNull(item.price_change_6m_pct),
});

const mapSupplierDetail = (item: Record<string, unknown>): SupplierDetail => {
  const contact = (item.contact && typeof item.contact === 'object' ? item.contact : {}) as Record<string, unknown>;
  const analytics = (item.analytics && typeof item.analytics === 'object' ? item.analytics : {}) as Record<string, unknown>;
  const sourcedProducts = Array.isArray(item.sourced_products) ? item.sourced_products : [];
  const recentPurchaseOrders = Array.isArray(item.recent_purchase_orders) ? item.recent_purchase_orders : [];

  return {
    id: String(item.id ?? ''),
    name: String(item.name ?? ''),
    contact: {
      name: normalizeString(contact.name),
      phone: normalizeString(contact.phone),
      email: normalizeString(contact.email),
      address: normalizeString(contact.address),
    },
    payment_terms_days: toNumberOrNull(item.payment_terms_days),
    is_active: Boolean(item.is_active ?? true),
    analytics: {
      avg_lead_time_days: toNumberOrNull(analytics.avg_lead_time_days),
      fill_rate_90d: Number(analytics.fill_rate_90d ?? 0),
    },
    sourced_products: sourcedProducts.map((product) => {
      const entry = product as Record<string, unknown>;
      return {
        product_id: Number(entry.product_id ?? 0),
        name: String(entry.name ?? ''),
        quoted_price: Number(entry.quoted_price ?? 0),
        lead_time_days: toNumberOrNull(entry.lead_time_days),
      };
    }),
    recent_purchase_orders: recentPurchaseOrders.map((po) => {
      const entry = po as Record<string, unknown>;
      return {
        id: String(entry.id ?? ''),
        status: String(entry.status ?? ''),
        expected_delivery_date: normalizeString(entry.expected_delivery_date),
        created_at: String(entry.created_at ?? ''),
      };
    }),
  };
};

export async function listSuppliers(_params: SupplierListParams = {}): Promise<SupplierListItem[]> {
  const response = await apiGet<unknown>(SUPPLIERS_BASE);
  return Array.isArray(response) ? response.map((item) => mapSupplierListItem(item as Record<string, unknown>)) : [];
}

export async function getSupplier(supplierId: string): Promise<SupplierDetail> {
  const response = await apiGet<unknown>(`${SUPPLIERS_BASE}/${supplierId}`);
  return mapSupplierDetail((response as Record<string, unknown>) ?? {});
}

export async function createSupplier(payload: SupplierCreatePayload): Promise<{ id: string }> {
  return apiPost<{ id: string }>(SUPPLIERS_BASE, payload);
}

export async function updateSupplier(supplierId: string, payload: SupplierUpdatePayload): Promise<{ id: string }> {
  return apiPut<{ id: string }>(`${SUPPLIERS_BASE}/${supplierId}`, payload);
}

export async function deleteSupplier(supplierId: string): Promise<{ id: string }> {
  return apiDelete<{ id: string }>(`${SUPPLIERS_BASE}/${supplierId}`);
}

export async function linkSupplierProduct(
  supplierId: string,
  payload: SupplierProductLinkPayload,
): Promise<{ id: string }> {
  return apiPost<{ id: string }>(`${SUPPLIERS_BASE}/${supplierId}/products`, payload);
}

export async function updateSupplierProductLink(
  supplierId: string,
  productId: number,
  payload: SupplierProductLinkUpdatePayload,
): Promise<{ id: string }> {
  return apiPut<{ id: string }>(`${SUPPLIERS_BASE}/${supplierId}/products/${productId}`, {
    ...(payload.quoted_price !== undefined ? { quoted_price: payload.quoted_price } : {}),
    ...(payload.lead_time_days !== undefined ? { lead_time_days: payload.lead_time_days } : {}),
  });
}

export async function unlinkSupplierProduct(supplierId: string, productId: number): Promise<{ product_id: number; deleted: boolean }> {
  return apiDelete<{ product_id: number; deleted: boolean }>(`${SUPPLIERS_BASE}/${supplierId}/products/${productId}`);
}

export const suppliersApi = {
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  linkSupplierProduct,
  updateSupplierProductLink,
  unlinkSupplierProduct,
};
