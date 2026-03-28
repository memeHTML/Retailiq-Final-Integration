/**
 * src/router.tsx
 * Oracle Document sections consumed: 2, 7, 8, 9, 10, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate, Outlet, useParams } from 'react-router-dom';
import { routes } from '@/routes/routes';
import { AuthGuard, PublicOnlyGuard, RoleGuard } from '@/utils/guards';
import { AppShell } from '@/components/layout/AppShell';
import {
  AiAssistantPage,
  AiToolsPage,
  AnalyticsPage,
  ApiValidationPage,
  ChainPage,
  CreditPage,
  CustomerDetailPage,
  CustomerAnalyticsPage,
  CustomersPage,
  AlertsPage,
  DashboardPage,
  CalendarPage,
  DecisionsPage,
  DeveloperPage,
  EInvoicingPage,
  EventsPage,
  FinancePage,
  FinanceAccountsPage,
  FinanceCreditScorePage,
  FinanceKycPage,
  FinanceLedgerPage,
  FinanceLoansPage,
  FinanceTreasuryPage,
  ForbiddenPage,
  ForecastingPage,
  ForgotPasswordPage,
  GstPage,
  I18nPage,
  InventoryDetailPage,
  InventoryFormPage,
  InventoryPage,
  InventorySyncPage,
  KycPage,
  LoginPage,
  LoyaltyPage,
  MarketplacePage,
  MarketIntelligencePage,
  MfaSetupPage,
  MfaVerifyPage,
  NotFoundPage,
  OfflinePage,
  SecurityPage,
  PosPage,
  PricingPage,
  PurchaseOrderCreatePage,
  PurchaseOrderDetailPage,
  PurchaseOrderEditPage,
  PurchaseOrdersPage,
  ReceiptsQueuePage,
  ReceiptsTemplatePage,
  RegisterPage,
  ResetPasswordPage,
  ReportsPage,
  ServerErrorPage,
  StaffPerformanceDetailPage,
  StaffPerformancePage,
  StockAuditPage,
  StoreCategoriesPage,
  StoreProfilePage,
  StoreTaxConfigPage,
  SupplierDetailPage,
  SupplierPage,
  TransactionDetailPage,
  TransactionsPage,
  VerifyOtpPage,
  VisionOcrReviewPage,
  VisionOcrUploadPage,
  WhatsAppPage,
} from './router-pages';

const suspense = (element: ReactNode) => (
  <Suspense fallback={<div className="app-content">Loading…</div>}>{element}</Suspense>
);

function LegacyTransactionRedirect() {
  const params = useParams();
  return <Navigate to={params.id ? `/orders/transactions/${params.id}` : '/orders/transactions'} replace />;
}

function LegacyAiRedirect() {
  return <Navigate to={routes.ai} replace />;
}

function LegacyAiToolsRedirect() {
  return <Navigate to={routes.aiTools} replace />;
}

function LegacyDecisionsRedirect() {
  return <Navigate to={routes.decisions} replace />;
}

export const appRoutes = [
  {
    element: <Outlet />,
    children: [
      {
        element: <PublicOnlyGuard />,
        children: [
          { path: '/login', element: suspense(<LoginPage />) },
          { path: '/auth/login', element: suspense(<LoginPage />) },
          { path: '/register', element: suspense(<RegisterPage />) },
          { path: '/auth/register', element: suspense(<RegisterPage />) },
          { path: '/verify-otp', element: suspense(<VerifyOtpPage />) },
          { path: '/auth/otp', element: suspense(<VerifyOtpPage />) },
          { path: '/mfa-setup', element: suspense(<MfaSetupPage />) },
          { path: '/mfa-verify', element: suspense(<MfaVerifyPage />) },
          { path: '/forgot-password', element: suspense(<ForgotPasswordPage />) },
          { path: '/reset-password', element: suspense(<ResetPasswordPage />) },
        ],
      },
      {
        element: <AuthGuard />,
        children: [
          {
            element: <AppShell />,
            children: [
              { path: '/', element: <Navigate to="/dashboard" replace /> },
              { path: '/orders', element: <Navigate to="/orders/pos" replace /> },
              { path: '/pos', element: <Navigate to="/orders/pos" replace /> },
              { path: '/transactions', element: <Navigate to="/orders/transactions" replace /> },
              { path: '/transactions/:id', element: suspense(<LegacyTransactionRedirect />) },
              { path: '/orders/pos', element: suspense(<PosPage />) },
              { path: '/orders/transactions', element: suspense(<TransactionsPage />) },
              { path: '/orders/transactions/:uuid', element: suspense(<TransactionDetailPage />) },
              { path: '/dashboard', element: suspense(<DashboardPage />) },
              { path: '/dashboard/alerts', element: suspense(<AlertsPage />) },
              { path: '/dashboard/calendar', element: suspense(<CalendarPage />) },
              { path: '/dashboard/reports', element: suspense(<ReportsPage />) },
              { path: '/alerts', element: <Navigate to="/dashboard/alerts" replace /> },
              { path: '/financial-calendar', element: <Navigate to="/dashboard/calendar" replace /> },
              { path: '/reports', element: <Navigate to="/dashboard/reports" replace /> },
              { path: '/inventory', element: suspense(<InventoryPage />) },
              { path: '/inventory/new', element: suspense(<RoleGuard role="owner"><InventoryFormPage /></RoleGuard>) },
              { path: '/inventory/sync', element: suspense(<InventorySyncPage />) },
              { path: '/inventory/stock-audit', element: suspense(<RoleGuard role="owner"><StockAuditPage /></RoleGuard>) },
              { path: '/inventory/:productId/edit', element: suspense(<RoleGuard role="owner"><InventoryFormPage /></RoleGuard>) },
              { path: '/inventory/:productId', element: suspense(<InventoryDetailPage />) },
              { path: routes.settingsProfile, element: suspense(<StoreProfilePage />) },
              { path: routes.settingsCategories, element: suspense(<RoleGuard role="owner"><StoreCategoriesPage /></RoleGuard>) },
              { path: routes.settingsTax, element: suspense(<RoleGuard role="owner"><StoreTaxConfigPage /></RoleGuard>) },
              { path: routes.settingsSecurity, element: suspense(<SecurityPage />) },
              { path: routes.legacyStoreProfile, element: <Navigate to={routes.settingsProfile} replace /> },
              { path: routes.legacyStoreCategories, element: <Navigate to={routes.settingsCategories} replace /> },
              { path: routes.legacyStoreTaxConfig, element: <Navigate to={routes.settingsTax} replace /> },
              { path: routes.legacySecurity, element: <Navigate to={routes.settingsSecurity} replace /> },
              { path: '/suppliers', element: suspense(<SupplierPage />) },
              { path: '/suppliers/:id', element: suspense(<SupplierDetailPage />) },
              { path: '/purchase-orders', element: suspense(<PurchaseOrdersPage />) },
              { path: '/purchase-orders/create', element: suspense(<PurchaseOrderCreatePage />) },
              { path: '/purchase-orders/:id', element: suspense(<PurchaseOrderDetailPage />) },
              { path: '/purchase-orders/:id/edit', element: suspense(<PurchaseOrderEditPage />) },
              { path: '/receipts/template', element: suspense(<ReceiptsTemplatePage />) },
              { path: '/receipts/queue', element: suspense(<ReceiptsQueuePage />) },
              { path: '/vision/ocr', element: suspense(<VisionOcrUploadPage />) },
              { path: '/vision/ocr/:jobId', element: suspense(<VisionOcrReviewPage />) },
              { path: '/kyc', element: suspense(<KycPage />) },
              { path: '/developer', element: suspense(<DeveloperPage />) },
              { path: '/api-validation', element: suspense(<ApiValidationPage />) },
              { path: '/customers', element: suspense(<CustomersPage />) },
              { path: '/customers/analytics', element: suspense(<CustomerAnalyticsPage />) },
              { path: '/customers/:customerId', element: suspense(<CustomerDetailPage />) },
              { path: '/staff-performance', element: suspense(<StaffPerformancePage />) },
              { path: '/staff-performance/:userId', element: suspense(<RoleGuard role="owner"><StaffPerformanceDetailPage /></RoleGuard>) },
              { path: '/pricing', element: suspense(<RoleGuard role="owner"><PricingPage /></RoleGuard>) },
              { path: routes.decisions, element: suspense(<RoleGuard role="owner"><DecisionsPage /></RoleGuard>) },
              { path: '/e-invoicing', element: suspense(<EInvoicingPage />) },
              { path: routes.ai, element: suspense(<AiAssistantPage />) },
              { path: routes.aiTools, element: suspense(<AiToolsPage />) },
              { path: routes.legacyAiAssistant, element: suspense(<LegacyAiRedirect />) },
              { path: routes.legacyAiTools, element: suspense(<LegacyAiToolsRedirect />) },
              { path: routes.legacyDecisions, element: suspense(<LegacyDecisionsRedirect />) },
              { path: '/offline', element: suspense(<OfflinePage />) },
              { path: '/marketplace', element: suspense(<MarketplacePage />) },
              { path: '/chain', element: suspense(<ChainPage />) },
              { path: '/whatsapp', element: suspense(<WhatsAppPage />) },
              { path: '/i18n', element: suspense(<I18nPage />) },
              { path: '/analytics', element: suspense(<RoleGuard role="owner"><AnalyticsPage /></RoleGuard>) },
              { path: '/market-intelligence', element: suspense(<RoleGuard role="owner"><MarketIntelligencePage /></RoleGuard>) },
              { path: '/events', element: suspense(<EventsPage />) },
              { path: '/gst', element: suspense(<RoleGuard role="owner"><GstPage /></RoleGuard>) },
              { path: '/loyalty', element: suspense(<LoyaltyPage />) },
              { path: '/credit', element: suspense(<CreditPage />) },
              { path: '/forecasting', element: suspense(<RoleGuard role="owner"><ForecastingPage /></RoleGuard>) },
              { path: '/finance', element: suspense(<FinancePage />) },
              { path: '/finance/accounts', element: suspense(<RoleGuard role="owner"><FinanceAccountsPage /></RoleGuard>) },
              { path: '/finance/credit-score', element: suspense(<RoleGuard role="owner"><FinanceCreditScorePage /></RoleGuard>) },
              { path: '/finance/kyc', element: suspense(<RoleGuard role="owner"><FinanceKycPage /></RoleGuard>) },
              { path: '/finance/ledger', element: suspense(<RoleGuard role="owner"><FinanceLedgerPage /></RoleGuard>) },
              { path: '/finance/treasury', element: suspense(<RoleGuard role="owner"><FinanceTreasuryPage /></RoleGuard>) },
              { path: '/finance/loans', element: suspense(<RoleGuard role="owner"><FinanceLoansPage /></RoleGuard>) },
              { path: '/403', element: suspense(<ForbiddenPage />) },
              { path: '/500', element: suspense(<ServerErrorPage />) },
              { path: '*', element: suspense(<NotFoundPage />) },
            ],
          },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(appRoutes);
