/**
 * src/hooks/inventory.ts
 * Oracle Document sections consumed: 3, 4, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as inventoryApi from '@/api/inventory';
import type {
  CreateProductRequest,
  ListProductsRequest,
  StockAuditRequest,
  StockUpdateRequest,
  StockUpdateResponse,
  UpdateProductRequest,
  UpdateProductResponse,
} from '@/types/api';

export const useProductsQuery = (filters: ListProductsRequest) => useQuery({ queryKey: ['inventory', 'list', filters], queryFn: () => inventoryApi.listProducts(filters), staleTime: 60_000 });
export const useProductQuery = (productId: number | string) => useQuery({ queryKey: ['inventory', 'detail', productId], queryFn: () => inventoryApi.getProductById(productId), staleTime: 60_000, enabled: Boolean(productId) });
export const useInventoryAlertsQuery = () =>
  useQuery({ queryKey: ['inventory', 'alerts'], queryFn: inventoryApi.getInventoryAlerts, staleTime: 30_000 });

export const useCreateProductMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProductRequest) => inventoryApi.createProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'list'] });
    },
  });
};

export const useUpdateProductMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, payload }: { productId: number | string; payload: UpdateProductRequest }) => inventoryApi.updateProduct(productId, payload),
    onSuccess: (_data: UpdateProductResponse, variables: { productId: number | string; payload: UpdateProductRequest }) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'detail', variables.productId] });
    },
  });
};

export const useDeleteProductMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: number | string) => inventoryApi.deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'list'] });
    },
  });
};

export const useStockUpdateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, payload }: { productId: number | string; payload: StockUpdateRequest }) => inventoryApi.updateStock(productId, payload),
    onSuccess: (_data: StockUpdateResponse, variables: { productId: number | string; payload: StockUpdateRequest }) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'detail', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'list'] });
    },
  });
};

export const useStockAuditMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: StockAuditRequest) => inventoryApi.stockAudit(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'list'] });
    },
  });
};

export const useDismissInventoryAlertMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (alertId: number | string) => inventoryApi.dismissInventoryAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'alerts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'alerts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'alerts-feed'] });
    },
  });
};
