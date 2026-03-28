/* @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import OmnichannelPage from './OmnichannelPage';

vi.mock('@/hooks/marketplace', () => ({
  useMarketplaceOrdersQuery: () => ({ data: { orders: [{ id: 1, order_number: 'MKT-1', supplier_profile_id: 1, status: 'NEW', total: 900, payment_status: 'PENDING', financed: false, created_at: '2025-03-20T10:00:00.000Z', expected_delivery: null }], total: 1, page: 1, pages: 1 }, isLoading: false }),
  useMarketplaceRecommendationsQuery: () => ({ data: [{ id: 1, product_name: 'Rice', category: 'Grocery', urgency: 'HIGH', suggested_qty: 10, suggested_supplier_id: 2 }], isLoading: false }),
}));

vi.mock('@/hooks/whatsapp', () => ({
  useWhatsAppConfigQuery: () => ({ data: { is_connected: true, phone_number: '+911234567890' }, isLoading: false }),
  useWhatsAppAnalyticsQuery: () => ({ data: { delivery_rate: 72.5, read_rate: 41.2 }, isLoading: false }),
  useWhatsAppCampaignsQuery: () => ({ data: [{ id: 'camp-1', name: 'Festival Push', description: 'Push', template_id: 'tpl-1', template_name: 'Festival', recipient_count: 120, sent_count: 100, delivered_count: 90, read_count: 75, status: 'COMPLETED' }], isLoading: false }),
  useOptStatusQuery: () => ({ data: { status: 'OPTED_IN' }, isLoading: false }),
}));

describe('OmnichannelPage', () => {
  it('renders marketplace and whatsapp hub data', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <OmnichannelPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Omnichannel' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Marketplace' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'WhatsApp' })).toBeTruthy();
    expect(screen.getByText('MKT-1')).toBeTruthy();
    expect(screen.getByText('Rice')).toBeTruthy();
    expect(screen.getByText('+911234567890')).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: 'WhatsApp' }));
    expect(screen.getByText('Festival Push')).toBeTruthy();
  });
});
