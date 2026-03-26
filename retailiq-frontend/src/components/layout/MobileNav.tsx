import { NavLink } from 'react-router-dom';
import { BarChart3, Boxes, Home, ShoppingCart, Users } from 'lucide-react';
import { routes } from '@/routes/routes';
import { cn } from '@/utils/cn';
import { uiStore } from '@/stores/uiStore';
import { authStore } from '@/stores/authStore';
import { sidebarNavGroups } from './Sidebar';
import { Sheet } from '@/components/ui/Sheet';

const items = [
  { label: 'Home', to: routes.dashboard, icon: Home },
  { label: 'Inventory', to: routes.inventory, icon: Boxes },
  { label: 'POS', to: routes.pos, icon: ShoppingCart },
  { label: 'Customers', to: routes.customers, icon: Users },
  { label: 'Analytics', to: routes.analytics, icon: BarChart3 },
];

export function MobileNav() {
  const open = uiStore((state) => state.mobileNavOpen);
  const setOpen = uiStore((state) => state.setMobileNavOpen);
  const role = authStore((state) => state.role);
  const groups = sidebarNavGroups(role);

  return (
    <>
      <nav className="mobile-nav" aria-label="Primary">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn('mobile-nav__item', isActive && 'mobile-nav__item--active')}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <Sheet open={open} onOpenChange={setOpen} title="Navigation" description="Jump to any RetailIQ section" side="left">
        <div className="grid gap-5">
          {groups.map((group) => (
            <section key={group.title} className="grid gap-2">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">{group.title}</div>
              <div className="grid gap-2">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) => cn('sidebar__item', 'h-11', isActive && 'sidebar__item--active')}
                    >
                      <Icon className="sidebar__item-icon" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </Sheet>
    </>
  );
}
