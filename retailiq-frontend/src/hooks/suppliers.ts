import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSupplier,
  deleteSupplier,
  getSupplier,
  linkSupplierProduct,
  listSuppliers,
  type SupplierCreatePayload,
  type SupplierDetail,
  type SupplierListItem,
  type SupplierListParams,
  type SupplierProductLinkPayload,
  type SupplierUpdatePayload,
  unlinkSupplierProduct,
  updateSupplier,
  updateSupplierProductLink,
} from '@/api/suppliers';

export const supplierKeys = {
  all: ['suppliers'] as const,
  lists: () => [...supplierKeys.all, 'list'] as const,
  list: (params: SupplierListParams = {}) => [...supplierKeys.lists(), params] as const,
  details: () => [...supplierKeys.all, 'detail'] as const,
  detail: (supplierId: string) => [...supplierKeys.details(), supplierId] as const,
};

export function useSuppliers(params: SupplierListParams = {}) {
  return useQuery<SupplierListItem[]>({
    queryKey: supplierKeys.list(params),
    queryFn: () => listSuppliers(params),
    staleTime: 30_000,
  });
}

export function useSupplier(supplierId?: string) {
  return useQuery<SupplierDetail>({
    queryKey: supplierKeys.detail(supplierId ?? ''),
    queryFn: () => getSupplier(supplierId ?? ''),
    enabled: Boolean(supplierId),
    staleTime: 60_000,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SupplierCreatePayload) => createSupplier(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ supplierId, payload }: { supplierId: string; payload: SupplierUpdatePayload }) =>
      updateSupplier(supplierId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
      queryClient.invalidateQueries({ queryKey: supplierKeys.detail(variables.supplierId) });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (supplierId: string) => deleteSupplier(supplierId),
    onSuccess: (_data, supplierId) => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
      queryClient.invalidateQueries({ queryKey: supplierKeys.detail(supplierId) });
    },
  });
}

export function useLinkSupplierProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ supplierId, payload }: { supplierId: string; payload: SupplierProductLinkPayload }) =>
      linkSupplierProduct(supplierId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.detail(variables.supplierId) });
    },
  });
}

export function useUpdateSupplierProductLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      supplierId,
      productId,
      payload,
    }: {
      supplierId: string;
      productId: number;
      payload: Partial<SupplierProductLinkPayload>;
    }) => updateSupplierProductLink(supplierId, productId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.detail(variables.supplierId) });
    },
  });
}

export function useUnlinkSupplierProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ supplierId, productId }: { supplierId: string; productId: number }) =>
      unlinkSupplierProduct(supplierId, productId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.detail(variables.supplierId) });
    },
  });
}

export const useSuppliersQuery = useSuppliers;
export const useSupplierQuery = useSupplier;
export const useCreateSupplierMutation = useCreateSupplier;
export const useUpdateSupplierMutation = useUpdateSupplier;
export const useDeleteSupplierMutation = useDeleteSupplier;
export const useLinkSupplierProductMutation = useLinkSupplierProduct;
export const useUpdateSupplierProductLinkMutation = useUpdateSupplierProductLink;
export const useUnlinkSupplierProductMutation = useUnlinkSupplierProduct;
