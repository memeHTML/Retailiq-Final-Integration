import type { WhatsAppMessage } from '@/api/whatsapp';

export type WhatsAppMessageRow = {
  id: string;
  to: string;
  messageType: WhatsAppMessage['message_type'];
  content: string;
  status: WhatsAppMessage['status'];
  sentAt: string;
  createdAt: string;
  templateName?: string;
};

export type WhatsAppMessageSource = {
  id?: string | number | null;
  to?: string | null;
  recipient?: string | null;
  message_type?: WhatsAppMessage['message_type'] | string | null;
  content?: string | null;
  status?: WhatsAppMessage['status'] | string | null;
  template_name?: string | null;
  sent_at?: string | null;
  created_at?: string | null;
};

const toStringValue = (value: string | number | null | undefined, fallback = '') => {
  if (typeof value === 'number') {
    return String(value);
  }

  if (!value) {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed || fallback;
};

export function normalizeCustomerWhatsAppPhoneNumber(phoneNumber: string) {
  return phoneNumber.trim();
}

export function getWhatsAppConnectionLabel(isConnected: boolean) {
  return isConnected ? 'Connected' : 'Offline';
}

export function getWhatsAppMessageStatusVariant(status: WhatsAppMessage['status']) {
  switch (status) {
    case 'FAILED':
      return 'danger';
    case 'READ':
      return 'success';
    case 'DELIVERED':
      return 'info';
    case 'SENT':
      return 'warning';
    default:
      return 'secondary';
  }
}

export function normalizeWhatsAppMessageStatus(status?: string | null): WhatsAppMessage['status'] {
  switch (status?.toUpperCase()) {
    case 'FAILED':
      return 'FAILED';
    case 'READ':
      return 'READ';
    case 'DELIVERED':
      return 'DELIVERED';
    case 'SENT':
      return 'SENT';
    default:
      return 'PENDING';
  }
}

export function normalizeWhatsAppMessageType(messageType?: string | null): WhatsAppMessage['message_type'] {
  switch (messageType?.toUpperCase()) {
    case 'TEMPLATE':
      return 'TEMPLATE';
    case 'IMAGE':
      return 'IMAGE';
    case 'DOCUMENT':
      return 'DOCUMENT';
    default:
      return 'TEXT';
  }
}

export function normalizeWhatsAppMessageRow(message: WhatsAppMessageSource): WhatsAppMessageRow {
  const status = normalizeWhatsAppMessageStatus(message.status);
  return {
    id: toStringValue(message.id, ''),
    to: toStringValue(message.recipient ?? message.to, ''),
    messageType: normalizeWhatsAppMessageType(message.message_type),
    content: toStringValue(message.content, ''),
    status,
    sentAt: toStringValue(message.sent_at, toStringValue(message.created_at, '')),
    createdAt: toStringValue(message.created_at, toStringValue(message.sent_at, '')),
    templateName: toStringValue(message.template_name, '') || undefined,
  };
}
