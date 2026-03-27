import type { ComponentType } from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, Boxes, BrainCircuit, Building2, ChevronLeft, ChevronRight, CircleDollarSign, CreditCard, FileText, FolderKanban, Globe2, LayoutDashboard, Laptop2, LockKeyhole, Megaphone, ReceiptText, RefreshCcw, ScanLine, Settings2, ShieldCheck, ShoppingCart, Sparkles, Store, Users, Webhook, Zap } from 'lucide-react';
import { cn } from '@/utils/cn';
import { uiStore } from '@/stores/uiStore';
import { authStore } from '@/stores/authStore';
import { routes } from '@/routes/routes';

type NavItem = {
  label: string;
  to: string;
  icon: ComponentType<{ className?: string }>;
  ownerOnly?: boolean;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    title: 'Dashboard',
    items: [
      { label: 'Overview', to: routes.dashboard, icon: LayoutDashboard },
      { label: 'Smart Alerts', to: routes.dashboardAlerts, icon: Sparkles },
      { label: 'Reports', to: routes.dashboardReports, icon: FileText },
      { label: 'Financial Calendar', to: routes.dashboardCalendar, icon: RefreshCcw },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { label: 'Products', to: routes.inventory, icon: Boxes },
      { label: 'Stock Audit', to: '/inventory/stock-audit', icon: ShieldCheck },
      { label: 'Inventory Sync', to: routes.inventorySync, icon: RefreshCcw },
      { label: 'Receipts & Barcodes', to: '/receipts/queue', icon: ReceiptText },
      { label: 'Vision OCR', to: routes.vision, icon: ScanLine },
      { label: 'Pricing', to: routes.pricing, icon: CircleDollarSign, ownerOnly: true },
      { label: 'Forecasting', to: routes.forecasting, icon: BarChart3, ownerOnly: true },
    ],
  },
  {
    title: 'Orders',
    items: [
      { label: 'POS / New Sale', to: '/pos', icon: ShoppingCart },
      { label: 'Transactions', to: routes.transactions, icon: FileText },
      { label: 'Returns', to: '/returns', icon: RefreshCcw },
      { label: 'Purchase Orders', to: '/purchase-orders', icon: FolderKanban },
      { label: 'Suppliers', to: routes.suppliers, icon: Store },
      { label: 'Marketplace', to: routes.marketplace, icon: Building2 },
    ],
  },
  {
    title: 'Customers',
    items: [
      { label: 'All Customers', to: routes.customers, icon: Users },
      { label: 'Loyalty', to: routes.loyalty, icon: Sparkles },
      { label: 'Credit', to: routes.credit, icon: CreditCard },
      { label: 'WhatsApp', to: routes.whatsapp, icon: Webhook },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { label: 'Business Analytics', to: routes.analytics, icon: BarChart3, ownerOnly: true },
      { label: 'Market Intelligence', to: '/market-intelligence', icon: Megaphone, ownerOnly: true },
      { label: 'Decisions', to: routes.decisions, icon: BrainCircuit, ownerOnly: true },
      { label: 'Staff Performance', to: routes.staff, icon: Users },
      { label: 'Offline Data', to: routes.offline, icon: Globe2 },
    ],
  },
  {
    title: 'Financials',
    items: [
      { label: 'Finance Dashboard', to: routes.finance, icon: CircleDollarSign },
      { label: 'Ledger', to: routes.financeLedger, icon: FileText, ownerOnly: true },
      { label: 'Treasury', to: routes.financeTreasury, icon: Store, ownerOnly: true },
      { label: 'Loans', to: routes.financeLoans, icon: FolderKanban, ownerOnly: true },
      { label: 'GST / Tax', to: routes.gst, icon: FileText, ownerOnly: true },
      { label: 'E-Invoicing', to: routes.einvoice, icon: ReceiptText },
    ],
  },
  {
    title: 'AI Assistant',
    items: [
      { label: 'Chat', to: routes.ai, icon: Laptop2 },
      { label: 'AI Tools', to: routes.aiTools, icon: BrainCircuit },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Chain Management', to: routes.chain, icon: Store },
      { label: 'Developer Platform', to: routes.developer, icon: Zap },
      { label: 'KYC', to: routes.kyc, icon: ShieldCheck },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'Store Profile', to: routes.settings, icon: Store, ownerOnly: true },
      { label: 'Categories', to: '/store/categories', icon: Boxes, ownerOnly: true },
      { label: 'Tax Config', to: '/store/tax-config', icon: FileText, ownerOnly: true },
      { label: 'Language / i18n', to: routes.i18n, icon: Globe2 },
      { label: 'Security / MFA', to: routes.security, icon: LockKeyhole },
    ],
  },
];

const calendarDays = [1, 2, 3, 4, 5, 6];

export function sidebarNavGroups(role: 'owner' | 'staff' | null) {
  return navGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.ownerOnly || role === 'owner'),
  }));
}

export function Sidebar() {
  const collapsed = uiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = uiStore((state) => state.toggleSidebar);
  const role = authStore((state) => state.role);
  const groups = sidebarNavGroups(role);

  return (
    <aside className={cn('sidebar', collapsed && 'sidebar--collapsed')}>
      <div className="sidebar__brand">
        <div className="sidebar__logo">R</div>
        {!collapsed ? (
          <div>
            <div className="sidebar__name">RetailIQ</div>
            <div className="sidebar__tag">Retail operations hub</div>
          </div>
        ) : null}
        <button className="sidebar__collapse" type="button" onClick={toggleSidebar} aria-label="Toggle sidebar">
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <div className="sidebar__scroll">
        {groups.map((group) => (
          <div key={group.title} className="sidebar__group">
            {!collapsed ? <div className="sidebar__group-title">{group.title}</div> : null}
            <nav className="sidebar__nav">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => cn('sidebar__item', isActive && 'sidebar__item--active')}
                  >
                    <Icon className="sidebar__item-icon" />
                    {!collapsed ? <span>{item.label}</span> : null}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="sidebar__footer">
        <div className="sidebar__footer-card">
          <div className="sidebar__footer-title">Store health</div>
          {!collapsed ? <div className="sidebar__footer-subtitle">Quick pulse of the current branch.</div> : null}
          <div className="sidebar__footer-metrics">
            {calendarDays.map((day) => (
              <span key={day} />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
