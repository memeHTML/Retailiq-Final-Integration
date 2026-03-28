import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as inventoryApi from '@/api/inventory';
import type {
  CreateProductRequest,
  ListProductsRequest,
  StockAuditRequest,
  StockUpdateRequest,
  UpdateProductRequest,
} from '@/types/api';

export const inventoryKeys = {
  all: ['inventory'] as const,
  lists: () => [...inventoryKeys.all, 'lists'] as const,
  list: (filters: ListProductsRequest) => [...inventoryKeys.lists(), filters] as const,
  details: () => [...inventoryKeys.all, 'details'] as const,
  detail: (productId: number | string) => [...inventoryKeys.details(), String(productId)] as const,
  priceHistory: (productId: number | string) => [...inventoryKeys.all, 'price-history', String(productId)] as const,
  alerts: () => [...inventoryKeys.all, 'alerts'] as const,
};

export function useProducts(filters: ListProductsRequest = {}) {
  return useQuery({
    queryKey: inventoryKeys.list(filters),
    queryFn: () => inventoryApi.listProducts(filters),
    staleTime: 60_000,
  });
}

export function useProduct(productId: number | string) {
  return useQuery({
    queryKey: inventoryKeys.detail(productId),
    queryFn: () => inventoryApi.getProductById(productId),
    staleTime: 60_000,
    enabled: Boolean(productId),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProductRequest) => inventoryApi.createProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, payload }: { productId: number | string; payload: UpdateProductRequest }) => inventoryApi.updateProduct(productId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(variables.productId) });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: number | string) => inventoryApi.deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
    },
  });
}

export function useStockUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, payload }: { productId: number | string; payload: StockUpdateRequest }) => inventoryApi.updateStock(productId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(variables.productId) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
    },
  });
}

export function useStockAudit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: StockAuditRequest) => inventoryApi.stockAudit(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

export function usePriceHistory(productId: number | string) {
  return useQuery({
    queryKey: inventoryKeys.priceHistory(productId),
    queryFn: async () => inventoryApi.getPriceHistory(productId),
    enabled: Boolean(productId),
    staleTime: 60_000,
  });
}

export function useInventoryAlerts() {
  return useQuery({
    queryKey: inventoryKeys.alerts(),
    queryFn: inventoryApi.getInventoryAlerts,
    staleTime: 30_000,
  });
}

export function useDismissInventoryAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (alertId: number | string) => inventoryApi.dismissInventoryAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.alerts() });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'alerts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'alerts-feed'] });
    },
  });
}

export const useProductsQuery = useProducts;
export const useProductQuery = useProduct;
export const useCreateProductMutation = useCreateProduct;
export const useUpdateProductMutation = useUpdateProduct;
export const useDeleteProductMutation = useDeleteProduct;
export const useStockUpdateMutation = useStockUpdate;
export const useStockAuditMutation = useStockAudit;
export const useInventoryAlertsQuery = useInventoryAlerts;
export const useDismissInventoryAlertMutation = useDismissInventoryAlert;

