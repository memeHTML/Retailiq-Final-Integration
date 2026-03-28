import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, ChevronDown, LogOut, Menu, Search, Slash, UserCircle2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';
import { routes } from '@/routes/routes';
import { useStoreProfileQuery } from '@/hooks/store';
import { clearSession } from '@/utils/session';

const titleMap: Record<string, string> = {
  [routes.dashboard]: 'Dashboard',
  [routes.dashboardAlerts]: 'Smart Alerts',
  [routes.dashboardCalendar]: 'Financial Calendar',
  [routes.dashboardReports]: 'Reports',
  [routes.inventory]: 'Inventory',
  [routes.pos]: 'Point of sale',
  [routes.transactions]: 'Transactions',
  [routes.customers]: 'Customers',
  [routes.analytics]: 'Analytics',
  [routes.finance]: 'Financials',
  [routes.financeAccounts]: 'Accounts',
  [routes.financeCreditScore]: 'Credit Score',
  [routes.financeKyc]: 'Finance KYC',
  [routes.financeLedger]: 'Ledger',
  [routes.financeTreasury]: 'Treasury',
  [routes.financeLoans]: 'Loans',
  [routes.settingsSecurity]: 'Security / MFA',
  [routes.settingsProfile]: 'Store Profile',
  [routes.settingsCategories]: 'Categories',
  [routes.settingsTax]: 'Tax Config',
  [routes.pricing]: 'Pricing',
  [routes.inventoryPricing]: 'Pricing',
  [routes.decisions]: 'AI Decisions',
  [routes.kyc]: 'KYC',
  [routes.developer]: 'Developer',
  [routes.ai]: 'AI Assistant',
  [routes.aiTools]: 'AI Tools',
  [routes.omnichannel]: 'Omnichannel',
  [routes.analyticsForecasting]: 'Forecasting',
  [routes.analyticsMarket]: 'Market Intelligence',
  [routes.analyticsStaff]: 'Staff Performance',
  [routes.analyticsOffline]: 'Offline Analytics',
};

interface HeaderProps {
  onOpenPalette: () => void;
  onMenuClick: () => void;
  storeName?: string;
}

export function Header({ onOpenPalette, onMenuClick, storeName }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = authStore((state) => state.user);
  const storeProfile = useStoreProfileQuery();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', onPointerDown);
    return () => window.removeEventListener('mousedown', onPointerDown);
  }, []);

  const title = useMemo(() => {
    const pathname = location.pathname;
    if (pathname.startsWith('/dashboard/alerts')) return 'Smart Alerts';
    if (pathname.startsWith('/dashboard/calendar')) return 'Financial Calendar';
    if (pathname.startsWith('/dashboard/reports')) return 'Reports';
    if (pathname.startsWith('/orders/pos')) return 'Point of sale';
    if (pathname.startsWith('/orders/transactions')) return 'Transactions';
    if (pathname.startsWith('/settings/categories')) return 'Categories';
    if (pathname.startsWith('/settings/tax')) return 'Tax Config';
    if (pathname.startsWith('/settings/security')) return 'Security / MFA';
    if (pathname.startsWith('/settings')) return 'Store Profile';
    if (pathname.startsWith('/store')) return 'Store Profile';
    if (pathname.startsWith('/inventory/pricing')) return 'Pricing';
    if (pathname.startsWith('/inventory')) return 'Inventory';
    if (pathname.startsWith('/omnichannel')) return 'Omnichannel';
    if (pathname.startsWith('/purchase-orders')) return 'Purchase Orders';
    if (pathname.startsWith('/customers')) return 'Customers';
    if (pathname.startsWith('/analytics/forecasting')) return 'Forecasting';
    if (pathname.startsWith('/analytics/market')) return 'Market Intelligence';
    if (pathname.startsWith('/analytics/staff')) return 'Staff Performance';
    if (pathname.startsWith('/analytics/offline')) return 'Offline Analytics';
    if (pathname.startsWith('/analytics')) return 'Analytics';
    if (pathname.startsWith('/staff-performance')) return 'Staff Performance';
    if (pathname.startsWith('/market-intelligence')) return 'Market Intelligence';
    if (pathname.startsWith('/e-invoicing')) return 'E-Invoicing';
    if (pathname.startsWith('/ai/tools')) return 'AI Tools';
    if (pathname.startsWith('/ai/decisions')) return 'AI Decisions';
    if (pathname.startsWith('/ai')) return 'AI Assistant';
    if (pathname.startsWith('/finance/accounts')) return 'Accounts';
    if (pathname.startsWith('/finance/credit-score')) return 'Credit Score';
    if (pathname.startsWith('/finance/kyc')) return 'Finance KYC';
    if (pathname.startsWith('/finance/ledger')) return 'Ledger';
    if (pathname.startsWith('/finance/treasury')) return 'Treasury';
    if (pathname.startsWith('/finance/loans')) return 'Loans';
    if (pathname.startsWith('/security')) return 'Security / MFA';
    if (pathname.startsWith('/financial-calendar')) return 'Financial Calendar';
    const path = `/${pathname.split('/').filter(Boolean)[0] ?? 'dashboard'}`;
    return titleMap[path] ?? 'RetailIQ';
  }, [location.pathname]);

  const crumbs = useMemo(() => {
    const pathname = location.pathname;
    if (pathname === routes.dashboard || pathname === '/') {
      return ['Dashboard', 'Overview'];
    }
    if (pathname.startsWith('/dashboard/alerts')) return ['Dashboard', 'Smart Alerts'];
    if (pathname.startsWith('/dashboard/calendar')) return ['Dashboard', 'Financial Calendar'];
    if (pathname.startsWith('/dashboard/reports')) return ['Dashboard', 'Reports'];
    if (pathname.startsWith('/inventory')) return ['Inventory'];
    if (pathname.startsWith('/inventory/pricing')) return ['Inventory', 'Pricing'];
    if (pathname.startsWith('/omnichannel')) return ['Orders', 'Omnichannel'];
    if (pathname.startsWith('/orders/pos')) return ['Orders', 'Point of sale'];
    if (pathname.startsWith('/orders/transactions')) return ['Orders', 'Transactions'];
    if (pathname.startsWith('/customers')) return ['Customers'];
    if (pathname.startsWith('/analytics/forecasting')) return ['Analytics', 'Forecasting'];
    if (pathname.startsWith('/analytics/market')) return ['Analytics', 'Market Intelligence'];
    if (pathname.startsWith('/analytics/staff')) return ['Analytics', 'Staff Performance'];
    if (pathname.startsWith('/analytics/offline')) return ['Analytics', 'Offline Analytics'];
    if (pathname.startsWith('/analytics')) return ['Analytics'];
    if (pathname.startsWith('/finance/accounts')) return ['Financials', 'Accounts'];
    if (pathname.startsWith('/finance/credit-score')) return ['Financials', 'Credit Score'];
    if (pathname.startsWith('/finance/kyc')) return ['Financials', 'Finance KYC'];
    if (pathname.startsWith('/finance/ledger')) return ['Financials', 'Ledger'];
    if (pathname.startsWith('/finance/treasury')) return ['Financials', 'Treasury'];
    if (pathname.startsWith('/finance/loans')) return ['Financials', 'Loans'];
    if (pathname.startsWith('/finance')) return ['Financials'];
    if (pathname.startsWith('/settings/categories')) return ['Settings', 'Categories'];
    if (pathname.startsWith('/settings/tax')) return ['Settings', 'Tax Config'];
    if (pathname.startsWith('/settings/security')) return ['Settings', 'Security / MFA'];
    if (pathname.startsWith('/settings')) return ['Settings', 'Store Profile'];
    if (pathname.startsWith('/ai/decisions')) return ['AI Assistant', 'AI Decisions'];
    if (pathname.startsWith('/ai/tools')) return ['AI Assistant', 'AI Tools'];
    if (pathname.startsWith('/ai')) return ['AI Assistant'];
    if (pathname.startsWith('/store')) return ['Settings', 'Store Profile'];
    return [title];
  }, [location.pathname, title]);

  const resolvedStoreName = storeName ?? storeProfile.data?.store_name ?? 'RetailIQ Store';

  return (
    <header className={cn('header', scrolled && 'header--scrolled')}>
      <div className="header__title">
        <button className="header__menu" type="button" aria-label="Toggle navigation" onClick={onMenuClick}>
          <Menu size={18} />
        </button>
        <div>
          <div className="header__eyebrow">Retail operations</div>
          <div className="header__store">{resolvedStoreName}</div>
          <h1>{title}</h1>
          <div className="header__breadcrumb" aria-label="Breadcrumb">
            {crumbs.map((crumb, index) => (
              <span key={`${crumb}-${index}`} className={cn('header__crumb', index === crumbs.length - 1 && 'header__crumb--current')}>
                {index > 0 ? <Slash size={10} className="header__crumb-separator" /> : null}
                {crumb}
              </span>
            ))}
          </div>
        </div>
      </div>

      <button className="header__search" type="button" onClick={onOpenPalette}>
        <Search size={16} />
        <span>Search pages, reports, and actions</span>
        <kbd>Ctrl K</kbd>
      </button>

      <div className="header__meta">
        <div className="header__store-chip" title={resolvedStoreName}>
          {resolvedStoreName}
        </div>
        <button className="header__icon" type="button" aria-label="Notifications">
          <Bell size={18} />
          <span className="header__badge">3</span>
        </button>
        <div className="header__user-wrap" ref={menuRef}>
          <button className="header__user" type="button" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}>
            <UserCircle2 size={18} />
            <div>
              <div className="header__user-name">{user?.full_name ?? user?.email ?? 'Retail user'}</div>
              <div className="header__user-role">{user?.role ?? 'staff'}</div>
            </div>
            <ChevronDown size={14} className="header__user-chevron" />
          </button>
          {menuOpen ? (
            <div className="header__user-menu" role="menu">
              <div className="header__user-menu-meta">
                <strong>{user?.full_name ?? 'Retail user'}</strong>
                <span>{user?.role ?? 'staff'}</span>
              </div>
              <button
                className="header__user-menu-item"
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  clearSession();
                  navigate('/login', { replace: true });
                }}
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
