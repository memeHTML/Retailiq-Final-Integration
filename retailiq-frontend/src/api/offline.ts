import { apiClient, unwrapEnvelope } from '@/api/client';
import type { GetOfflineSnapshotResponse } from '@/types/api';

const BASE = '/api/v1/offline';

const extractBuildingMessage = (payload: unknown) => {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const record = payload as Record<string, unknown>;
    if (typeof record.message === 'string') {
      return record.message;
    }

    if (record.error && typeof record.error === 'object' && !Array.isArray(record.error)) {
      const nested = record.error as Record<string, unknown>;
      if (typeof nested.message === 'string') {
        return nested.message;
      }
    }
  }

  return 'Snapshot is currently building.';
};

export const getSnapshot = async (): Promise<GetOfflineSnapshotResponse> => {
  const response = await apiClient.get<unknown>(`${BASE}/snapshot`);

  if (response.status === 202) {
    return {
      status: 'building',
      message: extractBuildingMessage(response.data),
    };
  }

  return unwrapEnvelope<GetOfflineSnapshotResponse>(response.data) as GetOfflineSnapshotResponse;
};
