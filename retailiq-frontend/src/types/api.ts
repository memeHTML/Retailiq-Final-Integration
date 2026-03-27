/**
 * src/types/api.ts
 * Oracle Document sections consumed: 2, 3, 4, 5, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import type {
  AiRecommendation,
  AuthTokens,
  Category,
  ChainGroup,
  CreditAccount,
  CreditTransaction,
  CurrentUser,
  Customer,
  CustomerAnalytics,
  CustomerSummary,
  DashboardAlert,
  DashboardIncident,
  DashboardOverview,
  DashboardSignal,
  Decision,
  DecisionsMeta,
  EInvoice,
  EventRecord,
  ForecastMeta,
  ForecastPoint,
  HistoricalPoint,
  KycProvider,
  KycRecord,
  LoyaltyProgram,
  MarketplaceCatalogItem,
  MarketplaceOrder,
  MarketplaceRfq,
  MarketplaceTracking,
  NlpResponse,
  OcrJob,
  OfflineSnapshot,
  PriceHistoryEntry,
  PricingRules,
  PricingSuggestion,
  PrintJob,
  Product,
  PurchaseOrder,
  ReceiptTemplate,
  StaffPerformanceDetail,
  StaffPerformanceSummary,
  StaffSession,
  StoreProfile,
  StoreTaxConfig,
  SupportedCountry,
  SupportedCurrency,
  Supplier,
  TopCustomer,
  TransactionDetail,
  TransactionLineItem,
  TransactionSummaryRow,
} from '@/types/models';

export interface ApiError {
  message: string;
  status: number | undefined;
  fields?: Record<string, string>;
  correlationId?: string;
}

export function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'message' in error && 'status' in error;
}

export interface StandardEnvelope<T> {
  success: boolean;
  data: T;
  error: { code?: string; message?: string; fields?: Record<string, string> } | null;
  meta: Record<string, unknown> | null;
  timestamp: string;
  message?: string;
}

export interface LoginRequest {
  email?: string;
  mobile_number?: string;
  password?: string;
}

export interface LoginResponse {
  access_token?: string;
  refresh_token?: string;
  user_id?: number;
  role?: CurrentUser['role'];
  store_id?: number | null;
  mfa_required?: boolean;
  message?: string;
  email?: string;
  otp_sent?: boolean;
  otp_ttl?: number;
  resend_after?: number;
  requires_otp?: boolean;
}

export interface RegisterRequest {
  mobile_number: string;
  password: string;
  full_name: string;
  store_name?: string;
  email: string;
  role?: string;
}

export interface RegisterResponse {
  message: string;
  user_id?: number;
  store_id?: number | null;
  email?: string;
}

export interface VerifyOtpRequest {
  email?: string;
  mobile_number?: string;
  otp: string;
}

export type VerifyOtpResponse = AuthTokens;

export interface ResendOtpRequest {
  email?: string;
  mobile_number?: string;
  purpose?: string;
}

export interface ResendOtpResponse {
  message: string;
  email?: string;
  contact?: string;
  otp_ttl: number;
  resend_after: number;
}

export interface ForgotPasswordRequest {
  email?: string;
  mobile_number?: string;
}

export interface ForgotPasswordResponse {
  message: string;
  token?: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export type RefreshTokenResponse = AuthTokens;

export interface LogoutRequest {
  refresh_token?: string;
}

export interface LogoutResponse {
  message: string;
}

export interface MfaSetupRequest {
  password?: string;
}

export interface MfaSetupResponse {
  secret: string;
  provisioning_uri: string;
  message: string;
}

export interface MfaVerifyRequest {
  code?: string;
  mfa_code?: string;
}

export interface MfaVerifyResponse {
  message: string;
}

export type GetStoreProfileResponse = StoreProfile;

export interface UpdateStoreProfileRequest {
  store_name?: string;
  store_type?: string | null;
  city?: string | null;
  state?: string | null;
  gst_number?: string | null;
  currency_symbol?: string | null;
  working_days?: string[];
  opening_time?: string | null;
  closing_time?: string | null;
  timezone?: string | null;
}

export type UpdateStoreProfileResponse = StoreProfile;

export interface ListCategoriesResponse {
  categories: Category[];
}

export interface CreateCategoryRequest {
  name: string;
  color_tag?: string | null;
  is_active?: boolean;
  gst_rate?: number | null;
}

export type CreateCategoryResponse = Category;

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {
  is_active?: boolean;
}

export type UpdateCategoryResponse = Category;

export interface DeleteCategoryResponse {
  message: string;
}

export type GetStoreTaxConfigResponse = StoreTaxConfig;

export interface UpdateStoreTaxConfigRequest {
  taxes: Array<{ category_id: number; gst_rate: number }>;
}

export type UpdateStoreTaxConfigResponse = StoreTaxConfig;

export interface ListProductsRequest {
  page?: number;
  page_size?: number;
  category_id?: number | string;
  is_active?: boolean;
  low_stock?: boolean;
  slow_moving?: boolean;
}

export interface ListProductsResponse {
  data: Product[];
  page: number;
  page_size: number;
  total: number;
}

export type GetProductResponse = Product;

export interface CreateProductRequest {
  name: string;
  category_id?: number | null;
  sku_code?: string | null;
  uom?: Product['uom'];
  cost_price: number;
  selling_price: number;
  current_stock?: number;
  reorder_level?: number | null;
  supplier_name?: string | null;
  barcode?: string | null;
  image_url?: string | null;
  description?: string | null;
  lead_time_days?: number | null;
  hsn_code?: string | null;
}

export type CreateProductResponse = Product;

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  is_active?: boolean;
}

export type UpdateProductResponse = Product;

export interface DeleteProductResponse {
  message: string;
}

export interface StockUpdateRequest {
  quantity_added: number;
  purchase_price: number;
  date?: string;
  supplier_name?: string | null;
  update_cost_price?: boolean;
}

export interface StockUpdateResponse {
  message: string;
  product: Product;
}

export interface StockAuditItemRequest {
  product_id: number;
  actual_qty: number;
}

export interface StockAuditRequest {
  items: StockAuditItemRequest[];
  notes?: string | null;
}

export interface StockAuditResponse {
  message: string;
  audit_id?: number;
  audit_date?: string;
  items?: Array<{
    product_id: number;
    expected_stock: number;
    actual_stock: number;
    discrepancy: number;
  }>;
}

export interface InventoryPriceHistoryEntry {
  id: number;
  cost_price: number | null;
  selling_price: number | null;
  changed_at: string | null;
  changed_by: number | null;
}

export type CreateTransactionLineItemRequest = TransactionLineItem;

export interface CreateTransactionRequest {
  transaction_id: string;
  timestamp: string;
  payment_mode: 'CASH' | 'UPI' | 'CARD' | 'CREDIT';
  customer_id?: number | null;
  notes?: string | null;
  line_items: CreateTransactionLineItemRequest[];
}

export interface CreateTransactionResponse {
  transaction_id: string;
}

export interface BatchTransactionCreateRequest {
  transactions: CreateTransactionRequest[];
}

export interface BatchTransactionCreateResponse {
  results?: Array<{ transaction_id: string; status: string; error?: string; message?: string }>;
  message?: string;
}

export interface ListTransactionsRequest {
  page?: number;
  page_size?: number;
  start_date?: string;
  end_date?: string;
  payment_mode?: 'CASH' | 'UPI' | 'CARD' | 'CREDIT';
  customer_id?: number | string;
  min_amount?: number;
  max_amount?: number;
}

export interface ListTransactionsResponse {
  data: TransactionSummaryRow[];
  page: number;
  page_size: number;
  total: number;
}

export type GetTransactionResponse = TransactionDetail;

export interface CreateTransactionReturnRequest {
  items: Array<{ product_id: number; quantity_returned: number; reason?: string }>;
}

export interface CreateTransactionReturnResponse {
  return_transaction_id: string;
}

export interface GetDailyTransactionSummaryRequest {
  date?: string;
}

export interface GetDailyTransactionSummaryResponse {
  date: string;
  total_sales: number;
  total_transactions: number;
  total_returns?: number;
  net_sales?: number;
  payment_breakdown?: Record<string, number>;
}

export type GetReceiptTemplateResponse = ReceiptTemplate;

export interface UpdateReceiptTemplateRequest {
  header_text: string | null;
  footer_text: string | null;
  show_gstin: boolean;
  paper_width_mm: number | null;
}

export type UpdateReceiptTemplateResponse = ReceiptTemplate;

export interface PrintReceiptRequest {
  transaction_id?: string | null;
  printer_mac_address?: string | null;
}

export interface PrintReceiptResponse {
  job_id: number;
}

export type GetPrintJobResponse = PrintJob;

export interface LookupBarcodeRequest {
  value: string;
}

export interface LookupBarcodeResponse {
  barcode_value: string;
  barcode_type: string;
  product_id: number;
  product_name: string;
  current_stock: number;
  price: number;
}

export interface UploadOcrRequest {
  invoice_image: File;
}

export interface UploadOcrResponse {
  job_id: string;
}

export type GetOcrJobResponse = OcrJob;

export interface ConfirmOcrItemsRequest {
  confirmed_items: Array<{
    item_id: string;
    quantity: number;
    matched_product_id: number | null;
    unit_price?: number | null;
  }>;
}

export interface ConfirmOcrItemsResponse {
  message: string;
}

export interface DismissOcrJobResponse {
  message: string;
}

export interface ShelfScanRequest {
  image_url: string;
}

export interface ShelfScanResponse {
  status?: string;
  response?: unknown;
  recommendations?: unknown;
  data?: unknown;
}

export interface ReceiptDigitizationRequest {
  receipt_image: File;
}

export interface ReceiptDigitizationResponse {
  status?: string;
  response?: unknown;
  data?: unknown;
}

export interface ListKycProvidersRequest {
  country_code?: string;
}

export interface ListKycProvidersResponse {
  providers: KycProvider[];
}

export interface VerifyKycRequest {
  provider_code: string;
  id_number: string;
  country_code?: string;
}

export interface VerifyKycResponse {
  status: string;
  details: unknown;
}

export interface ListKycStatusResponse {
  records: KycRecord[];
}

export interface ListSuppliersRequest {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ListSuppliersResponse {
  suppliers: Supplier[];
  total?: number;
  page?: number;
  pages?: number;
  meta?: Record<string, unknown>;
}

export type GetSupplierResponse = Supplier;

export interface CreateSupplierRequest {
  name: string;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  gst_number?: string | null;
}

export type CreateSupplierResponse = Supplier;

export interface UpdateSupplierRequest extends Partial<CreateSupplierRequest> {
  is_active?: boolean;
  name?: string;
}

export type UpdateSupplierResponse = Supplier;

export interface DeleteSupplierResponse {
  message: string;
}

export interface ListPurchaseOrdersRequest {
  page?: number;
  limit?: number;
  status?: string;
  supplier_id?: number | string;
}

export interface ListPurchaseOrdersResponse {
  orders: PurchaseOrder[];
  total?: number;
  page?: number;
  pages?: number;
}

export type GetPurchaseOrderResponse = PurchaseOrder;

export interface CreatePurchaseOrderRequest {
  supplier_id: number;
  items: Array<{ product_id: number; quantity: number; unit_cost: number }>;
}

export type CreatePurchaseOrderResponse = PurchaseOrder;

export interface UpdatePurchaseOrderRequest {
  status?: string;
}

export type UpdatePurchaseOrderResponse = PurchaseOrder;

export interface ConfirmPurchaseOrderResponse {
  message: string;
}

export interface GetDeveloperRegistrationResponse {
  id?: number;
  name?: string;
  email?: string;
  message?: string;
}

export interface CreateDeveloperApplicationRequest {
  name: string;
  redirect_uri: string;
  scopes: string[];
}

export interface CreateDeveloperApplicationResponse {
  client_id: string;
  client_secret?: string;
  scopes: string[];
}

export interface ListDeveloperApplicationsResponse {
  applications: Array<Record<string, unknown>>;
}

export interface GetMarketplaceResponse {
  apps: Array<Record<string, unknown>>;
  total?: number;
  page?: number;
  pages?: number;
}

export interface CreateChainGroupRequest {
  name: string;
}

export type CreateChainGroupResponse = ChainGroup;

export interface AddStoreToGroupRequest {
  group_id: string;
  store_id: number;
}

export interface AddStoreToGroupResponse {
  message: string;
}

export interface ListChainDashboardResponse {
  summary: Record<string, unknown>;
}

export interface UpdateWhatsappConfigRequest {
  access_token?: string;
  phone_number_id?: string;
  webhook_verify_token?: string;
}

export interface UpdateWhatsappConfigResponse {
  message: string;
}

export interface ListTranslationsRequest {
  locale?: string;
  module?: string;
}

export interface ListTranslationsResponse {
  translations: Array<Record<string, unknown>>;
}

export interface ListCurrenciesResponse {
  currencies: Array<Record<string, unknown>>;
}

export interface ListCountriesResponse {
  countries: Array<Record<string, unknown>>;
}

export interface GetAnalyticsResponse {
  data: Record<string, unknown>;
}

export interface GetDashboardResponse {
  data: Record<string, unknown>;
}

export interface GetMarketResponse {
  data: Record<string, unknown>;
}

export interface GetForecastResponse {
  data: Record<string, unknown>;
}

export interface GetEventsResponse {
  events: EventRecord[];
}

export type CreateEventRequest = EventRecord;

export type CreateEventResponse = EventRecord;

export type UpdateEventRequest = Partial<CreateEventRequest>;

export type UpdateEventResponse = EventRecord;

export type GetLoyaltyProgramResponse = LoyaltyProgram;

export type UpdateLoyaltyProgramRequest = LoyaltyProgram;

export type UpdateLoyaltyProgramResponse = LoyaltyProgram;

export interface GetFinanceResponse {
  data: Record<string, unknown>;
}

// ── Customers ────────────────────────────────────────────────
export interface ListCustomersRequest {
  page?: number;
  page_size?: number;
  name?: string;
  mobile?: string;
  created_after?: string;
  created_before?: string;
}

export interface ListCustomersResponse {
  data: Customer[];
  meta: { page: number; page_size: number; total: number };
}

export interface CreateCustomerRequest {
  name: string;
  mobile_number: string;
  email?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  address?: string | null;
  notes?: string | null;
}

export type CreateCustomerResponse = Customer;

export interface UpdateCustomerRequest {
  name?: string;
  mobile_number?: string;
  email?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  address?: string | null;
  notes?: string | null;
}

export type UpdateCustomerResponse = Customer;

export interface CustomerTransactionsRequest {
  page?: number;
  page_size?: number;
  date_from?: string;
  date_to?: string;
  category_id?: number;
  min_amount?: number;
  max_amount?: number;
}

export interface CustomerTransactionsResponse {
  data: Array<{ transaction_id: string; created_at: string; payment_mode: string; notes: string | null }>;
  meta: { page: number; page_size: number; total: number };
}

export type GetCustomerSummaryResponse = CustomerSummary;
export type GetCustomerAnalyticsResponse = CustomerAnalytics;

export interface TopCustomersRequest {
  metric?: 'revenue' | 'visits';
  limit?: number;
}

export type TopCustomersResponse = TopCustomer[];

// ── Dashboard ────────────────────────────────────────────────
export type GetDashboardOverviewResponse = DashboardOverview;

export interface GetDashboardAlertsResponse {
  alerts: DashboardAlert[];
  has_more: boolean;
  next_cursor: string | null;
}

export interface GetDashboardSignalsResponse {
  signals: DashboardSignal[];
  last_updated: string;
}

export interface GetDashboardForecastsResponse {
  data: Array<{
    store_id: number;
    store_name: string;
    forecast: Array<{ date: string; predicted_sales: number; confidence: number }>;
    total_predicted: number;
    accuracy: number;
  }>;
}

export type GetDashboardIncidentsResponse = DashboardIncident[];

// ── Staff Performance ────────────────────────────────────────
export type GetStaffSessionResponse = StaffSession;

export interface StartSessionResponse {
  session_id: string;
}

export interface EndSessionResponse {
  message: string;
}

export type GetAllStaffPerformanceResponse = StaffPerformanceSummary[];

export type GetStaffPerformanceDetailResponse = StaffPerformanceDetail;

export interface UpsertStaffTargetRequest {
  user_id: number;
  target_date: string;
  revenue_target?: number;
  transaction_count_target?: number;
}

export interface UpsertStaffTargetResponse {
  message: string;
}

// ── Pricing ──────────────────────────────────────────────────
export type ListPricingSuggestionsResponse = PricingSuggestion[];

export interface ApplyPricingSuggestionResponse {
  message: string;
}

export interface DismissPricingSuggestionResponse {
  message: string;
}

export type GetPriceHistoryResponse = PriceHistoryEntry[];

export type GetPricingRulesResponse = PricingRules;

export type UpdatePricingRulesRequest = PricingRules;

export type UpdatePricingRulesResponse = PricingRules;

// ── AI Decisions ─────────────────────────────────────────────
export interface GetDecisionsResponse {
  data: Decision[];
  meta: DecisionsMeta;
}

// ── Forecasting ──────────────────────────────────────────────
export interface GetStoreForecastRequest {
  horizon?: number;
}

export interface GetStoreForecastResponse {
  historical: HistoricalPoint[];
  forecast: ForecastPoint[];
  meta: ForecastMeta;
}

export interface GetSkuForecastRequest {
  horizon?: number;
}

export type GetSkuForecastResponse = GetStoreForecastResponse;

export interface GetDemandSensingResponse {
  model_type: string;
  horizon: number;
  forecast: Array<{ date: string; value: number }>;
}

// ── E-Invoicing ──────────────────────────────────────────────
export interface GenerateEInvoiceRequest {
  transaction_id: string;
  country_code?: string;
}

export interface GenerateEInvoiceResponse {
  status: string;
  invoice_id?: string;
  invoice_number?: string;
  authority_ref?: string;
  qr_code_url?: string;
}

export type GetEInvoiceStatusResponse = EInvoice;

// ── Marketplace ──────────────────────────────────────────────
export interface MarketplaceSearchRequest {
  query?: string;
  category?: string;
  page?: number;
  page_size?: number;
}

export interface MarketplaceSearchResponse {
  items: MarketplaceCatalogItem[];
  total: number;
}

export type MarketplaceRecommendationsResponse = MarketplaceCatalogItem[];

export interface CreateRfqRequest {
  product_name: string;
  quantity: number;
  specifications?: string;
}

export type CreateRfqResponse = MarketplaceRfq;
export type GetRfqResponse = MarketplaceRfq;

export interface CreateMarketplaceOrderRequest {
  items: Array<{ catalog_item_id: string; quantity: number }>;
  shipping_address?: string;
}

export type CreateMarketplaceOrderResponse = MarketplaceOrder;

export interface ListMarketplaceOrdersResponse {
  orders: MarketplaceOrder[];
  total: number;
}

export type GetMarketplaceOrderResponse = MarketplaceOrder;
export type GetMarketplaceTrackingResponse = MarketplaceTracking;

export interface SupplierOnboardRequest {
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
}

export interface SupplierOnboardResponse {
  supplier_id: string;
  status: string;
}

// ── NLP / AI ─────────────────────────────────────────────────
export interface NlpQueryRequest {
  query_text: string;
}

export type NlpQueryResponse = NlpResponse;

export interface AiAssistantQueryRequest {
  query: string;
}

export interface AiAssistantQueryResponse {
  response: string;
}

export interface AiRecommendRequest {
  user_id?: number;
}

export interface AiRecommendResponse {
  recommendations: AiRecommendation[];
}

// ── I18n ─────────────────────────────────────────────────────
export interface GetTranslationsResponse {
  locale: string;
  catalog: Record<string, string>;
}

export interface GetSupportedCurrenciesResponse {
  data: SupportedCurrency[];
}

export interface GetSupportedCountriesResponse {
  data: SupportedCountry[];
}

// ── Offline ──────────────────────────────────────────────────
export type GetOfflineSnapshotResponse = OfflineSnapshot;

// ── Credit (standalone) ──────────────────────────────────────
export type GetCreditAccountResponse = CreditAccount;

export interface ListCreditTransactionsRequest {
  page?: number;
  page_size?: number;
}

export interface ListCreditTransactionsResponse {
  data: CreditTransaction[];
  meta: { page: number; page_size: number; total: number };
}

export interface CreditRepayRequest {
  amount: number;
  notes?: string;
}

export interface CreditRepayResponse {
  message: string;
  new_balance: number;
}
