/**
 * src/api/store.ts
 * Oracle Document sections consumed: 3, 4, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { request } from '@/api/client';
import { requestEnvelope } from '@/api/client';
import type {
  CreateCategoryRequest,
  CreateCategoryResponse,
  DeleteCategoryResponse,
  GetStoreProfileResponse,
  GetStoreTaxConfigResponse,
  ListCategoriesResponse,
  UpdateCategoryRequest,
  UpdateCategoryResponse,
  UpdateStoreProfileRequest,
  UpdateStoreProfileResponse,
  UpdateStoreTaxConfigRequest,
  UpdateStoreTaxConfigResponse,
} from '@/types/api';

export const getStoreProfile = () => request<GetStoreProfileResponse>({ url: '/api/v1/store/profile', method: 'GET' });
export const updateStoreProfile = (payload: UpdateStoreProfileRequest) => request<UpdateStoreProfileResponse>({ url: '/api/v1/store/profile', method: 'PUT', data: payload });
export const listCategories = async (): Promise<ListCategoriesResponse> => {
  const categories = await request<ListCategoriesResponse['categories']>({ url: '/api/v1/store/categories', method: 'GET' });
  return { categories: Array.isArray(categories) ? categories : [] };
};
export const getCategories = listCategories;
export const createCategory = (payload: CreateCategoryRequest) => request<CreateCategoryResponse>({ url: '/api/v1/store/categories', method: 'POST', data: payload });
export const updateCategory = (categoryId: number | string, payload: UpdateCategoryRequest) => request<UpdateCategoryResponse>({ url: `/api/v1/store/categories/${categoryId}`, method: 'PUT', data: payload });
export const deleteCategory = (categoryId: number | string) => request<DeleteCategoryResponse>({ url: `/api/v1/store/categories/${categoryId}`, method: 'DELETE' });
export const getStoreTaxConfig = () => request<GetStoreTaxConfigResponse>({ url: '/api/v1/store/tax-config', method: 'GET' });
export const updateStoreTaxConfig = async (payload: UpdateStoreTaxConfigRequest): Promise<UpdateStoreTaxConfigResponse> => {
  await requestEnvelope({ url: '/api/v1/store/tax-config', method: 'PUT', data: payload });
  return getStoreTaxConfig();
};
export const updateTaxConfig = updateStoreTaxConfig;
