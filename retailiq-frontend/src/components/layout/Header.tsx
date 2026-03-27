import { useEffect, useMemo, useState } from 'react';
import { Bell, Menu, Search, Slash, UserCircle2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { authStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';
import { routes } from '@/routes/routes';

const titleMap: Record<string, string> = {
  [routes.dashboard]: 'Dashboard',
  [routes.dashboardAlerts]: 'Smart Alerts',
  [routes.dashboardCalendar]: 'Financial Calendar',
  [routes.dashboardReports]: 'Reports',
  [routes.inventory]: 'Inventory',
  [routes.transactions]: 'Transactions',
  [routes.customers]: 'Customers',
  [routes.analytics]: 'Analytics',
  [routes.finance]: 'Financials',
  [routes.security]: 'Security / MFA',
  [routes.settings]: 'Store Profile',
  [routes.pricing]: 'Pricing',
  [routes.decisions]: 'Decisions',
  [routes.kyc]: 'KYC',
  [routes.developer]: 'Developer',
  [routes.aiTools]: 'AI Tools',
};

interface HeaderProps {
  onOpenPalette: () => void;
  onToggleSidebar: () => void;
}

export function Header({ onOpenPalette, onToggleSidebar }: HeaderProps) {
  const location = useLocation();
  const user = authStore((state) => state.user);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const title = useMemo(() => {
    const pathname = location.pathname;
    if (pathname.startsWith('/dashboard/alerts')) return 'Smart Alerts';
    if (pathname.startsWith('/dashboard/calendar')) return 'Financial Calendar';
    if (pathname.startsWith('/dashboard/reports')) return 'Reports';
    if (pathname.startsWith('/store')) return 'Store Profile';
    if (pathname.startsWith('/inventory')) return 'Inventory';
    if (pathname.startsWith('/purchase-orders')) return 'Purchase Orders';
    if (pathname.startsWith('/transactions')) return 'Transactions';
    if (pathname.startsWith('/customers')) return 'Customers';
    if (pathname.startsWith('/staff-performance')) return 'Staff Performance';
    if (pathname.startsWith('/market-intelligence')) return 'Market Intelligence';
    if (pathname.startsWith('/e-invoicing')) return 'E-Invoicing';
    if (pathname.startsWith('/ai-assistant')) return 'AI Assistant';
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
    if (pathname.startsWith('/transactions')) return ['Orders', 'Transactions'];
    if (pathname.startsWith('/customers')) return ['Customers'];
    if (pathname.startsWith('/analytics')) return ['Analytics'];
    if (pathname.startsWith('/finance')) return ['Financials'];
    if (pathname.startsWith('/store')) return ['Settings', 'Store Profile'];
    return [title];
  }, [location.pathname, title]);

  return (
    <header className={cn('header', scrolled && 'header--scrolled')}>
      <div className="header__title">
        <button className="header__menu" type="button" aria-label="Toggle navigation" onClick={onToggleSidebar}>
          <Menu size={18} />
        </button>
        <div>
          <div className="header__eyebrow">Retail operations</div>
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
        <button className="header__icon" type="button" aria-label="Notifications">
          <Bell size={18} />
          <span className="header__badge">3</span>
        </button>
        <div className="header__user">
          <UserCircle2 size={18} />
          <div>
            <div className="header__user-name">{user?.full_name ?? user?.email ?? 'Retail user'}</div>
            <div className="header__user-role">{user?.role ?? 'staff'}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
