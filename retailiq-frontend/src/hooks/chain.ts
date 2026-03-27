import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chainApi, type AddStoreRequest, type ChainGroup, type ChainDashboard, type ChainComparisonRow, type ChainTransfer, type CreateChainGroupRequest, type CreateTransferRequest, type UpdateChainGroupRequest } from '@/api/chain';

export const chainKeys = {
  all: ['chain'] as const,
  group: (id: string) => [...chainKeys.all, 'group', id] as const,
  dashboard: (id: string) => [...chainKeys.all, 'dashboard', id] as const,
  comparison: (id: string, period: string) => [...chainKeys.all, 'comparison', id, period] as const,
  transfers: (id: string) => [...chainKeys.all, 'transfers', id] as const,
};

export const useChainGroupQuery = (chainId: string) =>
  useQuery<ChainGroup>({
    queryKey: chainKeys.group(chainId),
    queryFn: () => chainApi.getGroup(chainId),
    enabled: Boolean(chainId),
    staleTime: 60_000,
  });

export const useChainDashboardQuery = (chainId: string) =>
  useQuery<ChainDashboard>({
    queryKey: chainKeys.dashboard(chainId),
    queryFn: () => chainApi.getDashboard(chainId),
    enabled: Boolean(chainId),
    staleTime: 30_000,
  });

export const useChainComparisonQuery = (chainId: string, period: string) =>
  useQuery<ChainComparisonRow[]>({
    queryKey: chainKeys.comparison(chainId, period),
    queryFn: () => chainApi.getComparison(chainId, period),
    enabled: Boolean(chainId && period),
    staleTime: 60_000,
  });

export const useTransfersQuery = (chainId: string) =>
  useQuery<ChainTransfer[]>({
    queryKey: chainKeys.transfers(chainId),
    queryFn: () => chainApi.getTransfers(chainId),
    enabled: Boolean(chainId),
    staleTime: 30_000,
  });

export const useCreateChainGroupMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateChainGroupRequest) => chainApi.createGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chainKeys.all });
    },
  });
};

export const useUpdateChainGroupMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chainId, data }: { chainId: string; data: UpdateChainGroupRequest }) =>
      chainApi.updateGroup(chainId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chainKeys.all });
    },
  });
};

export const useAddStoreToChainMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chainId, data }: { chainId: string; data: AddStoreRequest }) => chainApi.addStore(chainId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chainKeys.all });
    },
  });
};

export const useRemoveStoreFromChainMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chainId, storeId }: { chainId: string; storeId: string | number }) => chainApi.removeStore(chainId, storeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chainKeys.all });
    },
  });
};

export const useCreateTransferMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chainId, data }: { chainId: string; data: CreateTransferRequest }) => chainApi.createTransfer(chainId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chainKeys.all });
    },
  });
};

export const useConfirmTransferMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chainId, transferId }: { chainId: string; transferId: string }) => chainApi.confirmTransfer(chainId, transferId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chainKeys.all });
    },
  });
};

export const useUpdateTransferStatusMutation = useConfirmTransferMutation;
