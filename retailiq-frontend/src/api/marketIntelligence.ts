/**
 * src/api/marketIntelligence.ts
 * Backend-aligned market intelligence adapters.
 */
import { request } from './client';

const MARKET_BASE = '/api/v1/market';

export interface MarketSummary {
  signals_last_24h: Record<
    string,
    {
      count: number;
      avg_value: number;
    }
  >;
  generated_at: string;
}

export interface MarketSignal {
  id: string;
  signal_type: string;
  source_id: string | number | null;
  category_id: string | number | null;
  region_code: string | null;
  value: number | null;
  confidence: number | null;
  quality_score: number | null;
  timestamp: string;
}

export interface PriceIndex {
  id: string;
  category_id: string | number | null;
  region_code: string | null;
  index_value: number | null;
  computation_method: string | null;
  computed_at: string;
}

export interface MarketAlert {
  id: string | number;
  alert_type: string;
  severity: string;
  message: string;
  recommended_action: string | null;
  acknowledged: boolean;
  created_at: string;
}

export interface CompetitorAnalysis {
  competitor_id: string;
  name: string;
  region: string;
  total_products: number;
  average_pricing: number;
  pricing_strategy: string;
  market_share: number;
  strengths: string[];
  weaknesses: string[];
  last_analyzed: string;
  price_comparison: Array<{
    category: string;
    competitor_price: number;
    our_price: number;
    difference: number;
  }>;
}

export interface DemandForecast {
  product_id: string;
  product_name: string;
  sku: string;
  current_demand: number;
  forecast_demand: number;
  forecast_period: string;
  confidence_score: number;
  factors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
  recommendations: string[];
  created_at: string;
}

export interface MarketRecommendation {
  id: string;
  type: string;
  priority: string;
  title: string;
  description: string;
  expected_impact: string;
  effort_required: string;
  due_date: string | null;
  status: string;
  created_at: string;
}

export interface ComputePriceIndexResponse {
  category_id: string | number;
  new_index: number;
}

const asArray = <T>(payload: unknown): T[] => {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === 'object') {
    return [payload as T];
  }

  return [];
};

const asNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const asString = (value: unknown, fallback = '') => {
  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value);
};

const asSummaryBreakdown = (value: unknown): Record<string, { count: number; avg_value: number }> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, raw]) => {
      const record = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};

      return [
        key,
        {
          count: Number(record.count ?? 0),
          avg_value: Number(record.avg_value ?? 0),
        },
      ];
    }),
  );
};

export const marketIntelligenceApi = {
  getMarketSummary: async (): Promise<MarketSummary> => {
    const response = await request<unknown>({ url: `${MARKET_BASE}/summary`, method: 'GET' });

    const record = response && typeof response === 'object' && !Array.isArray(response) ? (response as Record<string, unknown>) : {};

    return {
      signals_last_24h: asSummaryBreakdown(record.signals_last_24h),
      generated_at: asString(record.generated_at, new Date().toISOString()),
    };
  },

  getPriceSignals: async (params?: {
    category_id?: number | string;
    signal_type?: string;
    limit?: number;
  }): Promise<MarketSignal[]> => {
    const response = await request<unknown>({
      url: `${MARKET_BASE}/signals`,
      method: 'GET',
      params: {
        category_id: params?.category_id,
        signal_type: params?.signal_type,
        limit: params?.limit,
      },
    });

    return asArray<Record<string, unknown>>(response).map((signal) => ({
      id: asString(signal.id),
      signal_type: asString(signal.signal_type, 'UNKNOWN'),
      source_id: signal.source_id == null ? null : asString(signal.source_id),
      category_id: signal.category_id == null ? null : asString(signal.category_id),
      region_code: signal.region_code ? String(signal.region_code) : null,
      value: asNumber(signal.value),
      confidence: asNumber(signal.confidence),
      quality_score: asNumber(signal.quality_score),
      timestamp: asString(signal.timestamp, new Date().toISOString()),
    }));
  },

  getPriceIndices: async (params?: {
    category_id?: number | string;
    days?: number;
  }): Promise<PriceIndex[]> => {
    const response = await request<unknown>({
      url: `${MARKET_BASE}/indices`,
      method: 'GET',
      params: {
        category_id: params?.category_id,
        days: params?.days,
      },
    });

    return asArray<Record<string, unknown>>(response).map((index) => ({
      id: asString(index.id),
      category_id: index.category_id == null ? null : asString(index.category_id),
      region_code: index.region_code ? String(index.region_code) : null,
      index_value: asNumber(index.index_value),
      computation_method: index.computation_method ? String(index.computation_method) : null,
      computed_at: asString(index.computed_at, new Date().toISOString()),
    }));
  },

  computePriceIndex: async (data: {
    category_id: number | string;
  }): Promise<ComputePriceIndexResponse> =>
    request<ComputePriceIndexResponse>({
      url: `${MARKET_BASE}/indices/compute`,
      method: 'POST',
      data: {
        category_id: data.category_id,
      },
    }),

  getAlerts: async (params?: {
    unacknowledged_only?: boolean;
  }): Promise<MarketAlert[]> => {
    const response = await request<unknown>({
      url: `${MARKET_BASE}/alerts`,
      method: 'GET',
      params: params?.unacknowledged_only === undefined ? undefined : { unacknowledged_only: params.unacknowledged_only },
    });

    return asArray<Record<string, unknown>>(response).map((alert) => ({
      id: alert.id as string | number,
      alert_type: asString(alert.alert_type, 'UNKNOWN'),
      severity: asString(alert.severity, 'LOW'),
      message: asString(alert.message, ''),
      recommended_action: alert.recommended_action ? String(alert.recommended_action) : null,
      acknowledged: Boolean(alert.acknowledged),
      created_at: asString(alert.created_at, new Date().toISOString()),
    }));
  },

  acknowledgeAlert: async (alertId: string | number): Promise<{ id: string | number; acknowledged: boolean }> =>
    request<{ id: string | number; acknowledged: boolean }>({
      url: `${MARKET_BASE}/alerts/${alertId}/acknowledge`,
      method: 'POST',
    }),

  getCompetitors: async (region?: string): Promise<CompetitorAnalysis[]> => {
    const response = await request<unknown>({
      url: `${MARKET_BASE}/competitors`,
      method: 'GET',
      params: region ? { region } : undefined,
    });

    return asArray<Record<string, unknown>>(response).map((competitor) => ({
      competitor_id: asString(competitor.competitor_id ?? competitor.id),
      name: asString(competitor.name, 'Unknown'),
      region: asString(competitor.region, 'Unknown'),
      total_products: Number(competitor.total_products ?? 0),
      average_pricing: Number(competitor.average_pricing ?? 0),
      pricing_strategy: asString(competitor.pricing_strategy, 'COMPETITIVE'),
      market_share: Number(competitor.market_share ?? 0),
      strengths: Array.isArray(competitor.strengths) ? (competitor.strengths as string[]) : [],
      weaknesses: Array.isArray(competitor.weaknesses) ? (competitor.weaknesses as string[]) : [],
      last_analyzed: asString(competitor.last_analyzed, new Date().toISOString()),
      price_comparison: Array.isArray(competitor.price_comparison)
        ? (competitor.price_comparison as Array<Record<string, unknown>>).map((item) => ({
            category: asString(item.category, ''),
            competitor_price: Number(item.competitor_price ?? 0),
            our_price: Number(item.our_price ?? 0),
            difference: Number(item.difference ?? 0),
          }))
        : [],
    }));
  },

  getCompetitorDetail: async (competitorId: string | number): Promise<CompetitorAnalysis> => {
    const response = await request<unknown>({
      url: `${MARKET_BASE}/competitors/${competitorId}`,
      method: 'GET',
    });

    const competitor = Array.isArray(response) ? response[0] : response;
    const record = (competitor && typeof competitor === 'object' ? competitor : {}) as Record<string, unknown>;

    return {
      competitor_id: asString(record.competitor_id ?? competitorId),
      name: asString(record.name, 'Unknown'),
      region: asString(record.region, 'Unknown'),
      total_products: Number(record.total_products ?? 0),
      average_pricing: Number(record.average_pricing ?? 0),
      pricing_strategy: asString(record.pricing_strategy, 'COMPETITIVE'),
      market_share: Number(record.market_share ?? 0),
      strengths: Array.isArray(record.strengths) ? (record.strengths as string[]) : [],
      weaknesses: Array.isArray(record.weaknesses) ? (record.weaknesses as string[]) : [],
      last_analyzed: asString(record.last_analyzed, new Date().toISOString()),
      price_comparison: Array.isArray(record.price_comparison)
        ? (record.price_comparison as Array<Record<string, unknown>>).map((item) => ({
            category: asString(item.category, ''),
            competitor_price: Number(item.competitor_price ?? 0),
            our_price: Number(item.our_price ?? 0),
            difference: Number(item.difference ?? 0),
          }))
        : [],
    };
  },

  getDemandForecasts: async (params?: {
    product_id?: number | string;
    to_period?: string;
  }): Promise<DemandForecast[]> => {
    const response = await request<unknown>({
      url: `${MARKET_BASE}/forecasts`,
      method: 'GET',
      params: {
        product_id: params?.product_id,
        to_period: params?.to_period,
      },
    });

    return asArray<Record<string, unknown>>(response).map((forecast) => ({
      product_id: asString(forecast.product_id),
      product_name: asString(forecast.product_name, 'Unknown'),
      sku: asString(forecast.sku, ''),
      current_demand: Number(forecast.current_demand ?? 0),
      forecast_demand: Number(forecast.forecast_demand ?? 0),
      forecast_period: asString(forecast.forecast_period, 'next_30_days'),
      confidence_score: Number(forecast.confidence_score ?? 0),
      factors: Array.isArray(forecast.factors)
        ? (forecast.factors as Array<Record<string, unknown>>).map((item) => ({
            factor: asString(item.factor, ''),
            impact: Number(item.impact ?? 0),
            description: asString(item.description, ''),
          }))
        : [],
      recommendations: Array.isArray(forecast.recommendations) ? (forecast.recommendations as string[]) : [],
      created_at: asString(forecast.created_at, new Date().toISOString()),
    }));
  },

  generateForecast: async (data: {
    product_id: number | string;
    forecast_period: string;
  }): Promise<DemandForecast> => {
    const response = await request<unknown>({
      url: `${MARKET_BASE}/forecasts/generate`,
      method: 'POST',
      data: {
        product_id: data.product_id,
        forecast_period: data.forecast_period,
      },
    });

    const record = (response && typeof response === 'object' ? response : {}) as Record<string, unknown>;
    return {
      product_id: asString(record.product_id ?? data.product_id),
      product_name: asString(record.product_name, 'Unknown'),
      sku: asString(record.sku, ''),
      current_demand: Number(record.current_demand ?? 0),
      forecast_demand: Number(record.forecast_demand ?? 0),
      forecast_period: asString(record.forecast_period, data.forecast_period),
      confidence_score: Number(record.confidence_score ?? 0),
      factors: Array.isArray(record.factors)
        ? (record.factors as Array<Record<string, unknown>>).map((item) => ({
            factor: asString(item.factor, ''),
            impact: Number(item.impact ?? 0),
            description: asString(item.description, ''),
          }))
        : [],
      recommendations: Array.isArray(record.recommendations) ? (record.recommendations as string[]) : [],
      created_at: asString(record.created_at, new Date().toISOString()),
    };
  },

  getRecommendations: async (): Promise<MarketRecommendation[]> => {
    const response = await request<unknown>({
      url: `${MARKET_BASE}/recommendations`,
      method: 'GET',
    });

    return asArray<Record<string, unknown>>(response).map((recommendation) => ({
      id: asString(recommendation.id),
      type: asString(recommendation.type, 'PRICING'),
      priority: asString(recommendation.priority, 'MEDIUM'),
      title: asString(recommendation.title, ''),
      description: asString(recommendation.description, ''),
      expected_impact: asString(recommendation.expected_impact, ''),
      effort_required: asString(recommendation.effort_required, 'MEDIUM'),
      due_date: recommendation.due_date ? String(recommendation.due_date) : null,
      status: asString(recommendation.status, 'PENDING'),
      created_at: asString(recommendation.created_at, new Date().toISOString()),
    }));
  },
};
