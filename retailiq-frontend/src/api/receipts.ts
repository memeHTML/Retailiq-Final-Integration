/**
 * src/api/receipts.ts
 * Oracle Document sections consumed: 3, 4, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { request, requestBlob } from '@/api/client';
import type {
  GetPrintJobResponse,
  GetReceiptTemplateResponse,
  PrintReceiptRequest,
  PrintReceiptResponse,
  UpdateReceiptTemplateRequest,
  UpdateReceiptTemplateResponse,
} from '@/types/api';

export const getReceiptTemplate = () => request<GetReceiptTemplateResponse>({ url: '/api/v1/receipts/template', method: 'GET' });
export const updateReceiptTemplate = (payload: UpdateReceiptTemplateRequest) => request<UpdateReceiptTemplateResponse>({ url: '/api/v1/receipts/template', method: 'PUT', data: payload });
export const printReceipt = (payload: PrintReceiptRequest) => request<PrintReceiptResponse>({ url: '/api/v1/receipts/print', method: 'POST', data: payload });
export const getPrintJob = (jobId: string | number) => request<GetPrintJobResponse>({ url: `/api/v1/receipts/print/${jobId}`, method: 'GET' });
export const getReceiptTemplateBlob = () => requestBlob({ url: '/api/v1/receipts/template', method: 'GET' });
