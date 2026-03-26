import { useEffect, useMemo, useState } from 'react';
import { Bell, Menu, Search, UserCircle2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { authStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';
import { routes } from '@/routes/routes';

const titleMap: Record<string, string> = {
  [routes.dashboard]: 'Dashboard',
  [routes.inventory]: 'Inventory',
  [routes.transactions]: 'Transactions',
  [routes.customers]: 'Customers',
  [routes.analytics]: 'Analytics',
  [routes.finance]: 'Financials',
  [routes.settings]: 'Store Profile',
  [routes.pricing]: 'Pricing',
  [routes.decisions]: 'Decisions',
  [routes.kyc]: 'KYC',
  [routes.developer]: 'Developer',
};

interface HeaderProps {
  onOpenPalette: () => void;
}

export function Header({ onOpenPalette }: HeaderProps) {
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
    if (pathname.startsWith('/store')) return 'Store Profile';
    if (pathname.startsWith('/inventory')) return 'Inventory';
    if (pathname.startsWith('/suppliers')) return 'Suppliers';
    if (pathname.startsWith('/purchase-orders')) return 'Purchase Orders';
    if (pathname.startsWith('/transactions')) return 'Transactions';
    if (pathname.startsWith('/customers')) return 'Customers';
    if (pathname.startsWith('/staff-performance')) return 'Staff Performance';
    if (pathname.startsWith('/market-intelligence')) return 'Market Intelligence';
    if (pathname.startsWith('/e-invoicing')) return 'E-Invoicing';
    if (pathname.startsWith('/ai-assistant')) return 'AI Assistant';
    if (pathname.startsWith('/financial-calendar')) return 'Financial Calendar';
    const path = `/${pathname.split('/').filter(Boolean)[0] ?? 'dashboard'}`;
    return titleMap[path] ?? 'RetailIQ';
  }, [location.pathname]);

  return (
    <header className={cn('header', scrolled && 'header--scrolled')}>
      <div className="header__title">
        <button className="header__menu" type="button" aria-label="Open navigation">
          <Menu size={18} />
        </button>
        <div>
          <div className="header__eyebrow">Retail operations</div>
          <h1>{title}</h1>
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
