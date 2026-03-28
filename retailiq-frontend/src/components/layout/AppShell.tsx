import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar, SidebarPanel } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { uiStore } from '@/stores/uiStore';
import { useStoreProfileQuery } from '@/hooks/store';

export function AppShell() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => (typeof window === 'undefined' ? false : window.innerWidth < 1120));
  const location = useLocation();
  const collapsed = uiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = uiStore((state) => state.toggleSidebar);
  const storeProfile = useStoreProfileQuery();

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1120);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileNavOpen]);

  const storeName = useMemo(() => {
    const profile = storeProfile.data;
    return profile?.store_name ?? 'RetailIQ Store';
  }, [storeProfile.data]);

  const handleMenuClick = () => {
    if (isMobile) {
      setMobileNavOpen((open) => !open);
      return;
    }

    toggleSidebar();
  };

  return (
    <div className="app-shell" style={{ gridTemplateColumns: collapsed ? 'var(--sidebar-collapsed) minmax(0, 1fr)' : 'var(--sidebar-width) minmax(0, 1fr)' }}>
      <Sidebar />
      <div className="app-shell__main">
        <Header
          onOpenPalette={() => setPaletteOpen(true)}
          onMenuClick={handleMenuClick}
          isNavigationOpen={mobileNavOpen}
          storeName={storeName}
        />
        <main className="app-shell__content">
          <Outlet />
        </main>
      </div>
      {isMobile && mobileNavOpen ? (
        <div className="app-shell__drawer-backdrop" role="presentation" onClick={() => setMobileNavOpen(false)}>
          <div className="app-shell__drawer" role="dialog" aria-label="Navigation menu" onClick={(event) => event.stopPropagation()}>
            <SidebarPanel
              collapsed={false}
              drawerMode
              onToggleCollapse={() => setMobileNavOpen(false)}
              onNavigate={() => setMobileNavOpen(false)}
            />
          </div>
        </div>
      ) : null}
      <MobileNav />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
