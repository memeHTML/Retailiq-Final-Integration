import { request } from '@/api/client';
import type {
  CreateMarketplaceOrderRequest,
  CreateMarketplaceOrderResponse,
  CreateRfqRequest,
  CreateRfqResponse,
  GetMarketplaceOrderResponse,
  GetMarketplaceTrackingResponse,
  GetRfqResponse,
  ListMarketplaceOrdersResponse,
  MarketplaceRecommendation,
  MarketplaceSearchRequest,
  MarketplaceSearchResponse,
  SupplierOnboardRequest,
  SupplierOnboardResponse,
} from '@/types/api';

const BASE = '/api/v1/marketplace';

export const searchCatalog = (params: MarketplaceSearchRequest = {}) =>
  request<MarketplaceSearchResponse>({ url: `${BASE}/search`, method: 'GET', params });

export const getRecommendations = (params: { category?: string; urgency?: string } = {}) =>
  request<MarketplaceRecommendation[]>({ url: `${BASE}/recommendations`, method: 'GET', params });

export const createRfq = (data: CreateRfqRequest) =>
  request<CreateRfqResponse>({ url: `${BASE}/rfq`, method: 'POST', data });

export const getRfq = (rfqId: string | number) =>
  request<GetRfqResponse>({ url: `${BASE}/rfq/${rfqId}`, method: 'GET' });

export const createOrder = (data: CreateMarketplaceOrderRequest) =>
  request<CreateMarketplaceOrderResponse>({ url: `${BASE}/orders`, method: 'POST', data });

export const listOrders = (params: { status?: string; supplier_id?: number | string; page?: number } = {}) =>
  request<ListMarketplaceOrdersResponse>({ url: `${BASE}/orders`, method: 'GET', params });

export const getOrder = (orderId: string | number) =>
  request<GetMarketplaceOrderResponse>({ url: `${BASE}/orders/${orderId}`, method: 'GET' });

export const trackOrder = (orderId: string | number) =>
  request<GetMarketplaceTrackingResponse>({ url: `${BASE}/orders/${orderId}/track`, method: 'GET' });

export const getSupplierDashboard = (supplierId: number | string) =>
  request<Record<string, unknown>>({ url: `${BASE}/suppliers/dashboard`, method: 'GET', params: { supplier_id: supplierId } });

export const getSupplierCatalog = (supplierId: number | string, page = 1) =>
  request<{ items: Array<Record<string, unknown>>; total: number }>({
    url: `${BASE}/suppliers/${supplierId}/catalog`,
    method: 'GET',
    params: { page },
  });

export const onboardSupplier = (data: SupplierOnboardRequest) =>
  request<SupplierOnboardResponse>({ url: `${BASE}/suppliers/onboard`, method: 'POST', data });

export type {
  CreateMarketplaceOrderRequest,
  CreateMarketplaceOrderResponse,
  CreateRfqRequest,
  CreateRfqResponse,
  GetMarketplaceOrderResponse,
  GetMarketplaceTrackingResponse,
  GetRfqResponse,
  ListMarketplaceOrdersResponse,
  MarketplaceRecommendation,
  MarketplaceSearchRequest,
  MarketplaceSearchResponse,
  SupplierOnboardRequest,
  SupplierOnboardResponse,
};
