/* @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWhatsAppMessagesQuery } from './whatsapp';

const whatsappApiMock = vi.hoisted(() => ({
  getMessages: vi.fn(),
}));

vi.mock('@/api/whatsapp', () => ({
  whatsappApi: {
    getMessages: whatsappApiMock.getMessages,
  },
}));

describe('whatsapp hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not fetch messages until a recipient filter is present', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

    renderHook(() => useWhatsAppMessagesQuery(undefined), { wrapper });

    await waitFor(() => {
      expect(whatsappApiMock.getMessages).not.toHaveBeenCalled();
    });
  });

  it('fetches messages when a recipient is provided', async () => {
    whatsappApiMock.getMessages.mockResolvedValue({ messages: [], total: 0, page: 1, pages: 1 });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

    const { result } = renderHook(() => useWhatsAppMessagesQuery({ to: '9999999999', page: 1, limit: 5 }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(whatsappApiMock.getMessages).toHaveBeenCalledWith({ to: '9999999999', page: 1, limit: 5 });
  });
});
