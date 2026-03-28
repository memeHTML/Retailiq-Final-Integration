import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { authStore } from '@/stores/authStore';
import { normalizeApiError } from '@/utils/errors';
import { formatDate } from '@/utils/dates';
import { useCustomerWhatsAppMessages, useCustomerWhatsAppStatus } from '@/hooks/useWhatsapp';
import { useSendWhatsAppMessageMutation } from '@/hooks/whatsapp';
import type { WhatsAppMessage } from '@/api/whatsapp';

type Props = {
  customerId?: string;
  mobileNumber: string;
  customerName: string;
};

export default function CustomerWhatsAppTab({ mobileNumber, customerName, customerId }: Props) {
  const navigate = useNavigate();
  const role = authStore((state) => state.role);
  const canManage = role === 'owner' || role === 'staff';
  const [message, setMessage] = useState('');

  const statusQuery = useCustomerWhatsAppStatus(mobileNumber);
  const messagesQuery = useCustomerWhatsAppMessages(mobileNumber ? { to: mobileNumber } : undefined);
  const sendMutation = useSendWhatsAppMessageMutation();

  if (statusQuery.isError) {
    return <ErrorState error={normalizeApiError(statusQuery.error)} onRetry={() => void statusQuery.refetch()} />;
  }

  const messages = (messagesQuery.data as { messages?: WhatsAppMessage[] } | WhatsAppMessage[] | undefined);
  const rows = Array.isArray(messages) ? messages : messages?.messages ?? [];

  const handleSend = async () => {
    if (!mobileNumber || !message) return;
    await sendMutation.mutateAsync({
      to: mobileNumber,
      message_type: 'TEXT',
      content: message,
    });
    setMessage('');
  };

  if (statusQuery.isLoading) {
    return <SkeletonLoader variant="rect" height={240} />;
  }

  if (!mobileNumber) {
    return (
      <EmptyState
        title="No mobile number"
        body="This customer does not have a mobile number for WhatsApp contact."
        action={canManage ? { label: 'Open WhatsApp Center', onClick: () => navigate('/whatsapp') } : undefined}
      />
    );
  }

  const status = statusQuery.data?.status ?? 'OPTED_OUT';

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Opt-in status</CardTitle></CardHeader>
          <CardContent>
            <Badge variant={status === 'OPTED_IN' ? 'success' : 'secondary'}>{status}</Badge>
            <div className="mt-2 text-sm text-gray-500">
              {status === 'OPTED_IN' ? 'Customer can receive outbound messages.' : 'Customer is not opted in yet.'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{customerName}</div>
            <div className="text-sm text-gray-500">{mobileNumber}</div>
            {customerId ? <div className="text-xs text-gray-400">Customer ID: {customerId}</div> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Contact actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Button variant="secondary" onClick={() => navigate('/whatsapp')}>
              Open WhatsApp Center
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Send message</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input label="Message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write a quick WhatsApp message..." />
          <Button loading={sendMutation.isPending} onClick={() => void handleSend()}>
            Send Message
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Message history</CardTitle></CardHeader>
        <CardContent>
          {messagesQuery.isLoading ? (
            <SkeletonLoader variant="rect" height={180} />
          ) : rows.length === 0 ? (
            <EmptyState title="No messages" body="No WhatsApp messages have been sent to this customer yet." />
          ) : (
            <DataTable<WhatsAppMessage>
              columns={[
                { key: 'sent_at', header: 'Date', render: (row) => formatDate(row.sent_at) },
                { key: 'status', header: 'Status', render: (row) => <Badge variant={row.status === 'FAILED' ? 'destructive' : row.status === 'READ' ? 'success' : 'secondary'}>{row.status}</Badge> },
                { key: 'message_type', header: 'Type', render: (row) => row.message_type },
                { key: 'content', header: 'Message', render: (row) => row.content },
              ]}
              data={rows}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
