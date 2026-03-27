/**
 * src/hooks/receipts.ts
 * Oracle Document sections consumed: 3, 4, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as receiptsApi from '@/api/receipts';
import type { GetPrintJobResponse, PrintReceiptRequest, UpdateReceiptTemplateRequest } from '@/types/api';

export const useReceiptTemplateQuery = () => useQuery({ queryKey: ['receipts', 'template'], queryFn: receiptsApi.getReceiptTemplate, staleTime: 60_000 });
export const usePrintJobQuery = (jobId: string | number | null) => useQuery({ queryKey: ['receipts', 'print-job', jobId], queryFn: () => receiptsApi.getPrintJob(jobId as string | number), enabled: Boolean(jobId), refetchInterval: (query: { state: { data: GetPrintJobResponse | undefined } }) => {
  const status = query.state.data?.status;
  return status === 'PENDING' || status === 'PROCESSING' ? 2500 : false;
}, staleTime: 0 });

export const useUpdateReceiptTemplateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateReceiptTemplateRequest) => receiptsApi.updateReceiptTemplate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts', 'template'] });
    },
  });
};

export const usePrintReceiptMutation = () => useMutation({ mutationFn: (payload: PrintReceiptRequest) => receiptsApi.printReceipt(payload) });
