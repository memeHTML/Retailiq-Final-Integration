/**
 * src/hooks/store.ts
 * Oracle Document sections consumed: 3, 4, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as storeApi from '@/api/store';
import type {
  CreateCategoryRequest,
  UpdateCategoryRequest,
  UpdateStoreProfileRequest,
  UpdateStoreTaxConfigRequest,
} from '@/types/api';

export const useStoreProfileQuery = () => useQuery({ queryKey: ['store', 'profile'], queryFn: storeApi.getStoreProfile, staleTime: 60_000 });
export const useCategoriesQuery = () => useQuery({ queryKey: ['store', 'categories'], queryFn: storeApi.listCategories, staleTime: 60_000 });
export const useStoreTaxConfigQuery = () => useQuery({ queryKey: ['store', 'tax-config'], queryFn: storeApi.getStoreTaxConfig, staleTime: 60_000 });

export const useUpdateStoreProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateStoreProfileRequest) => storeApi.updateStoreProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store', 'profile'] });
    },
  });
};

export const useCreateCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCategoryRequest) => storeApi.createCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store', 'categories'] });
    },
  });
};

export const useUpdateCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, payload }: { categoryId: number | string; payload: UpdateCategoryRequest }) => storeApi.updateCategory(categoryId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store', 'categories'] });
    },
  });
};

export const useDeleteCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: number | string) => storeApi.deleteCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store', 'categories'] });
    },
  });
};

export const useUpdateStoreTaxConfigMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateStoreTaxConfigRequest) => storeApi.updateStoreTaxConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store', 'tax-config'] });
    },
  });
};
