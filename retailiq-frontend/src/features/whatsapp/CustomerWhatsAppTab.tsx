import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useOptStatusQuery, useWhatsAppMessagesQuery, useWhatsAppConfigQuery } from '@/hooks/whatsapp';
import { formatDate } from '@/utils/dates';

interface CustomerWhatsAppTabProps {
  phoneNumber: string;
}

export function CustomerWhatsAppTab({ phoneNumber }: CustomerWhatsAppTabProps) {
  const configQuery = useWhatsAppConfigQuery();
  const optStatusQuery = useOptStatusQuery(phoneNumber);
  const messagesQuery = useWhatsAppMessagesQuery(phoneNumber ? { to: phoneNumber, page: 1, limit: 5 } : undefined);

  if (configQuery.isLoading || messagesQuery.isLoading) {
    return <SkeletonLoader variant="rect" height={220} />;
  }

  if (configQuery.isError || messagesQuery.isError) {
    return <EmptyState title="WhatsApp unavailable" body="The WhatsApp configuration could not be loaded for this store." />;
  }

  const messages = messagesQuery.data?.messages ?? [];

  const columns: Column<(typeof messages)[number]>[] = [
    { key: 'date', header: 'Date', render: (row) => formatDate(row.created_at) },
    { key: 'type', header: 'Type', render: (row) => <Badge variant="secondary">{row.message_type}</Badge> },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={row.status === 'FAILED' ? 'danger' : row.status === 'READ' ? 'success' : row.status === 'DELIVERED' ? 'info' : 'warning'}>{row.status}</Badge> },
    { key: 'content', header: 'Content', render: (row) => row.content },
  ];

  if (!phoneNumber) {
    return <EmptyState title="No phone number" body="This customer does not have a phone number to use for WhatsApp actions." />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-gray-500">Connection</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{configQuery.data?.is_connected ? 'Connected' : 'Offline'}</div>
            <div className="text-sm text-gray-500">{configQuery.data?.phone_number ?? 'No phone configured'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-gray-500">Opt Status</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{optStatusQuery.data?.status ?? 'UNKNOWN'}</div>
            <div className="text-sm text-gray-500">{phoneNumber}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-gray-500">Recent Messages</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{messages.length.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Fetched from the message log endpoint</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Message History</CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <EmptyState title="No WhatsApp messages" body="No message history was returned for this customer." />
          ) : (
            <DataTable columns={columns} data={messages} emptyMessage="No WhatsApp messages found." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CustomerWhatsAppTab;
