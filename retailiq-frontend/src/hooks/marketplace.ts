import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as marketplaceApi from '@/api/marketplace';
import type {
  CreateMarketplaceOrderRequest,
  CreateRfqRequest,
  MarketplaceSearchRequest,
  SupplierOnboardRequest,
} from '@/types/api';

export const marketplaceKeys = {
  all: ['marketplace'] as const,
  search: (params: MarketplaceSearchRequest = {}) => [...marketplaceKeys.all, 'search', params] as const,
  recommendations: (params: { category?: string; urgency?: string } = {}) => [...marketplaceKeys.all, 'recommendations', params] as const,
  rfq: (rfqId: string | number) => [...marketplaceKeys.all, 'rfq', rfqId] as const,
  orders: (params: { status?: string; supplier_id?: number | string; page?: number } = {}) => [...marketplaceKeys.all, 'orders', params] as const,
  order: (orderId: string | number) => [...marketplaceKeys.all, 'order', orderId] as const,
  tracking: (orderId: string | number) => [...marketplaceKeys.all, 'tracking', orderId] as const,
  supplierDashboard: (supplierId: number | string) => [...marketplaceKeys.all, 'supplier-dashboard', supplierId] as const,
  supplierCatalog: (supplierId: number | string, page: number) => [...marketplaceKeys.all, 'supplier-catalog', supplierId, page] as const,
};

export const useMarketplaceSearchQuery = (params: MarketplaceSearchRequest = {}) =>
  useQuery({
    queryKey: marketplaceKeys.search(params),
    queryFn: () => marketplaceApi.searchCatalog(params),
    staleTime: 60_000,
  });

export const useMarketplaceRecommendationsQuery = (params: { category?: string; urgency?: string } = {}) =>
  useQuery({
    queryKey: marketplaceKeys.recommendations(params),
    queryFn: () => marketplaceApi.getRecommendations(params),
    staleTime: 120_000,
  });

export const useCreateRfqMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRfqRequest) => marketplaceApi.createRfq(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: marketplaceKeys.all });
    },
  });
};

export const useRfqQuery = (rfqId: string | number) =>
  useQuery({
    queryKey: marketplaceKeys.rfq(rfqId),
    queryFn: () => marketplaceApi.getRfq(rfqId),
    staleTime: 60_000,
    enabled: Boolean(rfqId),
  });

export const useCreateMarketplaceOrderMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMarketplaceOrderRequest) => marketplaceApi.createOrder(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: marketplaceKeys.all });
    },
  });
};

export const useMarketplaceOrdersQuery = (params: { status?: string; supplier_id?: number | string; page?: number } = {}) =>
  useQuery({
    queryKey: marketplaceKeys.orders(params),
    queryFn: () => marketplaceApi.listOrders(params),
    staleTime: 60_000,
  });

export const useMarketplaceOrderQuery = (orderId: string | number) =>
  useQuery({
    queryKey: marketplaceKeys.order(orderId),
    queryFn: () => marketplaceApi.getOrder(orderId),
    staleTime: 60_000,
    enabled: Boolean(orderId),
  });

export const useMarketplaceTrackingQuery = (orderId: string | number) =>
  useQuery({
    queryKey: marketplaceKeys.tracking(orderId),
    queryFn: () => marketplaceApi.trackOrder(orderId),
    staleTime: 30_000,
    enabled: Boolean(orderId),
  });

export const useSupplierDashboardQuery = (supplierId: number | string) =>
  useQuery({
    queryKey: marketplaceKeys.supplierDashboard(supplierId),
    queryFn: () => marketplaceApi.getSupplierDashboard(supplierId),
    staleTime: 120_000,
    enabled: Boolean(supplierId),
  });

export const useSupplierCatalogQuery = (supplierId: number | string, page = 1) =>
  useQuery({
    queryKey: marketplaceKeys.supplierCatalog(supplierId, page),
    queryFn: () => marketplaceApi.getSupplierCatalog(supplierId, page),
    staleTime: 120_000,
    enabled: Boolean(supplierId),
  });

export const useSupplierOnboardMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SupplierOnboardRequest) => marketplaceApi.onboardSupplier(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: marketplaceKeys.all });
    },
  });
};
