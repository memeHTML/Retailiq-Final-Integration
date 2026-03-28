import { StatCard } from '@/components/shared/StatCard';
import type { GetDailyTransactionSummaryResponse } from '@/types/api';

interface DailySummaryCardProps {
  dateLabel: string;
  summary?: GetDailyTransactionSummaryResponse | null;
  isLoading?: boolean;
}

export function DailySummaryCard({ dateLabel, summary, isLoading }: DailySummaryCardProps) {
  const averageSale = summary && summary.total_transactions > 0
    ? (summary.total_sales / summary.total_transactions).toFixed(2)
    : '0.00';

  return (
    <section className="card">
      <div className="card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div>
          <strong>Daily summary</strong>
          <div className="muted" style={{ fontSize: '0.875rem' }}>{dateLabel}</div>
        </div>
        {isLoading ? <span className="muted">Loading...</span> : null}
      </div>
      <div className="card__body" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <StatCard label="Total sales" value={summary ? summary.total_sales : 'N/A'} description="Gross sales for the selected day" />
        <StatCard label="Transactions" value={summary ? summary.total_transactions : 'N/A'} description="Completed sales count" />
        <StatCard label="Average sale" value={summary ? averageSale : 'N/A'} description="Average transaction value" />
        <StatCard label="Returns" value={summary?.total_returns ?? 'N/A'} description="Returned transactions" />
      </div>
    </section>
  );
}

export default DailySummaryCard;
