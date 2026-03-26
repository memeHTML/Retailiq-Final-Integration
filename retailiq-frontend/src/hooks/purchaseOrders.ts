import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelPurchaseOrder,
  confirmPurchaseOrder,
  createPurchaseOrder,
  downloadPurchaseOrderPdf,
  emailPurchaseOrder,
  getPurchaseOrder,
  getPurchaseOrderPdfMetadata,
  listPurchaseOrders,
  receivePurchaseOrder,
  sendPurchaseOrder,
  updatePurchaseOrder,
  type PurchaseOrderCreatePayload,
  type PurchaseOrderDetail,
  type PurchaseOrderListItem,
  type PurchaseOrderListParams,
  type PurchaseOrderPdfMetadata,
  type PurchaseOrderReceivePayload,
  type PurchaseOrderUpdatePayload,
  type PurchaseOrderStatus,
} from '@/api/purchaseOrders';

export const purchaseOrderKeys = {
  all: ['purchaseOrders'] as const,
  lists: () => [...purchaseOrderKeys.all, 'list'] as const,
  list: (params: PurchaseOrderListParams = {}) => [...purchaseOrderKeys.lists(), params] as const,
  details: () => [...purchaseOrderKeys.all, 'detail'] as const,
  detail: (purchaseOrderId: string) => [...purchaseOrderKeys.details(), purchaseOrderId] as const,
  pdf: (purchaseOrderId: string) => [...purchaseOrderKeys.all, 'pdf', purchaseOrderId] as const,
};

export function usePurchaseOrders(params: PurchaseOrderListParams = {}) {
  return useQuery<PurchaseOrderListItem[]>({
    queryKey: purchaseOrderKeys.list(params),
    queryFn: () => listPurchaseOrders(params),
    staleTime: 30_000,
  });
}

export function usePurchaseOrder(purchaseOrderId?: string) {
  return useQuery<PurchaseOrderDetail>({
    queryKey: purchaseOrderKeys.detail(purchaseOrderId ?? ''),
    queryFn: () => getPurchaseOrder(purchaseOrderId ?? ''),
    enabled: Boolean(purchaseOrderId),
    staleTime: 60_000,
  });
}

export function usePurchaseOrderPdfMetadata(purchaseOrderId?: string) {
  return useQuery<PurchaseOrderPdfMetadata>({
    queryKey: purchaseOrderKeys.pdf(purchaseOrderId ?? ''),
    queryFn: () => getPurchaseOrderPdfMetadata(purchaseOrderId ?? ''),
    enabled: Boolean(purchaseOrderId),
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PurchaseOrderCreatePayload) => createPurchaseOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
    },
  });
}

export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ purchaseOrderId, payload }: { purchaseOrderId: string; payload: PurchaseOrderUpdatePayload }) =>
      updatePurchaseOrder(purchaseOrderId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(variables.purchaseOrderId) });
    },
  });
}

export function useSendPurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (purchaseOrderId: string) => sendPurchaseOrder(purchaseOrderId),
    onSuccess: (_data, purchaseOrderId) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(purchaseOrderId) });
    },
  });
}

export function useReceivePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ purchaseOrderId, payload }: { purchaseOrderId: string; payload: PurchaseOrderReceivePayload }) =>
      receivePurchaseOrder(purchaseOrderId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(variables.purchaseOrderId) });
    },
  });
}

export function useConfirmPurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (purchaseOrderId: string) => confirmPurchaseOrder(purchaseOrderId),
    onSuccess: (_data, purchaseOrderId) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(purchaseOrderId) });
    },
  });
}

export function useCancelPurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (purchaseOrderId: string) => cancelPurchaseOrder(purchaseOrderId),
    onSuccess: (_data, purchaseOrderId) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(purchaseOrderId) });
    },
  });
}

export function useEmailPurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ purchaseOrderId, email }: { purchaseOrderId: string; email: string }) =>
      emailPurchaseOrder(purchaseOrderId, email),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(variables.purchaseOrderId) });
    },
  });
}

export function usePurchaseOrderPdfDownload() {
  return useMutation({
    mutationFn: (purchaseOrderId: string) => downloadPurchaseOrderPdf(purchaseOrderId),
  });
}

export function getPurchaseOrderStatusColor(status: PurchaseOrderStatus | string): string {
  switch (status) {
    case 'DRAFT':
      return 'gray';
    case 'SENT':
      return 'blue';
    case 'CONFIRMED':
      return 'indigo';
    case 'FULFILLED':
      return 'green';
    case 'CANCELLED':
      return 'red';
    default:
      return 'gray';
  }
}

export function getPurchaseOrderStatusText(status: PurchaseOrderStatus | string): string {
  switch (status) {
    case 'DRAFT':
      return 'Draft';
    case 'SENT':
      return 'Sent';
    case 'CONFIRMED':
      return 'Confirmed';
    case 'FULFILLED':
      return 'Received';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
}

export const canEditPurchaseOrder = (status: PurchaseOrderStatus | string) => status === 'DRAFT';
export const canSendPurchaseOrder = (status: PurchaseOrderStatus | string) => status === 'DRAFT';
export const canConfirmPurchaseOrder = (status: PurchaseOrderStatus | string) => status === 'SENT';
export const canReceivePurchaseOrder = (status: PurchaseOrderStatus | string) => status === 'SENT' || status === 'CONFIRMED';
export const canCancelPurchaseOrder = (status: PurchaseOrderStatus | string) => status === 'DRAFT' || status === 'SENT';

export const usePurchaseOrdersQuery = usePurchaseOrders;
export const usePurchaseOrderQuery = usePurchaseOrder;
export const useCreatePurchaseOrderMutation = useCreatePurchaseOrder;
export const useUpdatePurchaseOrderMutation = useUpdatePurchaseOrder;
export const useSendPurchaseOrderMutation = useSendPurchaseOrder;
export const useReceivePurchaseOrderMutation = useReceivePurchaseOrder;
export const useConfirmPurchaseOrderMutation = useConfirmPurchaseOrder;
export const useCancelPurchaseOrderMutation = useCancelPurchaseOrder;
export const useEmailPurchaseOrderMutation = useEmailPurchaseOrder;
export const useGeneratePdfMutation = usePurchaseOrderPdfDownload;
