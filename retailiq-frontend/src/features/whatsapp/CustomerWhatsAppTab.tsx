import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useOptStatusQuery, useWhatsAppMessagesQuery, useWhatsAppConfigQuery } from '@/hooks/whatsapp';
import { formatDate } from '@/utils/dates';
import {
  getWhatsAppConnectionLabel,
  getWhatsAppMessageStatusVariant,
  normalizeCustomerWhatsAppPhoneNumber,
  normalizeWhatsAppMessageRow,
  type WhatsAppMessageRow,
} from './models';

interface CustomerWhatsAppTabProps {
  phoneNumber: string;
}

export function CustomerWhatsAppTab({ phoneNumber }: CustomerWhatsAppTabProps) {
  const normalizedPhoneNumber = normalizeCustomerWhatsAppPhoneNumber(phoneNumber);
  const configQuery = useWhatsAppConfigQuery();
  const optStatusQuery = useOptStatusQuery(normalizedPhoneNumber);

  if (!normalizedPhoneNumber) {
    return <EmptyState title="No phone number" body="This customer does not have a phone number to use for WhatsApp actions." />;
  }

  const messagesQuery = useWhatsAppMessagesQuery({ to: normalizedPhoneNumber, page: 1, limit: 5 });

  if (configQuery.isLoading || messagesQuery.isLoading) {
    return <SkeletonLoader variant="rect" height={220} />;
  }

  if (configQuery.isError || messagesQuery.isError) {
    return <EmptyState title="WhatsApp unavailable" body="The WhatsApp configuration could not be loaded for this store." />;
  }

  const messages: WhatsAppMessageRow[] = (messagesQuery.data?.messages ?? []).map(normalizeWhatsAppMessageRow);

  const columns: Column<(typeof messages)[number]>[] = [
    { key: 'date', header: 'Date', render: (row) => (row.createdAt ? formatDate(row.createdAt) : '-') },
    { key: 'type', header: 'Type', render: (row) => <Badge variant="secondary">{row.messageType}</Badge> },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={getWhatsAppMessageStatusVariant(row.status)}>{row.status}</Badge> },
    { key: 'content', header: 'Content', render: (row) => row.content },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-gray-500">Connection</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{getWhatsAppConnectionLabel(Boolean(configQuery.data?.is_connected))}</div>
            <div className="text-sm text-gray-500">{configQuery.data?.phone_number ?? 'No phone configured'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-gray-500">Opt Status</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{optStatusQuery.data?.status ?? 'UNKNOWN'}</div>
            <div className="text-sm text-gray-500">{normalizedPhoneNumber}</div>
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
