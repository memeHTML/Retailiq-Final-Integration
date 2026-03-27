/* @vitest-environment jsdom */
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { isPollingStopState, useConfirmOcrMutation, useDismissOcrMutation } from './vision';

const visionApiMock = vi.hoisted(() => ({
  confirmOcrJob: vi.fn(),
  dismissOcrJob: vi.fn(),
}));

vi.mock('@/api/vision', () => ({
  confirmOcrJob: visionApiMock.confirmOcrJob,
  dismissOcrJob: visionApiMock.dismissOcrJob,
}));

describe('vision hooks', () => {
  it('marks the terminal OCR statuses as polling stop states', () => {
    expect(isPollingStopState('REVIEW')).toBe(true);
    expect(isPollingStopState('FAILED')).toBe(true);
    expect(isPollingStopState('APPLIED')).toBe(true);
    expect(isPollingStopState('COMPLETED')).toBe(true);
    expect(isPollingStopState('PROCESSING')).toBe(false);
    expect(isPollingStopState(null)).toBe(false);
  });

  it('invalidates the OCR query after a successful confirm mutation', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    visionApiMock.confirmOcrJob.mockResolvedValue({ message: 'confirmed' });

    const { result } = renderHook(() => useConfirmOcrMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ jobId: 'job-7', payload: { confirmed_items: [] } });
    });

    expect(visionApiMock.confirmOcrJob).toHaveBeenCalledWith('job-7', { confirmed_items: [] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['vision', 'ocr', 'job-7'] });
  });

  it('invalidates the OCR query after a successful dismiss mutation', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    visionApiMock.dismissOcrJob.mockResolvedValue({ message: 'dismissed' });

    const { result } = renderHook(() => useDismissOcrMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('job-8');
    });

    expect(visionApiMock.dismissOcrJob).toHaveBeenCalledWith('job-8');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['vision', 'ocr', 'job-8'] });
  });
});
