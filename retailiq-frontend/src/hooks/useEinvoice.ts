import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as einvoiceApi from '@/api/einvoice';
import type { GenerateEInvoiceRequest } from '@/types/api';

export const einvoiceKeys = {
  all: ['einvoice'] as const,
  status: (invoiceId: string) => [...einvoiceKeys.all, 'status', invoiceId] as const,
};

export const useGenerateEinvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GenerateEInvoiceRequest) => einvoiceApi.generateEInvoice(payload),
    onSuccess: (data) => {
      if (data?.invoice_id) {
        queryClient.invalidateQueries({ queryKey: einvoiceKeys.status(data.invoice_id) });
      }
    },
  });
};

export const useEinvoiceStatus = (invoiceId: string) =>
  useQuery({
    queryKey: einvoiceKeys.status(invoiceId),
    queryFn: () => einvoiceApi.getEInvoiceStatus(invoiceId),
    enabled: Boolean(invoiceId),
    staleTime: 30_000,
  });

export const useGenerateEInvoiceMutation = useGenerateEinvoice;
export const useEInvoiceStatusQuery = useEinvoiceStatus;
