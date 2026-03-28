import { useEffect, useMemo, useState } from 'react';
import { Bell, Menu, Search, UserCircle2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { authStore } from '@/stores/authStore';
import { uiStore } from '@/stores/uiStore';
import { useStoreProfileQuery } from '@/hooks/store';
import { cn } from '@/utils/cn';
import { resolveBreadcrumbs, resolvePageTitle } from './navigation';
import { routes } from '@/routes/routes';

interface HeaderProps {
  onOpenPalette: () => void;
  onMenuClick?: () => void;
  isNavigationOpen?: boolean;
  storeName?: string;
}

export function Header({ onOpenPalette, onMenuClick, isNavigationOpen, storeName }: HeaderProps) {
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

  const title = useMemo(() => resolvePageTitle(location.pathname), [location.pathname]);
  const breadcrumbs = useMemo(() => resolveBreadcrumbs(location.pathname), [location.pathname]);
  const handleMenuClick = onMenuClick ?? toggleMobileNav;
  const navigationOpen = isNavigationOpen ?? mobileNavOpen;

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
          aria-label="Toggle navigation"
          aria-expanded={navigationOpen}
          onClick={handleMenuClick}
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
          <div className="header__store">{storeProfileQuery.data?.store_name ?? storeName ?? user?.mobile_number ?? 'RetailIQ'}</div>
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
                <div className="text-xs font-normal text-text-muted">{storeProfileQuery.data?.store_name ?? storeName ?? 'RetailIQ'}</div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate(routes.settingsProfile)}>Store profile</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate(routes.dashboard)}>Dashboard</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
