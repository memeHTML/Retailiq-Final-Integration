/* @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useQuery: vi.fn(() => ({ data: undefined })),
  useMutation: vi.fn(() => ({ mutate: vi.fn(), mutateAsync: vi.fn() })),
  invalidateQueries: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: mocks.useQuery,
  useMutation: mocks.useMutation,
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}));

vi.mock('@/api/store', () => ({
  getStoreProfile: vi.fn(),
  listCategories: vi.fn(),
  getStoreTaxConfig: vi.fn(),
  updateStoreProfile: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  updateStoreTaxConfig: vi.fn(),
}));

import { useCategoriesQuery, useStoreProfileQuery, useStoreTaxConfigQuery } from './store';

describe('store hook cache windows', () => {
  it('keeps store profile cached for 10 minutes', () => {
    useStoreProfileQuery();
    expect(mocks.useQuery).toHaveBeenCalledWith(expect.objectContaining({ staleTime: 10 * 60_000 }));
  });

  it('keeps categories cached for 5 minutes', () => {
    useCategoriesQuery();
    expect(mocks.useQuery).toHaveBeenCalledWith(expect.objectContaining({ staleTime: 5 * 60_000 }));
  });

  it('keeps tax config cached for 10 minutes', () => {
    useStoreTaxConfigQuery();
    expect(mocks.useQuery).toHaveBeenCalledWith(expect.objectContaining({ staleTime: 10 * 60_000 }));
  });
});
