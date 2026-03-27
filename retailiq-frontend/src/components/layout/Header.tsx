import { useEffect, useMemo, useState } from 'react';
import { Bell, Menu, Search, UserCircle2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { authStore } from '@/stores/authStore';
import { uiStore } from '@/stores/uiStore';
import { useStoreProfileQuery } from '@/hooks/store';
import { cn } from '@/utils/cn';
import { routes } from '@/routes/routes';

interface HeaderProps {
  onOpenPalette: () => void;
}

const routeTitles: Record<string, string> = {
  [routes.dashboard]: 'Dashboard',
  [routes.smartAlerts]: 'Smart Alerts',
  [routes.reports]: 'Reports',
  [routes.financialCalendar]: 'Financial Calendar',
  [routes.inventory]: 'Inventory',
  [routes.transactions]: 'Transactions',
  [routes.returns]: 'Returns',
  [routes.customers]: 'Customers',
  [routes.analytics]: 'Analytics',
  [routes.finance]: 'Financials',
  [routes.storeProfile]: 'Store Profile',
  [routes.storeCategories]: 'Store Categories',
  [routes.storeTaxConfig]: 'Tax Config',
  [routes.pricing]: 'Pricing',
  [routes.decisions]: 'Decisions',
  [routes.kyc]: 'KYC',
  [routes.developer]: 'Developer',
  [routes.operations]: 'Operations',
  [routes.inventoryReceipts]: 'Receipts',
  [routes.inventoryBarcodes]: 'Barcodes',
  [routes.inventoryVision]: 'Vision OCR',
  [routes.inventoryVisionReview]: 'Vision OCR',
  [routes.suppliers]: 'Suppliers',
  [routes.purchaseOrders]: 'Purchase Orders',
  [routes.marketplace]: 'Marketplace',
  [routes.chain]: 'Chain Management',
  [routes.marketIntelligence]: 'Market Intelligence',
  [routes.einvoice]: 'E-Invoicing',
  [routes.ai]: 'AI Assistant',
  [routes.loyalty]: 'Loyalty',
  [routes.credit]: 'Credit',
  [routes.forecasting]: 'Forecasting',
  [routes.pos]: 'POS',
  [routes.stockAudit]: 'Stock Audit',
};

type Breadcrumb = {
  label: string;
  to: string;
};

export function Header({ onOpenPalette }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = authStore((state) => state.user);
  const mobileNavOpen = uiStore((state) => state.mobileNavOpen);
  const toggleMobileNav = uiStore((state) => state.toggleMobileNav);
  const storeProfileQuery = useStoreProfileQuery();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const title = useMemo(() => {
    const pathname = location.pathname;
    if (pathname.startsWith(routes.storeCategories)) return 'Store Categories';
    if (pathname.startsWith(routes.storeTaxConfig)) return 'Tax Config';
    if (pathname.startsWith(routes.storeProfile)) return 'Store Profile';
    if (pathname.startsWith(routes.inventory)) return 'Inventory';
    if (pathname.startsWith(routes.inventoryReceipts)) return 'Receipts';
    if (pathname.startsWith(routes.inventoryBarcodes)) return 'Barcodes';
    if (pathname.startsWith(routes.inventoryVision)) return 'Vision OCR';
    if (pathname.startsWith(routes.suppliers)) return 'Suppliers';
    if (pathname.startsWith(routes.purchaseOrders)) return 'Purchase Orders';
    if (pathname.startsWith(routes.marketplace)) return 'Marketplace';
    if (pathname.startsWith(routes.chain)) return 'Chain Management';
    if (pathname.startsWith(routes.transactions)) return 'Transactions';
    if (pathname.startsWith(routes.returns)) return 'Returns';
    if (pathname.startsWith(routes.customers)) return 'Customers';
    if (pathname.startsWith(routes.staff)) return 'Staff Performance';
    if (pathname.startsWith(routes.marketIntelligence)) return 'Market Intelligence';
    if (pathname.startsWith(routes.einvoice)) return 'E-Invoicing';
    if (pathname.startsWith(routes.ai)) return 'AI Assistant';
    if (pathname.startsWith(routes.financialCalendar)) return 'Financial Calendar';
    if (pathname.startsWith(routes.operations)) return 'Operations';

    const path = `/${pathname.split('/').filter(Boolean)[0] ?? 'dashboard'}`;
    return routeTitles[path] ?? 'RetailIQ';
  }, [location.pathname]);

  const breadcrumbs = useMemo(() => {
    const chain: Breadcrumb[] = [{ label: 'RetailIQ', to: routes.dashboard }];
    if (title !== 'RetailIQ') {
      chain.push({ label: title, to: location.pathname });
    }

    return chain;
  }, [location.pathname, title]);

  const handleLogout = () => {
    authStore.getState().clearAuth();
    navigate(routes.login, { replace: true });
  };

  return (
    <header className={cn('header', scrolled && 'header--scrolled')}>
      <div className="header__title">
        <button
          className="header__menu"
          type="button"
          aria-label="Open navigation"
          aria-expanded={mobileNavOpen}
          onClick={toggleMobileNav}
        >
          <Menu size={18} />
        </button>
        <div className="header__title-stack">
          <div className="header__eyebrow">Retail operations</div>
          <nav className="header__breadcrumbs" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.label} className="header__breadcrumb-group">
                <span className={cn('header__breadcrumb', index === breadcrumbs.length - 1 && 'header__breadcrumb--current')}>
                  {crumb.label}
                </span>
                {index < breadcrumbs.length - 1 ? <span className="header__breadcrumb-separator">/</span> : null}
              </span>
            ))}
          </nav>
          <h1>{title}</h1>
          <div className="header__store">{storeProfileQuery.data?.store_name ?? user?.mobile_number ?? 'RetailIQ'}</div>
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="header__user" aria-label="Open user menu">
              <UserCircle2 size={18} />
              <div>
                <div className="header__user-name">{user?.full_name ?? user?.email ?? 'Retail user'}</div>
                <div className="header__user-role">{user?.role ?? 'staff'}</div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="space-y-1">
                <div>{user?.full_name ?? 'Retail user'}</div>
                <div className="text-xs font-normal text-text-muted">{storeProfileQuery.data?.store_name ?? 'RetailIQ'}</div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate(routes.storeProfile)}>Store profile</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate(routes.dashboard)}>Dashboard</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
