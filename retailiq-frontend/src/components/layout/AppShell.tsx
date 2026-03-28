import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { uiStore } from '@/stores/uiStore';

export function AppShell() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const collapsed = uiStore((state) => state.sidebarCollapsed);

  return (
    <div className="app-shell" style={{ gridTemplateColumns: collapsed ? 'var(--sidebar-collapsed) minmax(0, 1fr)' : 'var(--sidebar-width) minmax(0, 1fr)' }}>
      <Sidebar />
      <div className="app-shell__main">
        <Header onOpenPalette={() => setPaletteOpen(true)} />
        <main className="app-shell__content">
          <Outlet />
        </main>
      </div>
      <MobileNav />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
