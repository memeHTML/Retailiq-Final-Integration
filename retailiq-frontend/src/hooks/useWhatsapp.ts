export * from '@/hooks/whatsapp';
import { useOptStatusQuery, useWhatsAppMessagesQuery } from '@/hooks/whatsapp';

export const useCustomerWhatsAppStatus = useOptStatusQuery;
export const useCustomerWhatsAppMessages = useWhatsAppMessagesQuery;
