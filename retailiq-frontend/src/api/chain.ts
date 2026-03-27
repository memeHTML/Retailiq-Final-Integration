import { request } from '@/api/client';

const CHAIN_BASE = '/api/v1/chain';

export interface CreateChainGroupRequest {
  name: string;
}

export interface UpdateChainGroupRequest {
  name?: string;
}

export interface AddStoreRequest {
  store_id: number;
  manager_user_id?: number | null;
}

export interface ChainGroup {
  group_id: string;
  name: string;
  description: string | null;
  owner_user_id: number;
  created_at: string | null;
  updated_at: string | null;
  member_store_ids: number[];
}

export interface ChainDashboard {
  total_revenue_today: number;
  best_store: Record<string, unknown> | null;
  worst_store: Record<string, unknown> | null;
  total_open_alerts: number;
  per_store_today: Array<{
    store_id: number;
    name: string;
    revenue: number;
    transaction_count: number;
    alert_count: number;
  }>;
  transfer_suggestions: Array<{
    id: string;
    from_store: number;
    to_store: number;
    product: number;
    qty: number;
    reason: string;
  }>;
}

export interface ChainComparisonRow {
  store_id: number;
  revenue: number;
  profit: number;
  relative_to_avg: 'above' | 'below' | 'near';
}

export interface ChainTransfer {
  id: string;
  from_store: number;
  to_store: number;
  product: number;
  qty: number;
  reason: string;
  status: string;
  created_at: string | null;
}

export interface CreateTransferRequest {
  from_store_id: number;
  to_store_id: number;
  product_id: number;
  quantity: number;
  notes?: string;
}

export interface ConfirmTransferResponse {
  message: string;
  id: string;
}

export const chainApi = {
  createGroup: (data: CreateChainGroupRequest) =>
    request<{ group_id: string; name: string }>({
      url: `${CHAIN_BASE}/groups`,
      method: 'POST',
      data,
    }),

  getGroup: (chainId: string) =>
    request<ChainGroup>({
      url: `${CHAIN_BASE}/groups/${chainId}`,
      method: 'GET',
    }),

  updateGroup: (chainId: string, data: UpdateChainGroupRequest) =>
    request<ChainGroup>({
      url: `${CHAIN_BASE}/groups/${chainId}`,
      method: 'PATCH',
      data,
    }),

  addStore: (chainId: string, data: AddStoreRequest) =>
    request<{ membership_id: string }>({
      url: `${CHAIN_BASE}/groups/${chainId}/stores`,
      method: 'POST',
      data,
    }),

  removeStore: (chainId: string, storeId: string | number) =>
    request<{ store_id: number; removed: boolean }>({
      url: `${CHAIN_BASE}/groups/${chainId}/stores/${storeId}`,
      method: 'DELETE',
    }),

  getDashboard: (chainId: string) =>
    request<ChainDashboard>({
      url: `${CHAIN_BASE}/dashboard`,
      method: 'GET',
    }),

  getComparison: (chainId: string, period: string) =>
    request<ChainComparisonRow[]>({
      url: `${CHAIN_BASE}/compare`,
      method: 'GET',
      params: { period },
    }),

  getTransfers: (chainId: string) =>
    request<ChainTransfer[]>({
      url: `${CHAIN_BASE}/transfers`,
      method: 'GET',
    }),

  createTransfer: (chainId: string, data: CreateTransferRequest) =>
    request<ChainTransfer>({
      url: `${CHAIN_BASE}/transfers`,
      method: 'POST',
      data,
    }),

  confirmTransfer: (chainId: string, transferId: string) =>
    request<ConfirmTransferResponse>({
      url: `${CHAIN_BASE}/transfers/${transferId}/confirm`,
      method: 'POST',
    }),
};
