import type { AnalyticsGroupBy, AnalyticsPresetPeriod, AnalyticsWindow } from '@/lib/analytics';

export type { AnalyticsGroupBy, AnalyticsPresetPeriod, AnalyticsWindow };
export type AnalyticsWindowInput = AnalyticsPresetPeriod | AnalyticsWindow | string | undefined;

export interface AnalyticsTrendPoint {
  date: string;
  revenue: number;
  profit: number;
  transactions: number;
  moving_avg_7d?: number;
  margin_pct?: number;
}

export interface AnalyticsTopProduct {
  product_id: string;
  name: string;
  sku_code?: string;
  revenue: number;
  quantity: number;
  total_sold?: number;
  profit: number;
}

export interface AnalyticsCategoryBreakdown {
  category_id: string;
  name: string;
  revenue: number;
  profit: number;
  units: number;
  share_pct: number;
  percentage?: number;
}

export interface AnalyticsPaymentModeBreakdown {
  mode: string;
  txn_count: number;
  revenue: number;
  txn_share_pct: number;
  rev_share_pct: number;
  payment_mode?: string;
  count?: number;
  amount?: number;
  percentage?: number;
}

export interface AnalyticsCustomerSummary {
  identified_customers: number;
  new_customers: number;
  returning_customers: number;
  total_transactions: number;
  identified_transactions: number;
  anonymous_transactions: number;
  total_revenue: number;
  avg_revenue_per_customer: number;
}

export interface AnalyticsDashboardKpis {
  date: string;
  revenue: number;
  profit: number;
  transactions: number;
  avg_basket: number;
  units_sold: number;
}

export interface AnalyticsDashboardSnapshot {
  today_kpis: AnalyticsDashboardKpis;
  insights: Array<{
    type: string;
    title: string;
    body: string;
  }>;
  top_products_today: Array<{
    product_id: string | number;
    name: string;
    revenue: number;
    units_sold: number;
  }>;
  alerts_summary: Record<string, number>;
  revenue_7d: AnalyticsTrendPoint[];
  moving_avg_7d: AnalyticsTrendPoint[];
  category_breakdown: AnalyticsCategoryBreakdown[];
  payment_mode_breakdown: AnalyticsPaymentModeBreakdown[];
}

export interface AnalyticsDiagnosticsTrendDeviation {
  date: string;
  revenue: number;
  moving_avg_7d: number;
  deviation_pct: number;
  flagged: boolean;
}

export interface AnalyticsDiagnosticsSkuVariance {
  product_id: string | number;
  name: string;
  cv_14d?: number | null;
  cv_30d?: number | null;
  flagged: boolean;
}

export interface AnalyticsDiagnosticsMarginDrift {
  prior_avg_margin_pct?: number;
  current_avg_margin_pct?: number;
  delta_pct?: number;
  flagged?: boolean;
}

export interface AnalyticsDiagnostics {
  trend_deviations: AnalyticsDiagnosticsTrendDeviation[];
  sku_rolling_variance: AnalyticsDiagnosticsSkuVariance[];
  margin_drift: AnalyticsDiagnosticsMarginDrift | null;
}
