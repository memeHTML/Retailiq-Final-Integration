import { apiDelete, apiGet, apiPost, apiPut } from '@/api/client';

const BASE = '/api/v1/gst';

export interface GstConfig {
  gstin: string | null;
  registration_type: 'REGULAR' | 'COMPOSITION' | 'UNREGISTERED' | string;
  state_code: string | null;
  is_gst_enabled: boolean;
}

export interface GstSummary {
  period: string;
  total_taxable: number;
  total_cgst: number;
  total_sgst: number;
  total_igst: number;
  invoice_count: number;
  status: string;
  compiled_at: string | null;
}

export interface Gstr1Response extends Record<string, unknown> {
  period?: string;
  status?: string;
  filed_on?: string;
  acknowledgement_number?: string;
}

export interface GstHsnSearchResult {
  hsn_code: string;
  description: string;
  default_gst_rate: number | null;
}

export interface GstHsnMapping {
  hsn_code: string;
  category_id: string;
  tax_rate: number;
  description: string;
}

export interface GstLiabilitySlab {
  rate: number;
  taxable_value: number;
  tax_amount: number;
}

export interface GstFileResponse {
  period: string;
  status: string;
  acknowledgement_number: string;
  filed_on: string;
}

export const getGstConfig = () => apiGet<GstConfig>(`${BASE}/config`);

export const updateGstConfig = (payload: Partial<GstConfig>) => apiPut<GstConfig>(`${BASE}/config`, payload);

export const getGstSummary = (period: string) => apiGet<GstSummary>(`${BASE}/summary`, { period });

export const getGstr1 = (period: string) => apiGet<Gstr1Response>(`${BASE}/gstr1`, { period });

export const fileGstr1 = (period: string) => apiPost<GstFileResponse>(`${BASE}/gstr1/file`, { period });

export const searchHsn = (query: string) => apiGet<GstHsnSearchResult[]>(`${BASE}/hsn-search`, { q: query });

export const getGstLiabilitySlabs = (period: string) => apiGet<GstLiabilitySlab[]>(`${BASE}/liability-slabs`, { period });

export const listHsnMappings = () => apiGet<GstHsnMapping[]>(`${BASE}/hsn-mappings`);

export const createHsnMapping = (payload: GstHsnMapping) => apiPost<GstHsnMapping>(`${BASE}/hsn-mappings`, payload);

export const updateHsnMapping = (hsnCode: string, payload: Partial<GstHsnMapping>) =>
  apiPut<GstHsnMapping>(`${BASE}/hsn-mappings/${hsnCode}`, payload);

export const deleteHsnMapping = (hsnCode: string) => apiDelete<{ hsn_code: string; deleted: boolean }>(`${BASE}/hsn-mappings/${hsnCode}`);

export const gstApi = {
  getGstConfig,
  updateGstConfig,
  getGstSummary,
  getGstr1,
  fileGstr1,
  searchHsn,
  getGstLiabilitySlabs,
  listHsnMappings,
  createHsnMapping,
  updateHsnMapping,
  deleteHsnMapping,
};

export type { GstConfig as GSTConfig, GstSummary as GSTSummary, Gstr1Response as GSTR1Return, GstHsnSearchResult as HSNSearchResult, GstHsnMapping as HSNMapping, GstLiabilitySlab as GSTLiabilitySlab };
