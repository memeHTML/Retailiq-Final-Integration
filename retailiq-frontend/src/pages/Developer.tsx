import { useState } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/Dialog';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  useApiDocumentationQuery,
  useApiKeysQuery,
  useApiLogsQuery,
  useCreateApiKeyMutation,
  useCreateWebhookMutation,
  useDeleteApiKeyMutation,
  useDeleteWebhookMutation,
  useRateLimitsQuery,
  useRegenerateApiKeyMutation,
  useTestWebhookMutation,
  useUpdateApiKeyMutation,
  useUpdateWebhookMutation,
  useUsageStatsQuery,
  useWebhooksQuery,
} from '@/hooks/developer';
import { useDeveloperMarketplaceQuery, useRegisterDeveloperMutation } from '@/hooks/developerExtras';
import type { ApiKey, ApiUsageStats, Webhook } from '@/api/developer';
import type { DeveloperMarketplaceApp } from '@/api/developerExtras';
import { normalizeApiError } from '@/utils/errors';
import { uiStore } from '@/stores/uiStore';
import { formatDate } from '@/utils/dates';

type DeveloperTab = 'onboarding' | 'marketplace' | 'api-keys' | 'webhooks' | 'usage' | 'limits' | 'logs' | 'docs';

type SecretModalState = {
  title: string;
  secret: string;
};

const parseCsv = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export default function DeveloperPage() {
  const addToast = uiStore((state) => state.addToast);
  const [activeTab, setActiveTab] = useState<DeveloperTab>('onboarding');
  const [secretModal, setSecretModal] = useState<SecretModalState | null>(null);
  const [registrationForm, setRegistrationForm] = useState({
    name: '',
    email: '',
    organization: '',
  });
  const [apiKeyForm, setApiKeyForm] = useState({
    name: '',
    scopes: 'read:inventory,read:sales',
    expires_at: '',
  });
  const [editingApiKeyId, setEditingApiKeyId] = useState<string | null>(null);
  const [webhookForm, setWebhookForm] = useState({
    url: '',
    events: 'inventory.updated,orders.created',
    secret: '',
    name: '',
  });
  const [editingWebhookId, setEditingWebhookId] = useState<string | null>(null);
  const [usageFilters, setUsageFilters] = useState({
    from_date: '',
    to_date: '',
  });
  const [logFilters, setLogFilters] = useState({
    level: '' as '' | 'error' | 'warn' | 'info',
    limit: '50',
  });

  const apiKeysQuery = useApiKeysQuery();
  const docsQuery = useApiDocumentationQuery();
  const marketplaceQuery = useDeveloperMarketplaceQuery();
  const webhooksQuery = useWebhooksQuery();
  const usageQuery = useUsageStatsQuery(
    usageFilters.from_date || usageFilters.to_date
      ? {
          from_date: usageFilters.from_date || undefined,
          to_date: usageFilters.to_date || undefined,
        }
      : undefined,
  );
  const rateLimitsQuery = useRateLimitsQuery();
  const apiLogsQuery = useApiLogsQuery({
    level: logFilters.level || undefined,
    limit: Number(logFilters.limit) || 50,
  });

  const registerMutation = useRegisterDeveloperMutation();
  const createApiKeyMutation = useCreateApiKeyMutation();
  const updateApiKeyMutation = useUpdateApiKeyMutation();
  const deleteApiKeyMutation = useDeleteApiKeyMutation();
  const regenerateApiKeyMutation = useRegenerateApiKeyMutation();
  const createWebhookMutation = useCreateWebhookMutation();
  const updateWebhookMutation = useUpdateWebhookMutation();
  const deleteWebhookMutation = useDeleteWebhookMutation();
  const testWebhookMutation = useTestWebhookMutation();

  const openSecretModal = (title: string, secret: string) => {
    const trimmedSecret = secret.trim();
    if (!trimmedSecret) {
      throw new Error('Developer API key response did not include a client_secret.');
    }

    setSecretModal({
      title,
      secret: trimmedSecret,
    });
  };

  const closeSecretModal = () => {
    setSecretModal(null);
  };

  const copySecret = async () => {
    if (!secretModal) {
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(secretModal.secret);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = secretModal.secret;
        textarea.setAttribute('readonly', 'true');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      addToast({ title: 'Secret copied', message: 'The client secret was copied to your clipboard.', variant: 'success' });
    } catch {
      addToast({ title: 'Copy failed', message: 'Unable to copy the client secret.', variant: 'error' });
    }
  };

  const blockingError =
    apiKeysQuery.error ??
    docsQuery.error ??
    marketplaceQuery.error ??
    webhooksQuery.error ??
    usageQuery.error ??
    rateLimitsQuery.error ??
    apiLogsQuery.error;

  if (blockingError) {
    return (
      <PageFrame title="Developer API" subtitle="Build integrations against the RetailIQ platform.">
        <ErrorState error={normalizeApiError(blockingError)} />
      </PageFrame>
    );
  }

  const apiKeyColumns: Column<ApiKey>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (apiKey) => (
        <div>
          <div className="font-medium">{apiKey.name}</div>
          <div className="text-sm text-gray-500">{apiKey.key_preview || apiKey.key.slice(0, 8)}...</div>
        </div>
      ),
    },
    {
      key: 'scopes',
      header: 'Scopes',
      render: (apiKey) => (
        <div className="flex flex-wrap gap-1">
          {apiKey.scopes.length ? apiKey.scopes.map((scope) => <Badge key={scope} variant="secondary">{scope}</Badge>) : <span className="text-sm text-gray-500">Default scopes</span>}
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (apiKey) => formatDate(apiKey.created_at),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (apiKey) => <Badge variant={apiKey.is_active ? 'success' : 'secondary'}>{apiKey.is_active ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (apiKey) => (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setEditingApiKeyId(apiKey.id);
              setApiKeyForm({
                name: apiKey.name,
                scopes: apiKey.scopes.join(', '),
                expires_at: apiKey.expires_at ?? '',
              });
              setActiveTab('api-keys');
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            onClick={() => {
              void regenerateApiKeyMutation.mutateAsync(apiKey.id).then((response) => {
                openSecretModal('API key regenerated', response.key);
                addToast({ title: 'API key regenerated', message: 'A new client secret was issued.', variant: 'success' });
              }).catch((error) => {
                addToast({ title: 'Regeneration failed', message: normalizeApiError(error).message, variant: 'error' });
              });
            }}
            loading={regenerateApiKeyMutation.isPending}
          >
            Regenerate
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              void deleteApiKeyMutation.mutateAsync(apiKey.id).then(() => {
                addToast({ title: 'API key deleted', message: apiKey.name, variant: 'success' });
              }).catch((error) => {
                addToast({ title: 'Delete failed', message: normalizeApiError(error).message, variant: 'error' });
              });
            }}
            loading={deleteApiKeyMutation.isPending}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const marketplaceColumns: Column<DeveloperMarketplaceApp>[] = [
    {
      key: 'name',
      header: 'App',
      render: (app) => (
        <div>
          <div className="font-medium">{app.name}</div>
          <div className="text-sm text-gray-500">{app.tagline || 'No tagline provided'}</div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (app) => <Badge variant="secondary">{app.category}</Badge>,
    },
    {
      key: 'price',
      header: 'Price',
      render: (app) => app.price,
    },
    {
      key: 'install_count',
      header: 'Installs',
      render: (app) => app.install_count.toLocaleString(),
    },
    {
      key: 'avg_rating',
      header: 'Rating',
      render: (app) => app.avg_rating,
    },
  ];

  const webhookColumns: Column<Webhook>[] = [
    {
      key: 'name',
      header: 'Webhook',
      render: (webhook) => (
        <div>
          <div className="font-medium">{webhook.url}</div>
          <div className="text-sm text-gray-500">{webhook.events.join(', ') || 'No events configured'}</div>
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (webhook) => formatDate(webhook.created_at),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (webhook) => <Badge variant={webhook.is_active ? 'success' : 'secondary'}>{webhook.is_active ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (webhook) => (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setEditingWebhookId(webhook.id);
              setWebhookForm({
                url: webhook.url,
                events: webhook.events.join(', '),
                secret: webhook.secret,
                name: webhook.created_by,
              });
              setActiveTab('webhooks');
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            onClick={() => {
              void testWebhookMutation.mutateAsync(webhook.id).then((response) => {
                addToast({ title: 'Webhook test queued', message: response.message, variant: 'success' });
              }).catch((error) => {
                addToast({ title: 'Webhook test failed', message: normalizeApiError(error).message, variant: 'error' });
              });
            }}
            loading={testWebhookMutation.isPending}
          >
            Test
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              void deleteWebhookMutation.mutateAsync(webhook.id).then(() => {
                addToast({ title: 'Webhook deleted', message: webhook.url, variant: 'success' });
              }).catch((error) => {
                addToast({ title: 'Delete failed', message: normalizeApiError(error).message, variant: 'error' });
              });
            }}
            loading={deleteWebhookMutation.isPending}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const loading = apiKeysQuery.isLoading || docsQuery.isLoading || marketplaceQuery.isLoading || webhooksQuery.isLoading || usageQuery.isLoading || rateLimitsQuery.isLoading || apiLogsQuery.isLoading;

  const handleRegisterDeveloper = async () => {
    try {
      const response = await registerMutation.mutateAsync({
        name: registrationForm.name,
        email: registrationForm.email,
        organization: registrationForm.organization || undefined,
      });
      addToast({ title: 'Developer registered', message: response.message, variant: 'success' });
      setRegistrationForm({ name: '', email: '', organization: '' });
    } catch (error) {
      addToast({ title: 'Registration failed', message: normalizeApiError(error).message, variant: 'error' });
    }
  };

  const handleSaveApiKey = async () => {
    try {
      const payload = {
        name: apiKeyForm.name,
        scopes: parseCsv(apiKeyForm.scopes),
        expires_at: apiKeyForm.expires_at || undefined,
      };

      const response = editingApiKeyId
        ? await updateApiKeyMutation.mutateAsync({ keyId: editingApiKeyId, data: payload })
        : await createApiKeyMutation.mutateAsync(payload);

      if (!editingApiKeyId) {
        openSecretModal('API key created', response.key);
      }

      addToast({
        title: editingApiKeyId ? 'API key updated' : 'API key created',
        message: editingApiKeyId ? response.name : 'A new client secret is ready.',
        variant: 'success',
      });
      setApiKeyForm({ name: '', scopes: 'read:inventory,read:sales', expires_at: '' });
      setEditingApiKeyId(null);
    } catch (error) {
      addToast({ title: editingApiKeyId ? 'Update failed' : 'Create failed', message: normalizeApiError(error).message, variant: 'error' });
    }
  };

  const handleSaveWebhook = async () => {
    try {
      const payload = {
        url: webhookForm.url,
        events: parseCsv(webhookForm.events),
        secret: webhookForm.secret || undefined,
        name: webhookForm.name || undefined,
      };

      const response = editingWebhookId
        ? await updateWebhookMutation.mutateAsync({ webhookId: editingWebhookId, data: payload })
        : await createWebhookMutation.mutateAsync(payload);

      addToast({
        title: editingWebhookId ? 'Webhook updated' : 'Webhook created',
        message: response.url,
        variant: 'success',
      });
      setWebhookForm({ url: '', events: 'inventory.updated,orders.created', secret: '', name: '' });
      setEditingWebhookId(null);
    } catch (error) {
      addToast({ title: editingWebhookId ? 'Webhook update failed' : 'Webhook creation failed', message: normalizeApiError(error).message, variant: 'error' });
    }
  };

  return (
    <PageFrame title="Developer API" subtitle="Build integrations against the RetailIQ platform.">
      <div className="flex flex-wrap gap-2">
        {(['onboarding', 'marketplace', 'api-keys', 'webhooks', 'usage', 'limits', 'logs', 'docs'] as DeveloperTab[]).map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab(tab)}
          >
            {tab.replace('-', ' ')}
          </Button>
        ))}
      </div>

      {loading ? (
        <SkeletonLoader />
      ) : (
        <>
          {activeTab === 'onboarding' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Developer Onboarding</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input label="Name" value={registrationForm.name} onChange={(event) => setRegistrationForm((current) => ({ ...current, name: event.target.value }))} />
                  <Input label="Email" type="email" value={registrationForm.email} onChange={(event) => setRegistrationForm((current) => ({ ...current, email: event.target.value }))} />
                  <Input label="Organization" value={registrationForm.organization} onChange={(event) => setRegistrationForm((current) => ({ ...current, organization: event.target.value }))} />
                  <div className="flex gap-2">
                    <Button onClick={() => void handleRegisterDeveloper()} loading={registerMutation.isPending} disabled={!registrationForm.name || !registrationForm.email}>
                      Register developer
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Quick Start</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-600">
                  <p>1. Register your developer profile.</p>
                  <p>2. Create API keys for server-to-server integrations.</p>
                  <p>3. Configure webhooks to receive event notifications.</p>
                  <p>4. Review usage, rate limits, logs, and API documentation from this page.</p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'marketplace' && (
            <Card>
              <CardHeader>
                <CardTitle>Marketplace</CardTitle>
              </CardHeader>
              <CardContent>
                {marketplaceQuery.data && marketplaceQuery.data.length > 0 ? (
                  <DataTable columns={marketplaceColumns} data={marketplaceQuery.data} />
                ) : (
                  <EmptyState title="No marketplace apps" body="Approved marketplace applications will appear here." />
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'api-keys' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{editingApiKeyId ? 'Edit API Key' : 'Create API Key'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input label="Name" value={apiKeyForm.name} onChange={(event) => setApiKeyForm((current) => ({ ...current, name: event.target.value }))} />
                  <Input label="Scopes (comma separated)" value={apiKeyForm.scopes} onChange={(event) => setApiKeyForm((current) => ({ ...current, scopes: event.target.value }))} />
                  <Input label="Expires at" type="datetime-local" value={apiKeyForm.expires_at} onChange={(event) => setApiKeyForm((current) => ({ ...current, expires_at: event.target.value }))} />
                  <div className="flex gap-2">
                    <Button onClick={() => void handleSaveApiKey()} loading={createApiKeyMutation.isPending || updateApiKeyMutation.isPending} disabled={!apiKeyForm.name || !apiKeyForm.scopes}>
                      {editingApiKeyId ? 'Save API key' : 'Create API key'}
                    </Button>
                    {editingApiKeyId && (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setEditingApiKeyId(null);
                          setApiKeyForm({ name: '', scopes: 'read:inventory,read:sales', expires_at: '' });
                        }}
                      >
                        Cancel edit
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>API Keys</CardTitle>
                </CardHeader>
                <CardContent>
                  {apiKeysQuery.data && apiKeysQuery.data.length > 0 ? (
                    <DataTable columns={apiKeyColumns} data={apiKeysQuery.data} />
                  ) : (
                    <EmptyState title="No API keys" body="Create an API key to start calling the backend." />
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'webhooks' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{editingWebhookId ? 'Edit Webhook' : 'Create Webhook'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input label="Webhook URL" type="url" value={webhookForm.url} onChange={(event) => setWebhookForm((current) => ({ ...current, url: event.target.value }))} />
                  <Input label="Events (comma separated)" value={webhookForm.events} onChange={(event) => setWebhookForm((current) => ({ ...current, events: event.target.value }))} />
                  <Input label="Secret" value={webhookForm.secret} onChange={(event) => setWebhookForm((current) => ({ ...current, secret: event.target.value }))} />
                  <Input label="Name" value={webhookForm.name} onChange={(event) => setWebhookForm((current) => ({ ...current, name: event.target.value }))} />
                  <div className="flex gap-2">
                    <Button onClick={() => void handleSaveWebhook()} loading={createWebhookMutation.isPending || updateWebhookMutation.isPending} disabled={!webhookForm.url || !webhookForm.events}>
                      {editingWebhookId ? 'Save webhook' : 'Create webhook'}
                    </Button>
                    {editingWebhookId && (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setEditingWebhookId(null);
                          setWebhookForm({ url: '', events: 'inventory.updated,orders.created', secret: '', name: '' });
                        }}
                      >
                        Cancel edit
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Webhooks</CardTitle>
                </CardHeader>
                <CardContent>
                  {webhooksQuery.data && webhooksQuery.data.length > 0 ? (
                    <DataTable columns={webhookColumns} data={webhooksQuery.data} />
                  ) : (
                    <EmptyState title="No webhooks configured" body="Create a webhook subscription to receive backend events." />
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'usage' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Usage Filters</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <Input label="From date" type="date" value={usageFilters.from_date} onChange={(event) => setUsageFilters((current) => ({ ...current, from_date: event.target.value }))} />
                  <Input label="To date" type="date" value={usageFilters.to_date} onChange={(event) => setUsageFilters((current) => ({ ...current, to_date: event.target.value }))} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Usage Summary</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-4">
                  <Metric label="Requests" value={usageQuery.data?.total_requests ?? 0} />
                  <Metric label="Errors" value={usageQuery.data?.total_errors ?? 0} />
                  <Metric label="Avg response" value={`${(usageQuery.data?.avg_response_time ?? 0).toFixed(2)} ms`} />
                  <Metric label="Days" value={(usageQuery.data?.daily_usage ?? []).length} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Daily Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable
                    columns={[
                      { key: 'date', header: 'Date', render: (row: ApiUsageStats['daily_usage'][number]) => row.date },
                      { key: 'requests', header: 'Requests', render: (row: ApiUsageStats['daily_usage'][number]) => row.requests.toLocaleString() },
                      { key: 'errors', header: 'Errors', render: (row: ApiUsageStats['daily_usage'][number]) => row.errors.toLocaleString() },
                      { key: 'avg_response_time', header: 'Avg response', render: (row: ApiUsageStats['daily_usage'][number]) => `${row.avg_response_time.toFixed(2)} ms` },
                    ]}
                    data={usageQuery.data?.daily_usage ?? []}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'limits' && (
            <Card>
              <CardHeader>
                <CardTitle>Rate Limits</CardTitle>
              </CardHeader>
              <CardContent>
                {rateLimitsQuery.data && rateLimitsQuery.data.length > 0 ? (
                  <DataTable
                    columns={[
                      { key: 'endpoint', header: 'Endpoint', render: (row) => row.endpoint },
                      { key: 'client_id', header: 'Client ID', render: (row) => <code className="text-sm">{row.client_id}</code> },
                      { key: 'limit', header: 'Limit', render: (row) => row.limit.toLocaleString() },
                      { key: 'remaining', header: 'Remaining', render: (row) => row.remaining.toLocaleString() },
                      { key: 'reset_at', header: 'Resets', render: (row) => formatDate(row.reset_at) },
                    ]}
                    data={rateLimitsQuery.data}
                  />
                ) : (
                  <EmptyState title="No rate limit data" body="Rate limit entries will appear when developer apps are active." />
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Log Filters</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <Input label="Level" value={logFilters.level} onChange={(event) => setLogFilters((current) => ({ ...current, level: event.target.value as '' | 'error' | 'warn' | 'info' }))} />
                  <Input label="Limit" type="number" value={logFilters.limit} onChange={(event) => setLogFilters((current) => ({ ...current, limit: event.target.value }))} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>API Logs</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable
                    columns={[
                      { key: 'timestamp', header: 'Timestamp', render: (row) => formatDate(row.timestamp) },
                      { key: 'level', header: 'Level', render: (row) => <Badge variant={row.level === 'error' ? 'danger' : row.level === 'warn' ? 'warning' : 'secondary'}>{row.level}</Badge> },
                      { key: 'message', header: 'Message', render: (row) => row.message },
                      { key: 'request_id', header: 'Request ID', render: (row) => <code className="text-sm">{row.request_id}</code> },
                    ]}
                    data={apiLogsQuery.data?.logs ?? []}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'docs' && (
            <Card>
              <CardHeader>
                <CardTitle>API Documentation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Base URL: <code className="text-xs">{docsQuery.data?.base_url ?? ''}</code></p>
                  <p>Authentication: {docsQuery.data?.authentication.type}</p>
                  <p>{docsQuery.data?.authentication.description}</p>
                </div>
                <DataTable
                  columns={[
                    { key: 'method', header: 'Method', render: (row) => row.method },
                    { key: 'path', header: 'Path', render: (row) => <code className="text-sm">{row.path}</code> },
                    { key: 'description', header: 'Description', render: (row) => row.description },
                    { key: 'status', header: 'Status', render: (row) => row.response.status },
                  ]}
                  data={docsQuery.data?.endpoints ?? []}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Dialog open={Boolean(secretModal)} onOpenChange={(open) => { if (!open) closeSecretModal(); }}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>{secretModal?.title ?? 'API key secret'}</DialogTitle>
          <DialogDescription>
            Save this secret now. It will not be shown again.
          </DialogDescription>
          {secretModal ? (
            <div className="mt-4 space-y-4">
              <Input label="Client secret" value={secretModal.secret} readOnly className="font-mono text-sm" />
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void copySecret()}>Copy secret</Button>
                <Button variant="secondary" onClick={closeSecretModal}>
                  Close
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </PageFrame>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}
