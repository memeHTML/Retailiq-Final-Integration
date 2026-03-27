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

export const inventoryKeys = {
  all: ['inventory'] as const,
  lists: () => [...inventoryKeys.all, 'list'] as const,
  list: (filters: ListProductsRequest) => [...inventoryKeys.lists(), filters] as const,
  details: () => [...inventoryKeys.all, 'detail'] as const,
  detail: (productId: number | string) => [...inventoryKeys.details(), productId] as const,
};

export const useProductsQuery = (filters: ListProductsRequest) =>
  useQuery({ queryKey: inventoryKeys.list(filters), queryFn: () => inventoryApi.listProducts(filters), staleTime: 60_000 });
export const useProductQuery = (productId: number | string | null) =>
  useQuery({ queryKey: inventoryKeys.detail(productId ?? ''), queryFn: () => inventoryApi.getProductById(productId as number | string), staleTime: 60_000, enabled: Boolean(productId) });

export const useCreateProductMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProductRequest) => inventoryApi.createProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
    },
  });
};

export const useUpdateProductMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, payload }: { productId: number | string; payload: UpdateProductRequest }) => inventoryApi.updateProduct(productId, payload),
    onSuccess: (_data: UpdateProductResponse, variables: { productId: number | string; payload: UpdateProductRequest }) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(variables.productId) });
    },
  });
};

export const useDeleteProductMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: number | string) => inventoryApi.deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
    },
  });
};

export const useStockUpdateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, payload }: { productId: number | string; payload: StockUpdateRequest }) => inventoryApi.updateStock(productId, payload),
    onSuccess: (_data: StockUpdateResponse, variables: { productId: number | string; payload: StockUpdateRequest }) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(variables.productId) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
    },
  });
};

export const useStockAuditMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: StockAuditRequest) => inventoryApi.stockAudit(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
    },
  });
};
