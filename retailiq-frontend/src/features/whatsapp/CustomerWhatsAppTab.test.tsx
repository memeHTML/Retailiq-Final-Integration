/* @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CustomerWhatsAppTab } from './CustomerWhatsAppTab';

const mockWhatsAppConfigQuery = vi.fn();
const mockOptStatusQuery = vi.fn();
const mockWhatsAppMessagesQuery = vi.fn();

vi.mock('@/hooks/whatsapp', () => ({
  useWhatsAppConfigQuery: () => mockWhatsAppConfigQuery(),
  useOptStatusQuery: (phoneNumber: string) => mockOptStatusQuery(phoneNumber),
  useWhatsAppMessagesQuery: (params?: { to?: string; page?: number; limit?: number }) => mockWhatsAppMessagesQuery(params),
}));

describe('CustomerWhatsAppTab', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows an empty state and skips message loading when the customer has no phone number', () => {
    mockWhatsAppConfigQuery.mockReturnValue({
      data: { is_connected: false, phone_number: null },
      isLoading: false,
      isError: false,
    });
    mockOptStatusQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });
    mockWhatsAppMessagesQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });

    render(<CustomerWhatsAppTab phoneNumber="   " />);

    expect(screen.getByText(/No phone number/i)).toBeTruthy();
    expect(mockWhatsAppMessagesQuery).not.toHaveBeenCalled();
    expect(mockOptStatusQuery).toHaveBeenCalledWith('');
  });
});
