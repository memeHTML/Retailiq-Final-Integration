/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest';
import { captureHistoryStore } from './captureHistoryStore';

const scopeA = { storeId: 10, userId: 1 };
const scopeB = { storeId: 20, userId: 1 };

describe('captureHistoryStore', () => {
  beforeEach(() => {
    captureHistoryStore.getState().clearAll();
    window.localStorage.clear();
  });

  it('keeps receipt and OCR history scoped per store and most recent first', () => {
    const store = captureHistoryStore.getState();

    store.recordReceiptJob(scopeA, {
      job_id: 101,
      transaction_id: 'TX-101',
      job_type: 'RECEIPT',
      status: 'PENDING',
      created_at: '2026-03-27T10:00:00Z',
      completed_at: null,
    });
    store.recordReceiptJob(scopeA, {
      job_id: 102,
      transaction_id: null,
      job_type: 'BARCODE',
      status: 'PROCESSING',
      created_at: '2026-03-27T10:05:00Z',
      completed_at: null,
    });
    store.recordReceiptJob(scopeA, {
      job_id: 101,
      transaction_id: 'TX-101',
      job_type: 'RECEIPT',
      status: 'COMPLETED',
      created_at: '2026-03-27T10:00:00Z',
      completed_at: '2026-03-27T10:01:00Z',
    });
    store.recordReceiptJob(scopeB, {
      job_id: 201,
      transaction_id: null,
      job_type: 'BARCODE',
      status: 'FAILED',
      created_at: '2026-03-27T11:00:00Z',
      completed_at: '2026-03-27T11:00:30Z',
    });
    store.recordOcrJob(scopeA, {
      job_id: 'ocr-1',
      status: 'REVIEW',
      error_message: null,
      item_count: 2,
      updated_at: '2026-03-27T10:10:00Z',
    });
    store.recordOcrJob(scopeB, {
      job_id: 'ocr-9',
      status: 'FAILED',
      error_message: 'Rejected',
      item_count: 0,
      updated_at: '2026-03-27T11:10:00Z',
    });

    expect(store.getReceiptJobs(scopeA).map((entry) => entry.job_id)).toEqual([101, 102]);
    expect(store.getReceiptJobs(scopeB).map((entry) => entry.job_id)).toEqual([201]);
    expect(store.getOcrJobs(scopeA).map((entry) => entry.job_id)).toEqual(['ocr-1']);
    expect(store.getOcrJobs(scopeB).map((entry) => entry.job_id)).toEqual(['ocr-9']);
  });

  it('clears all scoped history buckets', () => {
    const store = captureHistoryStore.getState();

    store.recordReceiptJob(scopeA, {
      job_id: 101,
      transaction_id: 'TX-101',
      job_type: 'RECEIPT',
      status: 'PENDING',
      created_at: '2026-03-27T10:00:00Z',
      completed_at: null,
    });
    store.recordOcrJob(scopeA, {
      job_id: 'ocr-1',
      status: 'REVIEW',
      error_message: null,
      item_count: 1,
      updated_at: '2026-03-27T10:10:00Z',
    });

    store.clearAll();

    expect(captureHistoryStore.getState().scopes).toEqual({});
    expect(captureHistoryStore.getState().getReceiptJobs(scopeA)).toEqual([]);
    expect(captureHistoryStore.getState().getOcrJobs(scopeA)).toEqual([]);
  });
});
