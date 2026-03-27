/**
 * src/api/barcodes.ts
 * Barcode contract aligned to /api/v1/barcodes/*.
 */
import { request } from '@/api/client';
import type {
  LookupBarcodeRequest,
  LookupBarcodeResponse,
} from '@/types/api';

export interface BarcodeRecord {
  id: number;
  product_id: number | string;
  store_id: number | string;
  barcode_value: string;
  barcode_type: string;
  created_at: string | null;
}

export interface RegisterBarcodeRequest {
  product_id: number | string;
  barcode_value: string;
  barcode_type?: string;
}

export type RegisterBarcodeResponse = BarcodeRecord;

export const lookupBarcode = (payload: LookupBarcodeRequest) =>
  request<LookupBarcodeResponse>({ url: '/api/v1/barcodes/lookup', method: 'GET', params: payload });

export const registerBarcode = (data: RegisterBarcodeRequest) =>
  request<RegisterBarcodeResponse>({ url: '/api/v1/barcodes/register', method: 'POST', data });

export async function listBarcodes(productId: number | string) {
  const data = await request<BarcodeRecord[]>({
    url: '/api/v1/barcodes/list',
    method: 'GET',
    params: { product_id: productId },
  });

  return Array.isArray(data) ? data : [];
}
