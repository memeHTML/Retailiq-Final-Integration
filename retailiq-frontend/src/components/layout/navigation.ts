import type { ComponentType } from 'react';
import {
  BarChart3,
  Barcode,
  Boxes,
  BrainCircuit,
  Building2,
  CalendarClock,
  CircleDollarSign,
  CreditCard,
  FileText,
  FolderKanban,
  Globe2,
  LayoutDashboard,
  Megaphone,
  ReceiptText,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  Users,
  Webhook,
  Wrench,
  Zap,
} from 'lucide-react';
import { routes } from '@/routes/routes';

export type ShellRole = 'owner' | 'staff' | null;

export type ShellNavItem = {
  label: string;
  description: string;
  to: string;
  icon: ComponentType<{ className?: string }>;
  ownerOnly?: boolean;
};

export type ShellNavGroup = {
  title: string;
  items: ShellNavItem[];
};

const shellNavGroups: ShellNavGroup[] = [
  {
    title: 'Dashboard',
    items: [
      { label: 'Overview', description: 'Store KPIs and summary cards', to: routes.dashboard, icon: LayoutDashboard },
      { label: 'Smart Alerts', description: 'Critical store alerts', to: routes.smartAlerts, icon: Sparkles },
      { label: 'Reports', description: 'Operational and financial reporting', to: routes.reports, icon: FileText },
      { label: 'Financial Calendar', description: 'Upcoming finance dates and events', to: routes.financialCalendar, icon: CalendarClock },
    ],
  },
  {
    title: 'Orders',
    items: [
      { label: 'Orders Hub', description: 'Orders hub overview', to: routes.orders, icon: ShoppingCart },
      { label: 'Omnichannel', description: 'Marketplace and WhatsApp hub', to: routes.omnichannel, icon: Megaphone },
      { label: 'POS / New Sale', description: 'Create a new sale', to: routes.ordersPos, icon: ShoppingCart },
      { label: 'Transactions', description: 'Sales history and returns', to: routes.ordersTransactions, icon: FileText },
      { label: 'Returns', description: 'Return and refund operations', to: routes.returns, icon: RotateCcw },
      { label: 'Purchase Orders', description: 'Drafts, receiving, and PDF export', to: routes.purchaseOrders, icon: FolderKanban },
      { label: 'Suppliers', description: 'Supplier records and links', to: routes.suppliers, icon: Store },
      { label: 'Marketplace', description: 'Catalog, orders, and procurement', to: routes.marketplace, icon: Building2 },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { label: 'Products', description: 'Product catalogue and inventory levels', to: routes.inventory, icon: Boxes },
      { label: 'Stock Audit', description: 'Counted stock reconciliation', to: routes.stockAudit, icon: ShieldCheck },
      { label: 'Inventory Sync', description: 'Offline snapshot and batch sync', to: routes.inventorySync, icon: RotateCcw },
      { label: 'Receipts & Barcodes', description: 'Receipt templates and print jobs', to: routes.inventoryReceipts, icon: ReceiptText },
      { label: 'Barcodes', description: 'Barcode lookup and registration', to: routes.inventoryBarcodes, icon: Barcode },
      { label: 'Vision OCR', description: 'OCR upload and review', to: routes.inventoryVision, icon: ScanLine },
      { label: 'Pricing', description: 'Pricing suggestions and rules', to: routes.pricing, icon: CircleDollarSign, ownerOnly: true },
      { label: 'Forecasting', description: 'Demand forecasting and planning', to: routes.forecasting, icon: BarChart3, ownerOnly: true },
    ],
  },
  {
    title: 'Customers',
    items: [
      { label: 'All Customers', description: 'Customer records and history', to: routes.customers, icon: Users },
      { label: 'Loyalty', description: 'Rewards program and tiers', to: routes.loyalty, icon: Sparkles },
      { label: 'Credit', description: 'Customer credit accounts', to: routes.credit, icon: CreditCard },
      { label: 'WhatsApp', description: 'Messaging and campaigns', to: routes.whatsapp, icon: Webhook },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { label: 'Business Analytics', description: 'Owner-level analytics dashboard', to: routes.analytics, icon: BarChart3, ownerOnly: true },
      { label: 'Market Intelligence', description: 'Competitor and pricing signals', to: routes.marketIntelligence, icon: Megaphone, ownerOnly: true },
      { label: 'Decisions', description: 'AI-generated recommendations', to: routes.decisions, icon: BrainCircuit, ownerOnly: true },
      { label: 'Staff Performance', description: 'Team revenue and targets', to: routes.staff, icon: Users },
      { label: 'Offline Data', description: 'Offline sync snapshots', to: routes.offline, icon: Globe2 },
    ],
  },
  {
    title: 'Financials',
    items: [
      { label: 'Finance Dashboard', description: 'Owner finance overview', to: routes.finance, icon: CircleDollarSign, ownerOnly: true },
      { label: 'Accounts', description: 'Financial account list', to: routes.financeAccounts, icon: Building2, ownerOnly: true },
      { label: 'Credit Score', description: 'Merchant credit score', to: routes.financeCreditScore, icon: ShieldCheck, ownerOnly: true },
      { label: 'Finance KYC', description: 'Compliance status', to: routes.financeKyc, icon: ShieldCheck, ownerOnly: true },
      { label: 'Ledger', description: 'Ledger entries and balances', to: routes.financeLedger, icon: FileText, ownerOnly: true },
      { label: 'Treasury', description: 'Treasury config and transfers', to: routes.financeTreasury, icon: Store, ownerOnly: true },
      { label: 'Loans', description: 'Loan products and applications', to: routes.financeLoans, icon: FolderKanban, ownerOnly: true },
      { label: 'GST / Tax', description: 'Tax configuration and filings', to: routes.financeGst, icon: FileText, ownerOnly: true },
      { label: 'E-Invoicing', description: 'Invoice compliance and status', to: routes.financeEinvoice, icon: ReceiptText, ownerOnly: true },
    ],
  },
  {
    title: 'AI Assistant',
    items: [
      { label: 'Chat', description: 'Ask the assistant', to: routes.ai, icon: LayoutDashboard },
      { label: 'AI Tools', description: 'Forecasting, vision, and recommendations', to: routes.aiTools, icon: BrainCircuit },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Chain Management', description: 'Multi-store groups and transfers', to: routes.chain, icon: Store },
      { label: 'Operations', description: 'Operational workflows and controls', to: routes.operations, icon: Building2 },
      { label: 'Developer Platform', description: 'API keys, webhooks, usage, and logs', to: routes.developer, icon: Zap },
      { label: 'KYC', description: 'Provider verification and status', to: routes.kyc, icon: ShieldCheck },
      { label: 'Team', description: 'Team connectivity checks', to: routes.team, icon: Users },
      { label: 'Maintenance', description: 'System status and incidents', to: routes.ops, icon: Wrench },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'Store Profile', description: 'Business profile and store details', to: routes.settingsProfile, icon: Store, ownerOnly: true },
      { label: 'Store Categories', description: 'Category management', to: routes.settingsCategories, icon: Boxes, ownerOnly: true },
      { label: 'Tax Config', description: 'Store tax rules', to: routes.settingsTax, icon: FileText, ownerOnly: true },
      { label: 'Security / MFA', description: 'Password and authenticator settings', to: routes.settingsSecurity, icon: ShieldCheck },
      { label: 'Language / i18n', description: 'Internationalization, translations, currencies, and countries', to: routes.settingsI18n, icon: Globe2 },
    ],
  },
];

const titleMatchers: Array<{ pattern: string; title: string }> = [
  { pattern: routes.dashboardAlerts, title: 'Smart Alerts' },
  { pattern: routes.dashboardCalendar, title: 'Financial Calendar' },
  { pattern: routes.dashboardReports, title: 'Reports' },
  { pattern: routes.ordersPos, title: 'Point of sale' },
  { pattern: routes.ordersTransactions, title: 'Transactions' },
  { pattern: routes.orderTransactionDetail, title: 'Transactions' },
  { pattern: routes.settingsProfile, title: 'Store Profile' },
  { pattern: routes.settingsCategories, title: 'Store Categories' },
  { pattern: routes.settingsTax, title: 'Tax Config' },
  { pattern: routes.settingsSecurity, title: 'Security / MFA' },
  { pattern: routes.settingsI18n, title: 'Internationalization' },
  { pattern: routes.storeCategories, title: 'Store Categories' },
  { pattern: routes.storeTaxConfig, title: 'Tax Config' },
  { pattern: routes.storeProfile, title: 'Store Profile' },
  { pattern: routes.inventorySync, title: 'Inventory Sync' },
  { pattern: routes.inventoryVisionReview, title: 'Vision OCR' },
  { pattern: routes.inventoryVision, title: 'Vision OCR' },
  { pattern: routes.inventoryBarcodes, title: 'Barcodes' },
  { pattern: routes.inventoryReceipts, title: 'Receipts' },
  { pattern: routes.stockAudit, title: 'Stock Audit' },
  { pattern: routes.inventory, title: 'Inventory' },
  { pattern: routes.purchaseOrderEdit, title: 'Purchase Orders' },
  { pattern: routes.purchaseOrderCreate, title: 'Purchase Orders' },
  { pattern: routes.purchaseOrderDetail, title: 'Purchase Orders' },
  { pattern: routes.purchaseOrders, title: 'Purchase Orders' },
  { pattern: routes.marketplace, title: 'Marketplace' },
  { pattern: routes.orders, title: 'Orders' },
  { pattern: routes.omnichannel, title: 'Omnichannel' },
  { pattern: routes.chain, title: 'Chain Management' },
  { pattern: routes.transactions, title: 'Transactions' },
  { pattern: routes.returns, title: 'Returns' },
  { pattern: routes.customersAnalytics, title: 'Customer Analytics' },
  { pattern: routes.customers, title: 'Customers' },
  { pattern: routes.staffDetail, title: 'Staff Performance' },
  { pattern: routes.staff, title: 'Staff Performance' },
  { pattern: routes.analyticsStaff, title: 'Staff Performance' },
  { pattern: routes.analyticsForecasting, title: 'Forecasting' },
  { pattern: routes.analyticsMarket, title: 'Market Intelligence' },
  { pattern: routes.marketIntelligence, title: 'Market Intelligence' },
  { pattern: routes.offline, title: 'Offline Data' },
  { pattern: routes.analyticsOffline, title: 'Offline Data' },
  { pattern: routes.financeAccounts, title: 'Accounts' },
  { pattern: routes.financeCreditScore, title: 'Credit Score' },
  { pattern: routes.financeKyc, title: 'Finance KYC' },
  { pattern: routes.financeLedger, title: 'Ledger' },
  { pattern: routes.financeTreasury, title: 'Treasury' },
  { pattern: routes.financeLoans, title: 'Loans' },
  { pattern: routes.financeEinvoice, title: 'E-Invoicing' },
  { pattern: routes.financeGst, title: 'GST / Tax' },
  { pattern: routes.finance, title: 'Financials' },
  { pattern: routes.aiTools, title: 'AI Tools' },
  { pattern: routes.aiDecisions, title: 'Decisions' },
  { pattern: routes.decisions, title: 'Decisions' },
  { pattern: routes.pricing, title: 'Pricing' },
  { pattern: routes.forecasting, title: 'Forecasting' },
  { pattern: routes.developer, title: 'Developer' },
  { pattern: routes.kyc, title: 'KYC' },
  { pattern: routes.team, title: 'Team' },
  { pattern: routes.ops, title: 'Maintenance' },
  { pattern: routes.operations, title: 'Operations' },
  { pattern: routes.smartAlerts, title: 'Smart Alerts' },
  { pattern: routes.reports, title: 'Reports' },
  { pattern: routes.financialCalendar, title: 'Financial Calendar' },
  { pattern: routes.dashboard, title: 'Dashboard' },
  { pattern: routes.pos, title: 'POS / New Sale' },
  { pattern: routes.offline, title: 'Offline Data' },
  { pattern: routes.analytics, title: 'Analytics' },
  { pattern: routes.ai, title: 'AI Assistant' },
  { pattern: routes.legacyAiAssistant, title: 'AI Assistant' },
  { pattern: routes.legacyAiTools, title: 'AI Tools' },
  { pattern: routes.legacyDecisions, title: 'Decisions' },
];

const aliasToCanonicalPath: Record<string, string> = {
  [routes.dashboardAlerts]: routes.smartAlerts,
  [routes.dashboardCalendar]: routes.financialCalendar,
  [routes.dashboardReports]: routes.reports,
  [routes.pos]: routes.ordersPos,
  [routes.transactions]: routes.ordersTransactions,
  [routes.transactionDetail]: routes.orderTransactionDetail,
  [routes.storeProfile]: routes.settingsProfile,
  [routes.storeCategories]: routes.settingsCategories,
  [routes.storeTaxConfig]: routes.settingsTax,
  [routes.legacySecurity]: routes.settingsSecurity,
  [routes.analyticsForecasting]: routes.forecasting,
  [routes.analyticsOffline]: routes.offline,
  [routes.analyticsMarket]: routes.marketIntelligence,
  [routes.inventorySync]: routes.inventorySync,
  [routes.legacyAiAssistant]: routes.ai,
  [routes.legacyAiTools]: routes.aiTools,
  [routes.legacyDecisions]: routes.decisions,
  [routes.developerLegacy]: routes.developer,
  [routes.kycLegacy]: routes.kyc,
  [routes.teamLegacy]: routes.team,
  [routes.opsLegacy]: routes.ops,
  [routes.i18n]: routes.settingsI18n,
  [routes.events]: routes.financialCalendar,
  [routes.analyticsStaff]: routes.staff,
  [routes.inventoryPricing]: routes.pricing,
  [routes.aiDecisions]: routes.decisions,
  [routes.marketplaceLegacy]: routes.marketplace,
  [routes.chainLegacy]: routes.chain,
  [routes.gst]: routes.financeGst,
  [routes.einvoice]: routes.financeEinvoice,
  [routes.security]: routes.settingsSecurity,
};

const normalizePath = (pathname: string) => {
  const [pathOnly] = pathname.split(/[?#]/);
  return pathOnly || '/';
};

const stripTrailingSlash = (pathname: string) => (pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname);

const splitSegments = (pathname: string) => stripTrailingSlash(normalizePath(pathname)).split('/').filter(Boolean);

const matchesPattern = (pathname: string, pattern: string) => {
  const pathSegments = splitSegments(pathname);
  const patternSegments = splitSegments(pattern);

  if (patternSegments.length === 0) {
    return false;
  }

  if (patternSegments.length > pathSegments.length) {
    return false;
  }

  return patternSegments.every((segment, index) => {
    if (segment === '*') {
      return true;
    }

    if (segment.startsWith(':')) {
      return Boolean(pathSegments[index]);
    }

    return segment === pathSegments[index];
  });
};

const rankedTitleMatchers = [...titleMatchers].sort(
  (left, right) => right.pattern.split('/').filter(Boolean).length - left.pattern.split('/').filter(Boolean).length,
);

export function canonicalizePathname(pathname: string) {
  const normalized = normalizePath(pathname);
  return aliasToCanonicalPath[normalized] ?? normalized;
}

export function resolvePageTitle(pathname: string) {
  const canonicalPath = canonicalizePathname(pathname);
  const match = rankedTitleMatchers.find((item) => matchesPattern(canonicalPath, item.pattern));
  return match?.title ?? 'RetailIQ';
}

export function resolveBreadcrumbs(pathname: string) {
  const title = resolvePageTitle(pathname);
  const canonicalPath = canonicalizePathname(pathname);
  const breadcrumbs: Array<{ label: string; to: string }> = [{ label: 'RetailIQ', to: routes.dashboard }];

  if (canonicalPath !== routes.dashboard) {
    breadcrumbs.push({ label: title, to: canonicalPath });
  }

  return breadcrumbs;
}

export function sidebarNavGroups(role: ShellRole) {
  return shellNavGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.ownerOnly || role === 'owner'),
  }));
}

export function flattenedNavItems(role: ShellRole) {
  return sidebarNavGroups(role).flatMap((group) => group.items);
}

export function primaryMobileNavItems(role: ShellRole) {
  const items = flattenedNavItems(role);
  const primaryPaths = [routes.dashboard, routes.orders, routes.inventory, routes.ordersPos, routes.customers, routes.analytics];

  return primaryPaths
    .map((path) => items.find((item) => item.to === path))
    .filter((item): item is ShellNavItem => Boolean(item));
}

export function canonicalNavItemForPath(pathname: string, role: ShellRole) {
  const canonicalPath = canonicalizePathname(pathname);
  return flattenedNavItems(role).find((item) => item.to === canonicalPath) ?? null;
}
