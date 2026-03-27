/**
 * src/hooks/vision.ts
 * Oracle Document sections consumed: 3, 4, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as visionApi from '@/api/vision';
import type { ConfirmOcrItemsRequest, ConfirmOcrItemsResponse, DismissOcrJobResponse, GetOcrJobResponse, ShelfScanRequest } from '@/types/api';

export type OcrPollingStopState = 'REVIEW' | 'FAILED' | 'APPLIED' | 'COMPLETED';

export const isPollingStopState = (status?: string | null) => Boolean(status && ['REVIEW', 'FAILED', 'APPLIED', 'COMPLETED'].includes(status));

export const useUploadOcrMutation = () => useMutation({ mutationFn: visionApi.uploadOcrInvoice });

export const useOcrJobQuery = (jobId: string | null) => useQuery({
  queryKey: ['vision', 'ocr', jobId],
  queryFn: () => visionApi.getOcrJob(jobId as string),
  enabled: Boolean(jobId),
  refetchInterval: (query: { state: { data: GetOcrJobResponse | undefined } }) => {
    const status = query.state.data?.status;
    return isPollingStopState(status) ? false : 3000;
  },
  staleTime: 0,
});

export const useConfirmOcrMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, payload }: { jobId: string | number; payload: ConfirmOcrItemsRequest }) => visionApi.confirmOcrJob(jobId, payload),
    onSuccess: (_data: ConfirmOcrItemsResponse, variables: { jobId: string | number; payload: ConfirmOcrItemsRequest }) => {
      queryClient.invalidateQueries({ queryKey: ['vision', 'ocr', String(variables.jobId)] });
    },
  });
};

export const useDismissOcrMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string | number) => visionApi.dismissOcrJob(jobId),
    onSuccess: (_data: DismissOcrJobResponse, jobId: string | number) => {
      queryClient.invalidateQueries({ queryKey: ['vision', 'ocr', String(jobId)] });
    },
  });
};

export const useShelfScanMutation = () => useMutation({ mutationFn: (payload: ShelfScanRequest) => visionApi.shelfScan(payload) });
