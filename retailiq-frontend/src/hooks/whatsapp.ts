/**
 * src/hooks/whatsapp.ts
 * React Query hooks for WhatsApp operations
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as whatsappApi from '@/api/whatsapp';
import type { 
  WhatsAppConfig,
  WhatsAppTemplate,
  WhatsAppCampaign,
} from '@/api/whatsapp';

// Query keys
export const whatsappKeys = {
  all: ['whatsapp'] as const,
  config: () => [...whatsappKeys.all, 'config'] as const,
  templates: () => [...whatsappKeys.all, 'templates'] as const,
  messages: (params?: Record<string, unknown>) => [...whatsappKeys.all, 'messages', ...(params ? [params] : [])] as const,
  message: (id: string) => [...whatsappKeys.all, 'message', id] as const,
  campaigns: () => [...whatsappKeys.all, 'campaigns'] as const,
  campaign: (id: string) => [...whatsappKeys.all, 'campaign', id] as const,
  analytics: (params?: Record<string, unknown>) => [...whatsappKeys.all, 'analytics', ...(params ? [params] : [])] as const,
};

// Configuration
export const useWhatsAppConfigQuery = () => {
  return useQuery({
    queryKey: whatsappKeys.config(),
    queryFn: () => whatsappApi.whatsappApi.getConfig(),
    staleTime: 300000, // 5 minutes
  });
};

export const useUpdateWhatsAppConfigMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<WhatsAppConfig>) => whatsappApi.whatsappApi.updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: whatsappKeys.config() });
    },
  });
};

// Templates
export const useWhatsAppTemplatesQuery = () => {
  return useQuery({
    queryKey: whatsappKeys.templates(),
    queryFn: () => whatsappApi.whatsappApi.getTemplates(),
    staleTime: 300000, // 5 minutes
  });
};

export const useCreateWhatsAppTemplateMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      name: string;
      category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
      language: string;
      components: WhatsAppTemplate['components'];
    }) => whatsappApi.whatsappApi.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: whatsappKeys.templates() });
    },
  });
};

// Messages
export const useWhatsAppMessagesQuery = (params?: {
  to?: string;
  from?: string;
  message_type?: string;
  status?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}) => {
  const hasRecipientFilter = Boolean(params?.to || params?.from);

  return useQuery({
    queryKey: whatsappKeys.messages(params),
    queryFn: () => whatsappApi.whatsappApi.getMessages(params),
    enabled: hasRecipientFilter,
    staleTime: 30000, // 30 seconds
  });
};

export const useWhatsAppMessageQuery = (id: string) => {
  return useQuery({
    queryKey: whatsappKeys.message(id),
    queryFn: () => whatsappApi.whatsappApi.getMessage(id),
    enabled: Boolean(id),
    staleTime: 30000, // 30 seconds
  });
};

export const useSendWhatsAppMessageMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      to: string;
      message_type: 'TEXT' | 'TEMPLATE' | 'IMAGE' | 'DOCUMENT';
      content: string;
      template_name?: string;
      template_language?: string;
      template_variables?: Record<string, string>;
      media_url?: string;
      media_filename?: string;
    }) => whatsappApi.whatsappApi.sendMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: whatsappKeys.messages() });
      queryClient.invalidateQueries({ queryKey: whatsappKeys.analytics() });
    },
  });
};

export const useSendBulkWhatsAppMessagesMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (messages: Array<{
      to: string;
      message_type: 'TEXT' | 'TEMPLATE';
      content: string;
      template_name?: string;
      template_language?: string;
      template_variables?: Record<string, string>;
    }>) => whatsappApi.whatsappApi.sendBulkMessages(messages),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: whatsappKeys.messages() });
      queryClient.invalidateQueries({ queryKey: whatsappKeys.analytics() });
    },
  });
};

// Campaigns
export const useWhatsAppCampaignsQuery = () => {
  return useQuery({
    queryKey: whatsappKeys.campaigns(),
    queryFn: () => whatsappApi.whatsappApi.getCampaigns(),
    staleTime: 60000, // 1 minute
  });
};

export const useWhatsAppCampaignQuery = (id: string) => {
  return useQuery({
    queryKey: whatsappKeys.campaign(id),
    queryFn: () => whatsappApi.whatsappApi.getCampaign(id),
    enabled: Boolean(id),
    staleTime: 30000, // 30 seconds
  });
};

export const useCreateWhatsAppCampaignMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      name: string;
      description: string;
      template_id: string;
      recipients: string[];
      scheduled_at?: string;
    }) => whatsappApi.whatsappApi.createCampaign(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: whatsappKeys.campaigns() });
    },
  });
};

export const useUpdateWhatsAppCampaignMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WhatsAppCampaign> }) =>
      whatsappApi.whatsappApi.updateCampaign(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: whatsappKeys.campaigns() });
      queryClient.invalidateQueries({ queryKey: whatsappKeys.campaign(id) });
    },
  });
};

export const useDeleteWhatsAppCampaignMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => whatsappApi.whatsappApi.deleteCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: whatsappKeys.campaigns() });
    },
  });
};

export const useSendWhatsAppCampaignMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => whatsappApi.whatsappApi.sendCampaign(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: whatsappKeys.campaigns() });
      queryClient.invalidateQueries({ queryKey: whatsappKeys.campaign(id) });
    },
  });
};

// Analytics
export const useWhatsAppAnalyticsQuery = (params?: {
  from_date?: string;
  to_date?: string;
}) => {
  return useQuery({
    queryKey: whatsappKeys.analytics(params),
    queryFn: () => whatsappApi.whatsappApi.getAnalytics(params),
    staleTime: 300000, // 5 minutes
  });
};

// Customer Opt-in/Out
export const useOptInCustomerMutation = () => {
  return useMutation({
    mutationFn: (phone: string) => whatsappApi.whatsappApi.optInCustomer(phone),
  });
};

export const useOptOutCustomerMutation = () => {
  return useMutation({
    mutationFn: (phone: string) => whatsappApi.whatsappApi.optOutCustomer(phone),
  });
};

export const useOptStatusQuery = (phone: string) => {
  return useQuery({
    queryKey: [...whatsappKeys.all, 'opt-status', phone] as const,
    queryFn: () => whatsappApi.whatsappApi.getOptStatus(phone),
    enabled: Boolean(phone),
    staleTime: 60000, // 1 minute
  });
};

// Test Mode
export const useSendTestWhatsAppMessageMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      to: string;
      template_name: string;
      template_language: string;
      template_variables?: Record<string, string>;
    }) => whatsappApi.whatsappApi.sendTestMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: whatsappKeys.messages() });
    },
  });
};
