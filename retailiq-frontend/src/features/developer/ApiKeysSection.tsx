import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import type { ApiKey } from '@/api/developer';
import { formatDate } from '@/utils/dates';

export interface DeveloperApiKeyForm {
  name: string;
  scopes: string;
  expires_at: string;
}

export interface ApiKeysSectionProps {
  apiKeys: ApiKey[] | undefined;
  form: DeveloperApiKeyForm;
  editingApiKeyId: string | null;
  onFormChange: (next: Partial<DeveloperApiKeyForm>) => void;
  onStartEdit: (apiKey: ApiKey) => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onRegenerate: (apiKey: ApiKey) => void;
  onDelete: (apiKey: ApiKey) => void;
  isSaving: boolean;
  isRegenerating: boolean;
  isDeleting: boolean;
}

export function ApiKeysSection({
  apiKeys,
  form,
  editingApiKeyId,
  onFormChange,
  onStartEdit,
  onSave,
  onCancelEdit,
  onRegenerate,
  onDelete,
  isSaving,
  isRegenerating,
  isDeleting,
}: ApiKeysSectionProps) {
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
            onClick={() => onStartEdit(apiKey)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            onClick={() => onRegenerate(apiKey)}
            loading={isRegenerating}
          >
            Regenerate
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(apiKey)}
            loading={isDeleting}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{editingApiKeyId ? 'Edit API Key' : 'Create API Key'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input label="Name" value={form.name} onChange={(event) => onFormChange({ name: event.target.value })} />
          <Input label="Scopes (comma separated)" value={form.scopes} onChange={(event) => onFormChange({ scopes: event.target.value })} />
          <Input label="Expires at" type="datetime-local" value={form.expires_at} onChange={(event) => onFormChange({ expires_at: event.target.value })} />
          <div className="flex gap-2">
            <Button onClick={onSave} loading={isSaving} disabled={!form.name || !form.scopes}>
              {editingApiKeyId ? 'Save API key' : 'Create API key'}
            </Button>
            {editingApiKeyId && (
              <Button variant="secondary" onClick={onCancelEdit}>
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
          {apiKeys && apiKeys.length > 0 ? (
            <DataTable columns={apiKeyColumns} data={apiKeys} />
          ) : (
            <EmptyState title="No API keys" body="Create an API key to start calling the backend." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
