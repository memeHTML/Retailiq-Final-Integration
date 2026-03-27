/* @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import DeveloperPage from './Developer';

const clipboardWriteText = vi.fn().mockResolvedValue(undefined);
const clipboard = {
  writeText: clipboardWriteText,
};
const execCommandMock = vi.fn().mockReturnValue(true);
const addToastMock = vi.fn();

const apiKeys = [
  {
    id: 'api-1',
    name: 'Portal',
    key: 'secret-portal',
    key_preview: 'secret-p',
    scopes: ['read:inventory'],
    is_active: true,
    expires_at: undefined,
    last_used_at: undefined,
    created_at: '2026-03-27T00:00:00.000Z',
    created_by: 'Ada',
  },
];

const webhooks = [
  {
    id: 'wh-1',
    url: 'https://example.com/webhook',
    events: ['inventory.updated'],
    secret: 'wh-secret',
    is_active: true,
    last_triggered_at: undefined,
    created_at: '2026-03-27T00:00:00.000Z',
    created_by: 'Ada',
  },
];

const hooks = vi.hoisted(() => {
  const createApiKeyMutation = {
    mutateAsync: vi.fn().mockResolvedValue({ name: 'Portal', key: 'client-secret-create' }),
    isPending: false,
  };
  const updateApiKeyMutation = {
    mutateAsync: vi.fn().mockResolvedValue({ name: 'Portal', key: 'ignored-secret' }),
    isPending: false,
  };
  const deleteApiKeyMutation = {
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  };
  const regenerateApiKeyMutation = {
    mutateAsync: vi.fn().mockResolvedValue({ key: 'client-secret-rotate' }),
    isPending: false,
  };
  const createWebhookMutation = {
    mutateAsync: vi.fn().mockResolvedValue({ url: 'https://example.com/webhook' }),
    isPending: false,
  };
  const updateWebhookMutation = {
    mutateAsync: vi.fn().mockResolvedValue({ url: 'https://example.com/webhook' }),
    isPending: false,
  };
  const deleteWebhookMutation = {
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  };
  const testWebhookMutation = {
    mutateAsync: vi.fn().mockResolvedValue({ message: 'queued' }),
    isPending: false,
  };

  return {
    createApiKeyMutation,
    updateApiKeyMutation,
    deleteApiKeyMutation,
    regenerateApiKeyMutation,
    createWebhookMutation,
    updateWebhookMutation,
    deleteWebhookMutation,
    testWebhookMutation,
  };
});

vi.mock('@/stores/uiStore', () => ({
  uiStore: (selector: any) =>
    selector({
      addToast: addToastMock,
    }),
}));

vi.mock('@/hooks/developer', () => ({
  useApiKeysQuery: () => ({ data: apiKeys, isLoading: false, error: undefined }),
  useApiDocumentationQuery: () => ({
    data: {
      version: 'backend-source',
      base_url: 'http://localhost:5000',
      authentication: { type: 'api_key', description: 'API key auth' },
      endpoints: [],
    },
    isLoading: false,
    error: undefined,
  }),
  useWebhooksQuery: () => ({ data: webhooks, isLoading: false, error: undefined }),
  useUsageStatsQuery: () => ({
    data: {
      total_requests: 10,
      total_errors: 1,
      avg_response_time: 12.4,
      top_endpoints: [],
      daily_usage: [],
    },
    isLoading: false,
    error: undefined,
  }),
  useRateLimitsQuery: () => ({
    data: [{ endpoint: '/api/v1/developer/apps', client_id: 'client-1', limit: 100, remaining: 90, reset_at: '2026-03-27T00:00:00.000Z' }],
    isLoading: false,
    error: undefined,
  }),
  useApiLogsQuery: () => ({
    data: {
      logs: [{ timestamp: '2026-03-27T00:00:00.000Z', level: 'info', message: 'ok', request_id: 'req-1', ip_address: '127.0.0.1' }],
      total: 1,
    },
    isLoading: false,
    error: undefined,
  }),
  useCreateApiKeyMutation: () => hooks.createApiKeyMutation,
  useUpdateApiKeyMutation: () => hooks.updateApiKeyMutation,
  useDeleteApiKeyMutation: () => hooks.deleteApiKeyMutation,
  useRegenerateApiKeyMutation: () => hooks.regenerateApiKeyMutation,
  useCreateWebhookMutation: () => hooks.createWebhookMutation,
  useUpdateWebhookMutation: () => hooks.updateWebhookMutation,
  useDeleteWebhookMutation: () => hooks.deleteWebhookMutation,
  useTestWebhookMutation: () => hooks.testWebhookMutation,
}));

vi.mock('@/hooks/developerExtras', () => ({
  useDeveloperMarketplaceQuery: () => ({
    data: [{ id: 'app-1', name: 'Orders Sync', tagline: 'Sync orders', category: 'Operations', price: '$0', install_count: 120, avg_rating: '4.8' }],
    isLoading: false,
    error: undefined,
  }),
  useRegisterDeveloperMutation: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ message: 'Registered' }),
    isPending: false,
  }),
}));

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  addToastMock.mockClear();
  clipboardWriteText.mockClear();
  execCommandMock.mockClear();
  Object.defineProperty(window.navigator, 'clipboard', {
    configurable: true,
    value: clipboard,
  });
  Object.defineProperty(document, 'execCommand', {
    configurable: true,
    value: execCommandMock,
  });
});

describe('DeveloperPage', () => {
  it('opens a one-time secret modal when creating an API key and supports copy', async () => {
    const user = userEvent.setup();

    render(<DeveloperPage />);

    await user.click(screen.getByRole('button', { name: /api keys/i }));
    await user.type(screen.getByLabelText('Name'), 'New API key');
    await user.clear(screen.getByLabelText(/scopes/i));
    await user.type(screen.getByLabelText(/scopes/i), 'read:inventory');
    await user.click(screen.getByRole('button', { name: /create api key/i }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeTruthy();
    expect(screen.getByText(/save this secret now/i)).toBeTruthy();
    expect(screen.getByDisplayValue('client-secret-create')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /copy secret/i }));
    await waitFor(() => {
      expect(addToastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Secret copied',
          variant: 'success',
        }),
      );
    });
  });

  it('opens the secret modal again when regenerating an API key', async () => {
    const user = userEvent.setup();

    render(<DeveloperPage />);

    await user.click(screen.getByRole('button', { name: /api keys/i }));
    await user.click(screen.getByRole('button', { name: /regenerate/i }));

    expect(await screen.findByDisplayValue('client-secret-rotate')).toBeTruthy();
    expect(screen.getByText(/api key regenerated/i)).toBeTruthy();
  });

  it('does not open the secret modal for updates or deletes', async () => {
    const user = userEvent.setup();

    render(<DeveloperPage />);

    await user.click(screen.getByRole('button', { name: /api keys/i }));
    await user.click(screen.getByRole('button', { name: /edit/i }));
    await user.click(screen.getByRole('button', { name: /save api key/i }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    await user.click(screen.getByRole('button', { name: /delete/i }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });
});
