/**
 * src/api/analytics.ts
 * Contract-safe analytics adapters with period-to-range translation.
 */
import { requestEnvelope } from './client';
import type {
  AnalyticsCategoryBreakdown,
  AnalyticsCustomerSummary,
  AnalyticsDashboardSnapshot,
  AnalyticsDiagnostics,
  AnalyticsPaymentModeBreakdown,
  AnalyticsTopProduct,
  AnalyticsTrendPoint,
  AnalyticsWindowInput,
} from '@/types/analytics';
import { analyticsWindowKey, resolveAnalyticsWindow } from '@/lib/analytics';

type JsonRecord = Record<string, unknown>;

const toNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toString = (value: unknown, fallback = '') => {
  if (typeof value === 'string') {
    return value;
  }
  if (value == null) {
    return fallback;
  }
  return String(value);
};

const toQueryParams = (scope?: AnalyticsWindowInput) => {
  const { start, end, groupBy } = resolveAnalyticsWindow(scope);
  return { start, end, group_by: groupBy };
};

const normalizeTrendRows = (rows: unknown): AnalyticsTrendPoint[] => (
  Array.isArray(rows)
    ? rows.map((row) => {
        const record = row as JsonRecord;
        return {
          date: toString(record.date ?? record.created_at ?? record.day),
          revenue: toNumber(record.revenue ?? record.total_revenue),
          profit: toNumber(record.profit ?? record.total_profit),
          transactions: toNumber(record.transactions ?? record.txn_count ?? record.total_transactions),
          moving_avg_7d: record.moving_avg_7d == null ? undefined : toNumber(record.moving_avg_7d),
          margin_pct: record.margin_pct == null ? undefined : toNumber(record.margin_pct),
        };
      })
    : []
);

const normalizeTopProducts = (rows: unknown): AnalyticsTopProduct[] => (
  Array.isArray(rows)
    ? rows.map((row) => {
        const record = row as JsonRecord;
        return {
          product_id: toString(record.product_id ?? record.id),
          name: toString(record.name ?? record.product_name, 'Unknown product'),
          sku_code: record.sku_code == null ? undefined : toString(record.sku_code),
          revenue: toNumber(record.revenue),
          quantity: toNumber(record.quantity ?? record.units_sold ?? record.total_sold),
          total_sold: record.total_sold == null ? undefined : toNumber(record.total_sold),
          profit: toNumber(record.profit),
        };
      })
    : []
);

const normalizeCategoryBreakdown = (rows: unknown): AnalyticsCategoryBreakdown[] => (
  Array.isArray(rows)
    ? rows.map((row) => {
        const record = row as JsonRecord;
        return {
          category_id: toString(record.category_id ?? record.id),
          name: toString(record.name ?? record.category_name, 'Uncategorised'),
          revenue: toNumber(record.revenue),
          profit: toNumber(record.profit),
          units: toNumber(record.units ?? record.quantity ?? record.txn_count),
          share_pct: toNumber(record.share_pct ?? record.percentage ?? record.percent),
          percentage: record.percentage == null ? undefined : toNumber(record.percentage),
        };
      })
    : []
);

const normalizePaymentModes = (rows: unknown): AnalyticsPaymentModeBreakdown[] => (
  Array.isArray(rows)
    ? rows.map((row) => {
        const record = row as JsonRecord;
        return {
          mode: toString(record.mode ?? record.payment_mode, 'UNKNOWN'),
          txn_count: toNumber(record.txn_count ?? record.count),
          revenue: toNumber(record.revenue ?? record.amount),
          txn_share_pct: toNumber(record.txn_share_pct ?? record.txn_percentage ?? record.percentage),
          rev_share_pct: toNumber(record.rev_share_pct ?? record.revenue_share_pct ?? record.percentage),
          payment_mode: record.payment_mode == null ? undefined : toString(record.payment_mode),
          count: record.count == null ? undefined : toNumber(record.count),
          amount: record.amount == null ? undefined : toNumber(record.amount),
          percentage: record.percentage == null ? undefined : toNumber(record.percentage),
        };
      })
    : []
);

const normalizeCustomerSummary = (payload: unknown): AnalyticsCustomerSummary => {
  const record = (payload && typeof payload === 'object' ? payload as JsonRecord : {}) as JsonRecord;
  return {
    identified_customers: toNumber(record.identified_customers),
    new_customers: toNumber(record.new_customers),
    returning_customers: toNumber(record.returning_customers),
    total_transactions: toNumber(record.total_transactions),
    identified_transactions: toNumber(record.identified_transactions),
    anonymous_transactions: toNumber(record.anonymous_transactions),
    total_revenue: toNumber(record.total_revenue),
    avg_revenue_per_customer: toNumber(record.avg_revenue_per_customer),
  };
};

const normalizeDiagnostics = (payload: unknown): AnalyticsDiagnostics => {
  const record = (payload && typeof payload === 'object' ? payload as JsonRecord : {}) as JsonRecord;
  return {
    trend_deviations: Array.isArray(record.trend_deviations)
      ? record.trend_deviations.map((row) => {
          const item = row as JsonRecord;
          return {
            date: toString(item.date),
            revenue: toNumber(item.revenue),
            moving_avg_7d: toNumber(item.moving_avg_7d),
            deviation_pct: toNumber(item.deviation_pct),
            flagged: Boolean(item.flagged),
          };
        })
      : [],
    sku_rolling_variance: Array.isArray(record.sku_rolling_variance)
      ? record.sku_rolling_variance.map((row) => {
          const item = row as JsonRecord;
          return {
            product_id: item.product_id as string | number,
            name: toString(item.name, 'Unknown SKU'),
            cv_14d: item.cv_14d == null ? undefined : toNumber(item.cv_14d),
            cv_30d: item.cv_30d == null ? undefined : toNumber(item.cv_30d),
            flagged: Boolean(item.flagged),
          };
        })
      : [],
    margin_drift: record.margin_drift && typeof record.margin_drift === 'object'
      ? {
          prior_avg_margin_pct: (record.margin_drift as JsonRecord).prior_avg_margin_pct == null ? undefined : toNumber((record.margin_drift as JsonRecord).prior_avg_margin_pct),
          current_avg_margin_pct: (record.margin_drift as JsonRecord).current_avg_margin_pct == null ? undefined : toNumber((record.margin_drift as JsonRecord).current_avg_margin_pct),
          delta_pct: (record.margin_drift as JsonRecord).delta_pct == null ? undefined : toNumber((record.margin_drift as JsonRecord).delta_pct),
          flagged: Boolean((record.margin_drift as JsonRecord).flagged),
        }
      : null,
  };
};

const normalizeDashboard = (payload: unknown): AnalyticsDashboardSnapshot => {
  const record = (payload && typeof payload === 'object' ? payload as JsonRecord : {}) as JsonRecord;
  return {
    today_kpis: {
      date: toString((record.today_kpis as JsonRecord | undefined)?.date),
      revenue: toNumber((record.today_kpis as JsonRecord | undefined)?.revenue),
      profit: toNumber((record.today_kpis as JsonRecord | undefined)?.profit),
      transactions: toNumber((record.today_kpis as JsonRecord | undefined)?.transactions),
      avg_basket: toNumber((record.today_kpis as JsonRecord | undefined)?.avg_basket),
      units_sold: toNumber((record.today_kpis as JsonRecord | undefined)?.units_sold),
    },
    insights: Array.isArray(record.insights)
      ? record.insights.map((item) => {
          const row = item as JsonRecord;
          return {
            type: toString(row.type, 'info'),
            title: toString(row.title, 'Insight'),
            body: toString(row.body, ''),
          };
        })
      : [],
    top_products_today: Array.isArray(record.top_products_today)
      ? record.top_products_today.map((item) => {
          const row = item as JsonRecord;
          return {
            product_id: row.product_id as string | number,
            name: toString(row.name, 'Unknown product'),
            revenue: toNumber(row.revenue),
            units_sold: toNumber(row.units_sold),
          };
        })
      : [],
    alerts_summary: record.alerts_summary && typeof record.alerts_summary === 'object'
      ? Object.fromEntries(Object.entries(record.alerts_summary as Record<string, unknown>).map(([key, value]) => [key, toNumber(value)]))
      : {},
    revenue_7d: normalizeTrendRows(record.revenue_7d),
    moving_avg_7d: normalizeTrendRows(record.moving_avg_7d),
    category_breakdown: normalizeCategoryBreakdown(record.category_breakdown),
    payment_mode_breakdown: normalizePaymentModes(record.payment_mode_breakdown),
  };
};

const getRangeParams = (scope?: AnalyticsWindowInput) => ({
  ...toQueryParams(scope),
});

export const analyticsApi = {
  getAnalyticsDashboard: async (scope?: AnalyticsWindowInput): Promise<AnalyticsDashboardSnapshot> => {
    const { data } = await requestEnvelope<unknown>({
      url: '/api/v1/analytics/dashboard',
      method: 'GET',
      params: getRangeParams(scope),
    });
    return normalizeDashboard(data);
  },

  getRevenue: async (scope?: AnalyticsWindowInput): Promise<AnalyticsTrendPoint[]> => {
    const { data } = await requestEnvelope<unknown>({
      url: '/api/v1/analytics/revenue',
      method: 'GET',
      params: getRangeParams(scope),
    });
    return normalizeTrendRows(data);
  },

  getProfit: async (scope?: AnalyticsWindowInput): Promise<AnalyticsTrendPoint[]> => {
    const { data } = await requestEnvelope<unknown>({
      url: '/api/v1/analytics/profit',
      method: 'GET',
      params: getRangeParams(scope),
    });
    return normalizeTrendRows(data);
  },

  getRevenueTrend: async (scope?: AnalyticsWindowInput): Promise<AnalyticsTrendPoint[]> => analyticsApi.getRevenue(scope),

  getRevenueMetrics: async (scope?: AnalyticsWindowInput) => {
    const rows = await analyticsApi.getRevenue(scope);
    const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);
    const totalProfit = rows.reduce((sum, row) => sum + row.profit, 0);
    const totalOrders = rows.reduce((sum, row) => sum + row.transactions, 0);
    const latest = rows.at(-1);
    const previous = rows.at(-2);
    const growth_rate = previous && previous.revenue > 0
      ? ((latest?.revenue ?? 0) - previous.revenue) / previous.revenue * 100
      : 0;

    return {
      total_revenue: totalRevenue,
      total_profit: totalProfit,
      total_orders: totalOrders,
      average_order_value: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      growth_rate,
    };
  },

  getProfitMetrics: async (scope?: AnalyticsWindowInput) => {
    const rows = await analyticsApi.getProfit(scope);
    const totalProfit = rows.reduce((sum, row) => sum + row.profit, 0);
    const averageMargin = rows.length ? rows.reduce((sum, row) => sum + (row.margin_pct ?? 0), 0) / rows.length : 0;
    const latestMargin = rows.at(-1)?.margin_pct ?? 0;
    const latestProfit = rows.at(-1)?.profit ?? 0;
    const previousProfit = rows.at(-2)?.profit ?? 0;
    const growth_rate = previousProfit > 0 ? ((latestProfit - previousProfit) / previousProfit) * 100 : 0;

    return {
      total_profit: totalProfit,
      average_margin_pct: averageMargin,
      latest_margin_pct: latestMargin,
      growth_rate,
    };
  },

  getTopProducts: async (
    scope?: AnalyticsWindowInput,
    options: { limit?: number; metric?: 'revenue' | 'quantity' | 'profit' } = {},
  ): Promise<AnalyticsTopProduct[]> => {
    const { limit = 10, metric = 'revenue' } = options;
    const { data } = await requestEnvelope<unknown>({
      url: '/api/v1/analytics/top-products',
      method: 'GET',
      params: { ...getRangeParams(scope), limit, metric },
    });
    return normalizeTopProducts(data);
  },

  getCategoryBreakdown: async (scope?: AnalyticsWindowInput): Promise<AnalyticsCategoryBreakdown[]> => {
    const { data } = await requestEnvelope<unknown>({
      url: '/api/v1/analytics/category-breakdown',
      method: 'GET',
      params: getRangeParams(scope),
    });
    return normalizeCategoryBreakdown(data);
  },

  getPaymentModes: async (scope?: AnalyticsWindowInput): Promise<AnalyticsPaymentModeBreakdown[]> => {
    const { data } = await requestEnvelope<unknown>({
      url: '/api/v1/analytics/payment-modes',
      method: 'GET',
      params: getRangeParams(scope),
    });
    return normalizePaymentModes(data);
  },

  getPaymentModeSummary: async (scope?: AnalyticsWindowInput) => analyticsApi.getPaymentModes(scope),

  getCustomerSummaryAnalytics: async (scope?: AnalyticsWindowInput): Promise<AnalyticsCustomerSummary> => {
    const { data } = await requestEnvelope<unknown>({
      url: '/api/v1/analytics/customers/summary',
      method: 'GET',
      params: getRangeParams(scope),
    });
    return normalizeCustomerSummary(data);
  },

  getCustomerAnalytics: async (scope?: AnalyticsWindowInput) => analyticsApi.getCustomerSummaryAnalytics(scope),

  getAnalyticsDiagnostics: async (scope?: AnalyticsWindowInput): Promise<AnalyticsDiagnostics> => {
    const { data } = await requestEnvelope<unknown>({
      url: '/api/v1/analytics/diagnostics',
      method: 'GET',
      params: getRangeParams(scope),
    });
    return normalizeDiagnostics(data);
  },

  getProfitContribution: async (scope?: AnalyticsWindowInput) => {
    const { data } = await requestEnvelope<unknown>({
      url: '/api/v1/analytics/contribution',
      method: 'GET',
      params: getRangeParams(scope),
    });
    return data;
  },

  getContribution: async (scope?: AnalyticsWindowInput) => analyticsApi.getProfitContribution(scope),
};

export const getAnalyticsDashboard = (scope?: AnalyticsWindowInput) => analyticsApi.getAnalyticsDashboard(scope);
export const getRevenueTrend = (scope?: AnalyticsWindowInput) => analyticsApi.getRevenueTrend(scope);
export const getRevenue = (scope?: AnalyticsWindowInput) => analyticsApi.getRevenue(scope);
export const getProfit = (scope?: AnalyticsWindowInput) => analyticsApi.getProfit(scope);
export const getTopProducts = (scope?: AnalyticsWindowInput) => analyticsApi.getTopProducts(scope);
export const getCategoryBreakdown = (scope?: AnalyticsWindowInput) => analyticsApi.getCategoryBreakdown(scope);
export const getContribution = (scope?: AnalyticsWindowInput) => analyticsApi.getContribution(scope);
export const getPaymentModes = (scope?: AnalyticsWindowInput) => analyticsApi.getPaymentModes(scope);
export const getCustomerSummaryAnalytics = (scope?: AnalyticsWindowInput) => analyticsApi.getCustomerSummaryAnalytics(scope);
export const getAnalyticsDiagnostics = (scope?: AnalyticsWindowInput) => analyticsApi.getAnalyticsDiagnostics(scope);

export const analyticsKeys = {
  all: ['analytics'] as const,
  dashboard: (scope?: AnalyticsWindowInput) => [...analyticsKeys.all, 'dashboard', ...analyticsWindowKey(scope)] as const,
  revenue: (scope?: AnalyticsWindowInput) => [...analyticsKeys.all, 'revenue', ...analyticsWindowKey(scope)] as const,
  profit: (scope?: AnalyticsWindowInput) => [...analyticsKeys.all, 'profit', ...analyticsWindowKey(scope)] as const,
  topProducts: (scope?: AnalyticsWindowInput) => [...analyticsKeys.all, 'top-products', ...analyticsWindowKey(scope)] as const,
  categoryBreakdown: (scope?: AnalyticsWindowInput) => [...analyticsKeys.all, 'category-breakdown', ...analyticsWindowKey(scope)] as const,
  paymentModes: (scope?: AnalyticsWindowInput) => [...analyticsKeys.all, 'payment-modes', ...analyticsWindowKey(scope)] as const,
  customerSummary: (scope?: AnalyticsWindowInput) => [...analyticsKeys.all, 'customer-summary', ...analyticsWindowKey(scope)] as const,
  diagnostics: (scope?: AnalyticsWindowInput) => [...analyticsKeys.all, 'diagnostics', ...analyticsWindowKey(scope)] as const,
};
