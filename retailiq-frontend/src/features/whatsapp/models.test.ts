import { describe, expect, it } from 'vitest';
import {
  getWhatsAppConnectionLabel,
  getWhatsAppMessageStatusVariant,
  normalizeCustomerWhatsAppPhoneNumber,
  normalizeWhatsAppMessageRow,
} from './models';

describe('whatsapp models', () => {
  it('normalizes customer phone numbers safely', () => {
    expect(normalizeCustomerWhatsAppPhoneNumber('  9999999999  ')).toBe('9999999999');
    expect(normalizeCustomerWhatsAppPhoneNumber('   ')).toBe('');
  });

  it('maps whatsapp status variants consistently', () => {
    expect(getWhatsAppMessageStatusVariant('FAILED')).toBe('danger');
    expect(getWhatsAppMessageStatusVariant('READ')).toBe('success');
    expect(getWhatsAppMessageStatusVariant('DELIVERED')).toBe('info');
    expect(getWhatsAppMessageStatusVariant('SENT')).toBe('warning');
    expect(getWhatsAppMessageStatusVariant('PENDING')).toBe('secondary');
  });

  it('normalizes partial message rows safely', () => {
    expect(
      normalizeWhatsAppMessageRow({
        id: 12,
        recipient: ' 9999999999 ',
        message_type: 'TEMPLATE',
        status: 'DELIVERED',
        content: ' Hello ',
        sent_at: '2026-03-28T10:00:00.000Z',
      }),
    ).toEqual({
      id: '12',
      to: '9999999999',
      messageType: 'TEMPLATE',
      content: 'Hello',
      status: 'DELIVERED',
      sentAt: '2026-03-28T10:00:00.000Z',
      createdAt: '2026-03-28T10:00:00.000Z',
      templateName: undefined,
    });
  });

  it('maps connection labels predictably', () => {
    expect(getWhatsAppConnectionLabel(true)).toBe('Connected');
    expect(getWhatsAppConnectionLabel(false)).toBe('Offline');
  });
});
