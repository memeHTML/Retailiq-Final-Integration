import type { ComponentType } from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, Boxes, BrainCircuit, Building2, ChevronLeft, ChevronRight, CircleDollarSign, CreditCard, FileText, FolderKanban, Globe2, LayoutDashboard, LockKeyhole, Megaphone, ReceiptText, RefreshCcw, ScanLine, ShieldCheck, ShoppingCart, Sparkles, Store, Users, Webhook, Wrench, X, Zap } from 'lucide-react';
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
      { label: 'Stock Audit', to: routes.stockAudit, icon: ShieldCheck },
      { label: 'Inventory Sync', to: routes.inventorySync, icon: RefreshCcw },
      { label: 'Receipts & Barcodes', to: routes.inventoryReceipts, icon: ReceiptText },
      { label: 'Barcodes', to: routes.inventoryBarcodes, icon: FileText },
      { label: 'Vision OCR', to: routes.inventoryVision, icon: ScanLine },
      { label: 'Pricing', to: routes.pricing, icon: CircleDollarSign, ownerOnly: true },
      { label: 'Forecasting', to: routes.forecasting, icon: BarChart3, ownerOnly: true },
    ],
  },
  {
    title: 'Orders',
    items: [
      { label: 'Orders Hub', to: routes.orders, icon: ShoppingCart },
      { label: 'POS / New Sale', to: routes.ordersPos, icon: ShoppingCart },
      { label: 'Transactions', to: routes.ordersTransactions, icon: FileText },
      { label: 'Returns', to: routes.returns, icon: RefreshCcw },
      { label: 'Purchase Orders', to: routes.purchaseOrders, icon: FolderKanban },
      { label: 'Suppliers', to: routes.suppliers, icon: Store },
      { label: 'Marketplace', to: routes.marketplace, icon: Building2 },
      { label: 'Omnichannel', to: routes.omnichannel, icon: Megaphone },
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
      { label: 'Market Intelligence', to: routes.marketIntelligence, icon: Megaphone, ownerOnly: true },
      { label: 'Decisions', to: routes.decisions, icon: BrainCircuit, ownerOnly: true },
      { label: 'Staff Performance', to: routes.staff, icon: Users },
      { label: 'Offline Data', to: routes.offline, icon: Globe2 },
    ],
  },
  {
    title: 'Financials',
    items: [
      { label: 'Finance Dashboard', to: routes.finance, icon: CircleDollarSign, ownerOnly: true },
      { label: 'Accounts', to: routes.financeAccounts, icon: Building2, ownerOnly: true },
      { label: 'Credit Score', to: routes.financeCreditScore, icon: ShieldCheck, ownerOnly: true },
      { label: 'Finance KYC', to: routes.financeKyc, icon: ShieldCheck, ownerOnly: true },
      { label: 'Ledger', to: routes.financeLedger, icon: FileText, ownerOnly: true },
      { label: 'Treasury', to: routes.financeTreasury, icon: Store, ownerOnly: true },
      { label: 'Loans', to: routes.financeLoans, icon: FolderKanban, ownerOnly: true },
      { label: 'GST / Tax', to: routes.financeGst, icon: FileText, ownerOnly: true },
      { label: 'E-Invoicing', to: routes.financeEinvoice, icon: ReceiptText, ownerOnly: true },
    ],
  },
  {
    title: 'AI Assistant',
    items: [
      { label: 'Chat', to: routes.ai, icon: LayoutDashboard },
      { label: 'AI Tools', to: routes.aiTools, icon: BrainCircuit },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Chain Management', to: routes.chain, icon: Store },
      { label: 'Developer Platform', to: routes.developer, icon: Zap },
      { label: 'KYC', to: routes.kyc, icon: ShieldCheck },
      { label: 'Team', to: routes.team, icon: Users },
      { label: 'Maintenance', to: routes.ops, icon: Wrench },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'Store Profile', to: routes.settingsProfile, icon: Store, ownerOnly: true },
      { label: 'Categories', to: routes.settingsCategories, icon: Boxes, ownerOnly: true },
      { label: 'Tax Config', to: routes.settingsTax, icon: FileText, ownerOnly: true },
      { label: 'Security / MFA', to: routes.settingsSecurity, icon: LockKeyhole },
      { label: 'Language / i18n', to: routes.settingsI18n, icon: Globe2 },
    ],
  },
];

const calendarDays = [1, 2, 3, 4, 5, 6];

function filterGroups(role: 'owner' | 'staff' | null) {
  return navGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.ownerOnly || role === 'owner'),
  }));
}

export function Sidebar() {
  const collapsed = uiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = uiStore((state) => state.toggleSidebar);
  const role = authStore((state) => state.role);
  const groups = filterGroups(role);

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

type SidebarPanelProps = {
  collapsed: boolean;
  drawerMode?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
};

export function SidebarPanel({ collapsed, drawerMode = false, onToggleCollapse, onNavigate }: SidebarPanelProps) {
  const role = authStore((state) => state.role);
  const groups = filterGroups(role);

  return (
    <aside className={cn('sidebar', collapsed && 'sidebar--collapsed', drawerMode && 'sidebar--drawer')}>
      <div className="sidebar__brand">
        <div className="sidebar__logo">R</div>
        {!collapsed ? (
          <div>
            <div className="sidebar__name">RetailIQ</div>
            <div className="sidebar__tag">Retail operations hub</div>
          </div>
        ) : null}
        <button
          className="sidebar__collapse"
          type="button"
          onClick={onToggleCollapse}
          aria-label={drawerMode ? 'Close navigation' : 'Toggle sidebar'}
        >
          {drawerMode ? <X size={18} /> : collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
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
                    key={`${item.to}-${item.label}`}
                    to={item.to}
                    className={({ isActive }) => cn('sidebar__item', isActive && 'sidebar__item--active')}
                    onClick={onNavigate}
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
