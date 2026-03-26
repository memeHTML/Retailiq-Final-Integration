import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { BarChart3, CreditCard, Download, FileText, IndianRupee, Package, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { analyticsApi } from '@/api/analytics';
import { gstApi } from '@/api/gst';
import { financeApi } from '@/api/finance';
import { normalizeApiError } from '@/utils/errors';
import { formatCurrency } from '@/utils/numbers';
import { useQuery } from '@tanstack/react-query';

type ReportCard = {
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel: string;
  onClick: () => void;
  meta?: string;
  tone: 'blue' | 'emerald' | 'amber' | 'violet';
};

const toneClasses: Record<ReportCard['tone'], string> = {
  blue: 'bg-sky-500/10 text-sky-700',
  emerald: 'bg-emerald-500/10 text-emerald-700',
  amber: 'bg-amber-500/10 text-amber-700',
  violet: 'bg-violet-500/10 text-violet-700',
};

function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => JSON.stringify(row[header] ?? '')).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('30d');
  const [gstStatus, setGstStatus] = useState<string>('Ready');

  const analyticsQuery = useQuery({
    queryKey: ['reports', 'analytics', period],
    queryFn: () => analyticsApi.getAnalyticsDashboard(period),
    staleTime: 30_000,
  });

  const revenueTrendQuery = useQuery({
    queryKey: ['reports', 'revenue-trend', period],
    queryFn: () => analyticsApi.getRevenueTrend(period),
    staleTime: 30_000,
  });

  const financeQuery = useQuery({
    queryKey: ['reports', 'finance-dashboard'],
    queryFn: () => financeApi.getFinanceDashboard(),
    staleTime: 30_000,
  });

  const reportCards = useMemo<ReportCard[]>(() => [
    {
      title: 'Sales Report',
      description: 'Download a CSV snapshot of sales and revenue trend data for the selected period.',
      icon: BarChart3,
      actionLabel: 'Download CSV',
      tone: 'blue',
      meta: `${period.toUpperCase()} revenue`,
      onClick: () => {
        const trend = revenueTrendQuery.data ?? [];
        downloadCsv(`sales-report-${period}.csv`, trend.map((row) => ({
          date: row.date ?? '',
          revenue: row.revenue ?? 0,
          profit: row.profit ?? 0,
          transactions: row.transactions ?? 0,
        })));
      },
    },
    {
      title: 'Inventory Report',
      description: 'Open the inventory module to review products, stock, and alerts.',
      icon: Package,
      actionLabel: 'Open Inventory',
      tone: 'emerald',
      onClick: () => navigate('/inventory'),
      meta: 'Products and stock',
    },
    {
      title: 'Customer Report',
      description: 'Jump to customer analytics and account summaries.',
      icon: Users,
      actionLabel: 'Open Customers',
      tone: 'violet',
      onClick: () => navigate('/customers'),
      meta: 'CRM and loyalty',
    },
    {
      title: 'GST / GSTR1 Report',
      description: 'Generate the current GSTR1 filing packet from backend GST data.',
      icon: FileText,
      actionLabel: 'Generate',
      tone: 'amber',
      meta: gstStatus,
      onClick: async () => {
        setGstStatus('Generating...');
        try {
          const periodLabel = format(new Date(), 'yyyy-MM');
          await gstApi.fileGSTR1(periodLabel);
          setGstStatus(`Generated for ${periodLabel}`);
        } catch (error) {
          setGstStatus(normalizeApiError(error).message);
        }
      },
    },
    {
      title: 'Finance Report',
      description: 'Review treasury, debt, and finance dashboards before exporting finance notes.',
      icon: CreditCard,
      actionLabel: 'Open Finance',
      tone: 'blue',
      meta: 'Treasury and credit',
      onClick: () => navigate('/finance'),
    },
    {
      title: 'Staff Performance',
      description: 'Open the staff performance module for operational export and review.',
      icon: IndianRupee,
      actionLabel: 'Open Staff',
      tone: 'emerald',
      meta: 'Performance and targets',
      onClick: () => navigate('/staff-performance'),
    },
  ], [navigate, period, revenueTrendQuery.data, gstStatus]);

  const loading = analyticsQuery.isLoading || revenueTrendQuery.isLoading || financeQuery.isLoading;
  const error = analyticsQuery.error ?? revenueTrendQuery.error ?? financeQuery.error;

  return (
    <PageFrame
      title="Reports"
      subtitle="A reporting hub for exports, module jump-offs, and quick operational snapshots."
      actions={
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Period</label>
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className="rounded-2xl border border-border bg-white px-3 py-2 text-sm"
          >
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
            <option value="90d">90 days</option>
          </select>
        </div>
      }
    >
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Report Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <SkeletonLoader variant="rect" height={120} />
          ) : error ? (
            <ErrorState error={normalizeApiError(error)} />
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-border/60 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Revenue</div>
                <div className="mt-2 text-2xl font-semibold text-foreground">{formatCurrency(analyticsQuery.data?.today_kpis?.revenue ?? 0)}</div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Transactions</div>
                <div className="mt-2 text-2xl font-semibold text-foreground">{analyticsQuery.data?.today_kpis?.transactions ?? 0}</div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Finance</div>
                <div className="mt-2 text-2xl font-semibold text-foreground">{formatCurrency(financeQuery.data?.cash_on_hand ?? 0)}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reportCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="border-border/60 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className={`inline-flex rounded-2xl p-3 ${toneClasses[card.tone]}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-base font-semibold text-foreground">{card.title}</div>
                      <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <Badge variant="secondary">{card.meta ?? 'Ready'}</Badge>
                  <Button variant="secondary" size="sm" onClick={card.onClick}>
                    <Download className="mr-2 h-4 w-4" />
                    {card.actionLabel}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => navigate('/analytics')}>Open Analytics</Button>
          <Button variant="ghost" onClick={() => navigate('/finance')}>Open Finance</Button>
          <Button variant="ghost" onClick={() => navigate('/gst')}>Open GST</Button>
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </CardContent>
      </Card>
    </PageFrame>
  );
}
