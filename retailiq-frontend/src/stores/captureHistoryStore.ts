/**
 * src/stores/captureHistoryStore.ts
 * Local convenience history for capture flows that do not have authoritative list endpoints.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { StateCreator } from 'zustand';
import { CAPTURE_HISTORY_STORAGE_KEY } from '@/lib/constants';

interface ScopeInput {
  storeId: number | string;
  userId: number | string;
}

export interface ReceiptJobHistoryEntry {
  job_id: number;
  transaction_id: string | null;
  job_type: string;
  status: string;
  created_at: string | null;
  completed_at: string | null;
}

export interface OcrJobHistoryEntry {
  job_id: string;
  status: string;
  error_message: string | null;
  item_count: number;
  updated_at: string;
}

interface ScopedHistory {
  receipts: ReceiptJobHistoryEntry[];
  ocr: OcrJobHistoryEntry[];
}

export interface CaptureHistoryState {
  scopes: Record<string, ScopedHistory>;
  recordReceiptJob: (scope: ScopeInput, entry: ReceiptJobHistoryEntry) => void;
  recordOcrJob: (scope: ScopeInput, entry: OcrJobHistoryEntry) => void;
  getReceiptJobs: (scope: ScopeInput) => ReceiptJobHistoryEntry[];
  getOcrJobs: (scope: ScopeInput) => OcrJobHistoryEntry[];
  clearAll: () => void;
}

const memoryStorage = {
  getItem: (_name: string) => null,
  setItem: (_name: string, _value: string) => undefined,
  removeItem: (_name: string) => undefined,
};

export const captureHistoryScopeKey = ({ storeId, userId }: ScopeInput) => `${storeId}:${userId}`;

const upsertRecent = <T extends { job_id: number | string }>(items: T[], entry: T, limit = 10) => [
  entry,
  ...items.filter((item) => item.job_id !== entry.job_id),
].slice(0, limit);

const captureHistoryStateCreator: StateCreator<CaptureHistoryState> = (set, get) => ({
  scopes: {},
  recordReceiptJob: (scope, entry) => {
    const key = captureHistoryScopeKey(scope);
    set((state) => {
      const current = state.scopes[key] ?? { receipts: [], ocr: [] };
      return {
        scopes: {
          ...state.scopes,
          [key]: {
            ...current,
            receipts: upsertRecent(current.receipts, entry),
          },
        },
      };
    });
  },
  recordOcrJob: (scope, entry) => {
    const key = captureHistoryScopeKey(scope);
    set((state) => {
      const current = state.scopes[key] ?? { receipts: [], ocr: [] };
      return {
        scopes: {
          ...state.scopes,
          [key]: {
            ...current,
            ocr: upsertRecent(current.ocr, entry),
          },
        },
      };
    });
  },
  getReceiptJobs: (scope) => get().scopes[captureHistoryScopeKey(scope)]?.receipts ?? [],
  getOcrJobs: (scope) => get().scopes[captureHistoryScopeKey(scope)]?.ocr ?? [],
  clearAll: () => set({ scopes: {} }),
});

export const captureHistoryStore = create<CaptureHistoryState>()(
  persist(captureHistoryStateCreator, {
    name: CAPTURE_HISTORY_STORAGE_KEY,
    storage: createJSONStorage(() => (typeof window === 'undefined' ? memoryStorage : window.localStorage)),
    partialize: (state) => ({ scopes: state.scopes }),
  }),
);
