import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as gstApi from '@/api/gst';
import type { GstHsnMapping } from '@/api/gst';

export const gstKeys = {
  all: ['gst'] as const,
  config: () => [...gstKeys.all, 'config'] as const,
  summary: (period: string) => [...gstKeys.all, 'summary', period] as const,
  gstr1: (period: string) => [...gstKeys.all, 'gstr1', period] as const,
  liabilitySlabs: (period: string) => [...gstKeys.all, 'liability-slabs', period] as const,
  hsnSearch: (query: string) => [...gstKeys.all, 'hsn-search', query] as const,
  hsnMappings: () => [...gstKeys.all, 'hsn-mappings'] as const,
};

export const useGstConfig = () =>
  useQuery({
    queryKey: gstKeys.config(),
    queryFn: gstApi.getGstConfig,
    staleTime: 60_000,
  });

export const useUpdateGstConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: gstApi.updateGstConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gstKeys.config() });
    },
  });
};

export const useGstSummary = (period: string) =>
  useQuery({
    queryKey: gstKeys.summary(period),
    queryFn: () => gstApi.getGstSummary(period),
    enabled: Boolean(period),
    staleTime: 300_000,
  });

export const useGstr1 = (period: string) =>
  useQuery({
    queryKey: gstKeys.gstr1(period),
    queryFn: () => gstApi.getGstr1(period),
    enabled: Boolean(period),
    staleTime: 300_000,
  });

export const useFileGstr1 = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: gstApi.fileGstr1,
    onSuccess: (_, period) => {
      queryClient.invalidateQueries({ queryKey: gstKeys.gstr1(period) });
      queryClient.invalidateQueries({ queryKey: gstKeys.summary(period) });
    },
  });
};

export const useHsnSearch = (query: string) =>
  useQuery({
    queryKey: gstKeys.hsnSearch(query),
    queryFn: () => gstApi.searchHsn(query),
    enabled: query.trim().length > 0,
    staleTime: 600_000,
  });

export const useGstLiabilitySlabs = (period: string) =>
  useQuery({
    queryKey: gstKeys.liabilitySlabs(period),
    queryFn: () => gstApi.getGstLiabilitySlabs(period),
    enabled: Boolean(period),
    staleTime: 300_000,
  });

export const useHsnMappings = () =>
  useQuery({
    queryKey: gstKeys.hsnMappings(),
    queryFn: gstApi.listHsnMappings,
    staleTime: 60_000,
  });

export const useCreateHsnMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: gstApi.createHsnMapping,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gstKeys.hsnMappings() });
    },
  });
};

export const useUpdateHsnMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ hsnCode, payload }: { hsnCode: string; payload: Partial<GstHsnMapping> }) =>
      gstApi.updateHsnMapping(hsnCode, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gstKeys.hsnMappings() });
    },
  });
};

export const useDeleteHsnMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: gstApi.deleteHsnMapping,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gstKeys.hsnMappings() });
    },
  });
};

export const useGSTConfigQuery = useGstConfig;
export const useUpdateGSTConfigMutation = useUpdateGstConfig;
export const useGSTSummaryQuery = useGstSummary;
export const useGSTR1Query = useGstr1;
export const useFileGSTR1Mutation = useFileGstr1;
export const useHSNSearchQuery = useHsnSearch;
export const useLiabilitySlabsQuery = useGstLiabilitySlabs;
export const useHSNMappingsQuery = useHsnMappings;
export const useCreateHSNMappingMutation = useCreateHsnMapping;
export const useUpdateHSNMappingMutation = useUpdateHsnMapping;
export const useDeleteHSNMappingMutation = useDeleteHsnMapping;
