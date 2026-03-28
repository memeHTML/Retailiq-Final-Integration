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
import {
  useCustomerLoyaltyAccount,
  useCustomerLoyaltyTransactions,
  useRedeemPointsMutation,
  useAdjustPointsMutation,
} from '@/hooks/useLoyalty';
import type { LoyaltyAccount, LoyaltyTransaction } from '@/api/loyalty';

type Props = {
  customerId: string;
  customerName: string;
};

export default function CustomerLoyaltyTab({ customerId, customerName }: Props) {
  const navigate = useNavigate();
  const role = authStore((state) => state.role);
  const canManage = role === 'owner';
  const [redeemPoints, setRedeemPoints] = useState('');
  const [redeemDescription, setRedeemDescription] = useState('');
  const [adjustPoints, setAdjustPoints] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const accountQuery = useCustomerLoyaltyAccount(customerId);
  const transactionsQuery = useCustomerLoyaltyTransactions(customerId, { limit: 8 });
  const redeemMutation = useRedeemPointsMutation();
  const adjustMutation = useAdjustPointsMutation();

  if (accountQuery.isError) {
    return <ErrorState error={normalizeApiError(accountQuery.error)} onRetry={() => void accountQuery.refetch()} />;
  }

  const account = accountQuery.data as LoyaltyAccount | undefined;
  const transactions = (transactionsQuery.data as { transactions?: LoyaltyTransaction[] } | LoyaltyTransaction[] | undefined);
  const rows = Array.isArray(transactions) ? transactions : transactions?.transactions ?? [];

  if (accountQuery.isLoading) {
    return <SkeletonLoader variant="rect" height={240} />;
  }

  if (!account) {
    return (
      <EmptyState
        title="No loyalty account"
        body={`${customerName} is not enrolled in loyalty yet.`}
        action={canManage ? { label: 'Open Loyalty Program', onClick: () => navigate('/loyalty') } : undefined}
      />
    );
  }

  const handleRedeem = async () => {
    if (!redeemPoints) return;
    await redeemMutation.mutateAsync({
      customer_id: customerId,
      points: Number(redeemPoints),
      description: redeemDescription || undefined,
    });
    setRedeemPoints('');
    setRedeemDescription('');
  };

  const handleAdjust = async () => {
    if (!adjustPoints || !adjustReason) return;
    await adjustMutation.mutateAsync({
      customer_id: customerId,
      points: Number(adjustPoints),
      reason: adjustReason,
    });
    setAdjustPoints('');
    setAdjustReason('');
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Tier</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-2xl font-semibold">{account.tier_name}</div>
                <div className="text-sm text-gray-500">Last activity {formatDate(account.last_activity_at)}</div>
              </div>
              <Badge variant={account.current_points > 0 ? 'success' : 'secondary'}>{account.current_points.toLocaleString()} pts</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Lifetime Points</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{account.lifetime_points.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Earned since enrollment</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Redemptions</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{account.points_redeemed.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Points redeemed over time</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Loyalty history</CardTitle></CardHeader>
        <CardContent>
          {transactionsQuery.isLoading ? (
            <SkeletonLoader variant="rect" height={180} />
          ) : rows.length === 0 ? (
            <EmptyState title="No loyalty history" body="No loyalty activity has been recorded for this customer." />
          ) : (
            <DataTable<LoyaltyTransaction>
              columns={[
                { key: 'created_at', header: 'Date', render: (row) => formatDate(row.created_at) },
                { key: 'type', header: 'Type', render: (row) => <Badge variant={row.type === 'REDEEMED' ? 'warning' : row.type === 'EXPIRED' ? 'destructive' : 'success'}>{row.type}</Badge> },
                { key: 'points', header: 'Points', render: (row) => row.points.toLocaleString() },
                { key: 'balance_after', header: 'Balance After', render: (row) => row.balance_after.toLocaleString() },
                { key: 'description', header: 'Description', render: (row) => row.description },
              ]}
              data={rows}
            />
          )}
        </CardContent>
      </Card>

      {canManage ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Redeem points</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input type="number" label="Points" value={redeemPoints} onChange={(event) => setRedeemPoints(event.target.value)} />
              <Input label="Description" value={redeemDescription} onChange={(event) => setRedeemDescription(event.target.value)} />
              <Button loading={redeemMutation.isPending} onClick={() => void handleRedeem()}>
                Redeem Points
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Adjust points</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input type="number" label="Points" value={adjustPoints} onChange={(event) => setAdjustPoints(event.target.value)} />
              <Input label="Reason" value={adjustReason} onChange={(event) => setAdjustReason(event.target.value)} />
              <Button variant="secondary" loading={adjustMutation.isPending} onClick={() => void handleAdjust()}>
                Adjust Points
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <EmptyState title="Owner access required" body="Only owners can redeem or adjust loyalty points." />
      )}
    </div>
  );
}
