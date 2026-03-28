/**
 * src/types/models.ts
 * Oracle Document sections consumed: 2, 4, 5, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
export type UserRole = 'owner' | 'staff';
export type ChainRole = 'CHAIN_OWNER';
export type PaymentMode = 'CASH' | 'UPI' | 'CARD' | 'CREDIT';
export type ProductUom = 'pieces' | 'kg' | 'litre' | 'pack';
export type EventType = 'HOLIDAY' | 'FESTIVAL' | 'PROMOTION' | 'SALE_DAY' | 'CLOSURE';
export type PurchaseOrderStatus = 'DRAFT' | 'SENT' | 'FULFILLED' | 'CANCELLED';
export type OcrJobStatus = 'QUEUED' | 'PROCESSING' | 'REVIEW' | 'FAILED' | 'APPLIED' | 'COMPLETED';
export type PrintJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type LoyaltyTransactionType = 'EARN' | 'REDEEM' | 'EXPIRE' | 'ADJUST';
export type CreditTransactionType = 'CREDIT' | 'DEBIT' | 'ADJUST';

export interface CurrentUser {
  user_id: number;
  mobile_number?: string;
  full_name?: string;
  email?: string;
  role: UserRole | null;
  store_id: number | null;
  chain_group_id?: string | null;
  chain_role?: ChainRole | null;
  is_active?: boolean;
  mfa_enabled?: boolean;
  failed_login_attempts?: number;
  locked_until?: string | null;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  user_id: number;
  role: UserRole | null;
  store_id: number | null;
}

export interface StoreProfile {
  store_id: number;
  owner_user_id: number;
  store_name: string;
  store_type: string | null;
  city: string | null;
  state: string | null;
  gst_number: string | null;
  currency_symbol: string | null;
  working_days: string[];
  opening_time: string | null;
  closing_time: string | null;
  timezone: string | null;
}

export interface Category {
  category_id: number;
  store_id: number;
  name: string;
  color_tag: string | null;
  is_active: boolean;
  gst_rate: number | null;
}

export interface Product {
  product_id: number;
  store_id: number;
  category_id: number | null;
  name: string;
  sku_code: string;
  uom: ProductUom | null;
  cost_price: number;
  selling_price: number;
  current_stock: number;
  reorder_level: number | null;
  supplier_name: string | null;
  barcode: string | null;
  image_url: string | null;
  description?: string | null;
  is_active: boolean;
  lead_time_days: number | null;
  hsn_code: string | null;
}

export interface TransactionLineItem {
  product_id: number;
  quantity: number;
  selling_price: number;
  discount_amount?: number | null;
  product_name?: string | null;
}

export interface TransactionSummaryRow {
  transaction_id: string;
  created_at: string;
  payment_mode: PaymentMode;
  customer_id: number | null;
  is_return: boolean;
}

export interface TransactionDetail extends TransactionSummaryRow {
  notes: string | null;
  original_transaction_id: string | null;
  line_items: TransactionLineItem[];
}

export interface ReceiptTemplate {
  id: number | null;
  store_id: number;
  header_text: string | null;
  footer_text: string | null;
  show_gstin: boolean;
  paper_width_mm: number | null;
  updated_at: string | null;
}

export interface PrintJob {
  job_id: number;
  store_id: number;
  transaction_id: string | null;
  job_type: string;
  status: PrintJobStatus;
  created_at: string;
  completed_at: string | null;
}

export interface OcrJobItem {
  item_id: string;
  raw_text: string;
  matched_product_id: number | null;
  product_name: string | null;
  confidence: number;
  quantity: number | null;
  unit_price: number | null;
  is_confirmed: boolean;
}

export interface OcrJob {
  job_id: string;
  status: OcrJobStatus;
  error_message: string | null;
  items: OcrJobItem[];
}

export interface KycProvider {
  code: string;
  name: string;
  type: string;
  id_label: string;
  required_fields: string[];
  is_mandatory: boolean;
}

export interface KycRecord {
  provider_name: string;
  status: string;
  country_code: string;
  verified_at: string | null;
}

export interface Supplier {
  id: number;
  store_id: number;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  gst_number: string | null;
  is_active: boolean;
  created_at?: string | null;
  analytics?: Record<string, unknown> | null;
  sourced_products?: unknown[];
  recent_purchase_orders?: unknown[];
}

export interface PurchaseOrderItem {
  product_id: number;
  quantity: number;
  unit_cost: number;
  received_quantity?: number | null;
}

export interface PurchaseOrder {
  id: number;
  order_number: string;
  supplier_id: number;
  status: PurchaseOrderStatus;
  subtotal: number;
  tax: number;
  shipping_cost: number;
  total: number;
  payment_status: string | null;
  financed: boolean;
  loan_id: number | null;
  created_at: string;
  expected_delivery: string | null;
  shipping_tracking: string | null;
  items: PurchaseOrderItem[];
}

export interface StoreTaxRate {
  category_id: number;
  name: string;
  gst_rate: number;
}

export interface StoreTaxConfig {
  taxes: StoreTaxRate[];
}

export interface LoyaltyProgram {
  points_per_rupee: number;
  redemption_rate: number;
  min_redemption_points: number;
  expiry_days: number;
  is_active: boolean;
}

export interface LoyaltyTransaction {
  id: number;
  type: LoyaltyTransactionType;
  points: number;
  created_at: string;
  notes: string | null;
}

export interface CreditLedgerEntry {
  id: number;
  type: CreditTransactionType;
  amount: number;
  created_at: string;
  notes: string | null;
}

export interface ChainGroup {
  id: string;
  name: string;
  owner_user_id: number;
  group_id?: string;
}

export interface MarketSignal {
  id: string;
  topic: string;
  title: string;
  severity: string;
  acknowledged: boolean;
}

export interface EventRecord {
  id: string;
  event_name: string;
  title?: string;
  event_type: EventType;
  start_date: string;
  end_date: string;
  expected_impact_pct: number | null;
  is_recurring: boolean;
  recurrence_rule: string | null;
}

export interface Customer {
  customer_id: number;
  store_id: number;
  name: string;
  mobile_number: string;
  email: string | null;
  gender: string | null;
  birth_date: string | null;
  address: string | null;
  notes: string | null;
  created_at: string | null;
}

export interface CustomerSummary {
  total_spent: number;
  total_transactions: number;
  avg_basket_size: number;
  last_visit: string | null;
  top_categories: Array<{ category: string; amount: number }>;
}

export interface CustomerAnalytics {
  new_customers: number;
  active_customers: number;
  returning_rate: number;
}

export interface TopCustomer {
  customer_id: number;
  name: string;
  mobile_number: string;
  value: number;
}

export interface StaffSession {
  session_id: string;
  active: boolean;
  started_at?: string;
  target_revenue?: number | null;
}

export interface StaffPerformanceSummary {
  user_id: number;
  name: string;
  today_revenue: number;
  today_transaction_count: number;
  today_discount_total: number;
  avg_discount_pct: number;
  target_revenue: number | null;
  target_pct_achieved: number | null;
}

export interface StaffPerformanceHistory {
  date: string;
  revenue: number;
  transaction_count: number;
  target_revenue: number | null;
  target_pct_achieved: number | null;
}

export interface StaffPerformanceDetail {
  user_id: number;
  name: string;
  history: StaffPerformanceHistory[];
}

export interface PricingSuggestion {
  id: number;
  product_id: number;
  product_name: string;
  current_price: number;
  suggested_price: number;
  reason: string;
  confidence: number;
  margin_delta: number;
  created_at: string;
}

export interface PriceHistoryEntry {
  id: number;
  old_price: number;
  new_price: number;
  changed_at: string;
  source: string;
}

export interface PricingRules {
  min_margin_pct: number;
  max_discount_pct: number;
  competitor_match: boolean;
  auto_apply_threshold: number;
}

export interface Decision {
  id: string;
  category: string;
  title: string;
  description: string;
  impact: string;
  priority: string;
  available_actions: string[];
}

export interface DecisionsMeta {
  execution_time_ms: number;
  total_recommendations: number;
  whatsapp_enabled: boolean;
}

export interface ForecastPoint {
  date: string;
  predicted: number;
  lower_bound: number | null;
  upper_bound: number | null;
}

export interface HistoricalPoint {
  date: string;
  actual: number;
}

export interface ReorderSuggestion {
  should_reorder: boolean;
  current_stock: number;
  forecasted_demand: number;
  lead_time_days: number;
  lead_time_demand: number;
  suggested_order_qty: number;
}

export interface ForecastMeta {
  regime: string;
  model_type: string;
  confidence_tier: string;
  training_window_days: number;
  generated_at: string;
  product_id?: number;
  product_name?: string;
  reorder_suggestion?: ReorderSuggestion;
}

export type EInvoiceStatus = 'DRAFT' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED';

export interface EInvoice {
  invoice_id: string;
  transaction_id: string;
  country_code: string;
  invoice_format: string;
  invoice_number: string | null;
  authority_ref: string | null;
  status: EInvoiceStatus;
  qr_code_url: string | null;
  submitted_at: string | null;
}

export interface MarketplaceCatalogItem {
  id: string;
  name: string;
  category: string;
  price: number;
  supplier_name: string;
  rating: number;
  image_url: string | null;
}

export interface MarketplaceRfq {
  id: string;
  product_name: string;
  quantity: number;
  status: string;
  created_at: string;
  responses: number;
}

export interface MarketplaceOrder {
  id: string;
  order_number: string;
  status: string;
  total: number;
  supplier_name: string;
  created_at: string;
  items: Array<{ product_name: string; quantity: number; unit_price: number }>;
}

export interface MarketplaceTracking {
  order_id: string;
  status: string;
  events: Array<{ timestamp: string; status: string; location: string; description: string }>;
}

export interface NlpResponse {
  intent: string;
  headline: string;
  detail: string;
  action: string;
  supporting_metrics: Record<string, unknown>;
}

export interface AiRecommendation {
  product_id: number;
  product_name: string;
  reason: string;
  score: number;
}

export interface DashboardOverview {
  sales: number;
  sales_delta: string;
  sales_sparkline: SparklineData;
  gross_margin: number;
  gross_margin_delta: string;
  gross_margin_sparkline: SparklineData;
  inventory_at_risk: number;
  inventory_at_risk_delta: string;
  inventory_at_risk_sparkline: SparklineData;
  outstanding_pos: number;
  outstanding_pos_delta: string;
  outstanding_pos_sparkline: SparklineData;
  loyalty_redemptions: number;
  loyalty_redemptions_delta: string;
  loyalty_redemptions_sparkline: SparklineData;
  online_orders: number;
  online_orders_delta: string;
  online_orders_sparkline: SparklineData;
  last_updated: string;
}

export interface SparklineData {
  metric: string;
  points: Array<{ timestamp: string; value: number }>;
}

export interface DashboardAlert {
  id: string;
  type: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  timestamp: string;
  source: string;
  acknowledged: boolean;
  resolved: boolean;
}

export interface DashboardSignal {
  id: string;
  sku: string;
  product_name: string;
  delta: string;
  region: string;
  insight: string;
  recommendation: string;
  timestamp: string;
}

export interface DashboardIncident {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  impacted_services: string[];
  created_at: string;
  updated_at: string;
  estimated_resolution: string;
}

export interface InventoryAlert {
  alert_id: number;
  alert_type: string;
  priority: string;
  product_id: number | null;
  message: string;
  created_at: string | null;
}

export interface OfflineSnapshot {
  built_at: string | null;
  size_bytes: number;
  snapshot: Record<string, unknown>;
}

export interface CreditAccount {
  customer_id: number;
  customer_name: string;
  balance: number;
  credit_limit: number;
  status: string;
  last_transaction_at: string | null;
}

export interface CreditTransaction {
  id: number;
  type: CreditTransactionType;
  amount: number;
  balance_after: number;
  created_at: string;
  notes: string | null;
}

export interface SupportedCurrency {
  code: string;
  name: string;
  symbol: string;
  decimal_places: number;
  symbol_position: string;
}

export interface SupportedCountry {
  code: string;
  name: string;
  default_currency: string;
  default_locale: string;
  timezone: string;
  phone_code: string;
  date_format: string;
}
