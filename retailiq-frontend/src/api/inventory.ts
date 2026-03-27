/**
 * src/api/inventory.ts
 * Oracle Document sections consumed: 3, 4, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { request } from '@/api/client';
import { requestEnvelope } from '@/api/client';
import { requestWithFallback } from '@/api/client';
import type {
  CreateProductRequest,
  CreateProductResponse,
  DeleteProductResponse,
  GetProductResponse,
  ListProductsRequest,
  ListProductsResponse,
  StockAuditRequest,
  StockAuditResponse,
  StockUpdateRequest,
  StockUpdateResponse,
  UpdateProductRequest,
  UpdateProductResponse,
  InventoryPriceHistoryEntry,
} from '@/types/api';
import type { InventoryAlert } from '@/types/models';

export const listProducts = async (filters: ListProductsRequest): Promise<ListProductsResponse> => {
  const { data, meta } = await requestEnvelope<ListProductsResponse['data']>({ url: '/api/v1/inventory', method: 'GET', params: filters });
  return {
    data: Array.isArray(data) ? data : [],
    page: Number(meta?.page ?? filters.page ?? 1),
    page_size: Number(meta?.page_size ?? filters.page_size ?? 50),
    total: Number(meta?.total ?? (Array.isArray(data) ? data.length : 0)),
  };
};
export const getProductById = (productId: number | string) => request<GetProductResponse>({ url: `/api/v1/inventory/${productId}`, method: 'GET' });
export const getProduct = getProductById;
export const createProduct = (payload: CreateProductRequest) => request<CreateProductResponse>({ url: '/api/v1/inventory', method: 'POST', data: payload });
export const updateProduct = (productId: number | string, payload: UpdateProductRequest) => request<UpdateProductResponse>({ url: `/api/v1/inventory/${productId}`, method: 'PUT', data: payload });
export const deleteProduct = (productId: number | string) => request<DeleteProductResponse>({ url: `/api/v1/inventory/${productId}`, method: 'DELETE' });
export const addStock = async (productId: number | string, payload: StockUpdateRequest): Promise<StockUpdateResponse> => {
  const product = await request<StockUpdateResponse['product']>({ url: `/api/v1/inventory/${productId}/stock`, method: 'POST', data: payload });
  return { message: 'Stock updated successfully', product };
};
export const updateStock = async (productId: number | string, payload: StockUpdateRequest): Promise<StockUpdateResponse> => {
  const product = await requestWithFallback<StockUpdateResponse['product']>(
    `/api/v1/inventory/${productId}/stock`,
    `/api/v1/inventory/${productId}/stock-update`,
    'POST',
    payload,
  );
  return { message: 'Stock updated successfully', product };
};
export const stockAudit = async (payload: StockAuditRequest): Promise<StockAuditResponse> => {
  const data = await requestWithFallback<Record<string, unknown>>('/api/v1/inventory/audit', '/api/v1/inventory/stock-audit', 'POST', payload);
  return {
    message: 'Stock audit completed',
    audit_id: typeof data.audit_id === 'number' ? data.audit_id : undefined,
    audit_date: typeof data.audit_date === 'string' ? data.audit_date : undefined,
    items: Array.isArray(data.items)
      ? data.items.map((item) => ({
          product_id: Number((item as Record<string, unknown>).product_id ?? 0),
          expected_stock: Number((item as Record<string, unknown>).expected_stock ?? 0),
          actual_stock: Number((item as Record<string, unknown>).actual_stock ?? 0),
          discrepancy: Number((item as Record<string, unknown>).discrepancy ?? 0),
        }))
      : undefined,
  };
};
export const stockAuditLegacy = stockAudit;
export const getPriceHistory = async (productId: number | string): Promise<{ product_id: number | string; history: InventoryPriceHistoryEntry[] }> => {
  const history = await request<unknown[]>({ url: `/api/v1/inventory/${productId}/price-history`, method: 'GET' });
  return {
    product_id: productId,
    history: Array.isArray(history) ? history as InventoryPriceHistoryEntry[] : [],
  };
};

export const getInventoryAlerts = async (): Promise<InventoryAlert[]> => {
  const alerts = await request<InventoryAlert[]>({ url: '/api/v1/inventory/alerts', method: 'GET' });
  return Array.isArray(alerts) ? alerts : [];
};

export const dismissInventoryAlert = async (alertId: number | string): Promise<void> => {
  await request({ url: `/api/v1/inventory/alerts/${alertId}`, method: 'DELETE' });
};
